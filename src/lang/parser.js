// Recursive-descent parser for the Object Pascal subset supported by the
// Delphi-IDE prototype. Produces an AST a tree-walking interpreter can run.
//
// Coverage: unit/uses/interface/implementation shape, type sections with
// class declarations (fields, method headers, properties), var/const
// sections, procedure & function implementations, all common statements
// (if/while/for/repeat/case/with/try/begin/assignment/call) and full
// Delphi operator precedence. Things deliberately out of scope: generics,
// interfaces (apart from `class(...)` ancestor lists), records, sets,
// arrays, RTTI.

import { tokenize } from './lexer.js'

export class ParseError extends Error {
  constructor(message, line, col) {
    super(message)
    this.line = line
    this.col = col
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens
    this.pos = 0
  }

  peek(offset = 0) { return this.tokens[this.pos + offset] }
  current() { return this.tokens[this.pos] }
  advance() { return this.tokens[this.pos++] }

  isAtEnd() { return this.current().kind === 'eof' }

  check(kindOrLower) {
    const t = this.current()
    if (t.kind === 'eof') return false
    return t.kind === kindOrLower || t.lower === kindOrLower || t.value === kindOrLower
  }

  match(...kinds) {
    for (const k of kinds) {
      if (this.check(k)) { this.advance(); return true }
    }
    return false
  }

  expect(value, message) {
    const t = this.current()
    if (t.kind === value || t.lower === value || t.value === value) return this.advance()
    throw new ParseError(message || `Expected '${value}', got '${t.value}'`, t.line, t.col)
  }

  expectIdent(message = 'Identifier expected') {
    const t = this.current()
    if (t.kind !== 'ident') throw new ParseError(message, t.line, t.col)
    return this.advance()
  }

  // ─── top-level ─────────────────────────────────────────────────────────

  parseUnit() {
    const unitTok = this.expect('unit', "'unit' expected")
    const name = this.expectIdent('Unit name expected').value
    this.expect(';')

    this.expect('interface', "'interface' expected")
    const interfaceSection = this.parseSection(true)

    this.expect('implementation', "'implementation' expected")
    const implementationSection = this.parseSection(false)

    if (this.match('initialization')) {
      while (!this.check('finalization') && !this.check('end')) this.advance()
    }
    if (this.match('finalization')) {
      while (!this.check('end')) this.advance()
    }

    this.expect('end', "'end' expected at end of unit")
    this.expect('.', "'.' expected after final 'end'")

    return {
      type: 'Unit',
      name,
      interface: interfaceSection,
      implementation: implementationSection,
      line: unitTok.line,
      col: unitTok.col,
    }
  }

  parseSection(isInterface) {
    const section = { uses: [], types: [], vars: [], consts: [], procs: [] }

    while (!this.isAtEnd()) {
      const t = this.current()

      if (t.lower === 'implementation' || t.lower === 'initialization' ||
          t.lower === 'finalization' || (t.lower === 'end' && !isInterface)) break

      if (t.lower === 'uses') { this.parseUses(section); continue }
      if (t.lower === 'type') { this.parseTypeSection(section); continue }
      if (t.lower === 'var') { this.parseVarSection(section); continue }
      if (t.lower === 'const') { this.parseConstSection(section); continue }
      if (t.lower === 'resourcestring') { this.parseConstSection(section); continue }
      if (t.lower === 'procedure' || t.lower === 'function') {
        section.procs.push(this.parseRoutine(!isInterface))
        continue
      }
      if (t.lower === '$r' || (t.kind === 'symbol' && t.value === '{$R')) {
        this.advance()
        continue
      }
      throw new ParseError(`Unexpected token '${t.value}' in ${isInterface ? 'interface' : 'implementation'} section`, t.line, t.col)
    }

    return section
  }

  parseUses(section) {
    this.expect('uses')
    do {
      const name = this.expectIdent('Unit name expected').value
      let qualified = name
      while (this.match('.')) qualified += '.' + this.expectIdent('Unit name expected').value
      section.uses.push(qualified)
    } while (this.match(','))
    this.expect(';')
  }

  // ─── type section ──────────────────────────────────────────────────────

  parseTypeSection(section) {
    this.expect('type')
    while (this.current().kind === 'ident') {
      const nameTok = this.advance()
      this.expect('=')
      if (this.check('class')) {
        const cls = this.parseClass(nameTok.value)
        section.types.push(cls)
      } else {
        // unsupported type alias — skip until ';' for forward compatibility
        while (!this.check(';') && !this.isAtEnd()) this.advance()
      }
      this.expect(';')
    }
  }

  parseClass(name) {
    const classTok = this.expect('class')
    let ancestor = null
    if (this.match('(')) {
      ancestor = this.expectIdent('Ancestor class name expected').value
      this.expect(')')
    }
    const cls = {
      type: 'ClassDecl', name, ancestor, line: classTok.line, col: classTok.col,
      fields: [], methods: [], properties: [],
    }
    let visibility = 'published'
    while (!this.check('end')) {
      const t = this.current()
      if (['private', 'protected', 'public', 'published'].includes(t.lower)) {
        visibility = t.lower
        this.advance()
        continue
      }
      if (t.lower === 'procedure' || t.lower === 'function') {
        cls.methods.push(this.parseMethodHeader(visibility))
        continue
      }
      if (t.lower === 'property') {
        cls.properties.push(this.parsePropertyDecl(visibility))
        continue
      }
      if (t.kind === 'ident') {
        const fields = this.parseFieldDecl(visibility)
        cls.fields.push(...fields)
        continue
      }
      throw new ParseError(`Unexpected token '${t.value}' in class declaration`, t.line, t.col)
    }
    this.expect('end')
    return cls
  }

  parseFieldDecl(visibility) {
    const names = [this.expectIdent().value]
    while (this.match(',')) names.push(this.expectIdent().value)
    this.expect(':')
    const typeName = this.parseTypeRef()
    this.expect(';')
    return names.map((n) => ({ name: n, typeName, visibility }))
  }

  parseTypeRef() {
    // Accept identifiers, qualified identifiers, and the `string` keyword.
    if (this.check('string')) { this.advance(); return 'string' }
    const head = this.expectIdent('Type name expected').value
    let out = head
    while (this.match('.')) out += '.' + this.expectIdent('Type name expected').value
    return out
  }

  parsePropertyDecl(visibility) {
    const propTok = this.expect('property')
    const name = this.expectIdent('Property name expected').value
    this.expect(':')
    const typeName = this.parseTypeRef()
    // Skip read/write/default clauses until ';'
    while (!this.check(';') && !this.isAtEnd()) this.advance()
    this.expect(';')
    return { name, typeName, visibility, line: propTok.line, col: propTok.col }
  }

  parseMethodHeader(visibility) {
    const kindTok = this.advance() // procedure or function
    const name = this.expectIdent('Method name expected').value
    const params = this.parseParamList()
    let returnType = null
    if (kindTok.lower === 'function') {
      this.expect(':')
      returnType = this.parseTypeRef()
    }
    this.expect(';')
    // skip directives like virtual; override; etc.
    while (['virtual', 'override', 'abstract', 'reintroduce', 'overload', 'message'].includes(this.current().lower)) {
      this.advance()
      while (this.current().kind === 'ident' || this.current().kind === 'integer' || this.current().kind === 'string') this.advance()
      this.expect(';')
    }
    return { name, params, returnType, kind: kindTok.lower, visibility, line: kindTok.line, col: kindTok.col }
  }

  // ─── routines ──────────────────────────────────────────────────────────

  parseRoutine(withBody) {
    const kindTok = this.advance() // procedure | function
    const qualified = this.expectIdent('Routine name expected').value
    let className = null
    let routineName = qualified
    if (this.match('.')) {
      className = qualified
      routineName = this.expectIdent('Routine name expected').value
    }
    const params = this.parseParamList()
    let returnType = null
    if (kindTok.lower === 'function') {
      this.expect(':')
      returnType = this.parseTypeRef()
    }
    this.expect(';')

    // Optional directives before body
    while (['overload', 'inline'].includes(this.current().lower)) {
      this.advance(); this.expect(';')
    }

    let locals = []
    let body = null
    if (withBody) {
      while (this.check('var') || this.check('const')) {
        if (this.match('var')) locals.push(...this.parseLocalVars())
        else this.parseConstSection({ consts: [] }) // tolerated, ignored
      }
      body = this.parseBlock()
      this.expect(';')
    }
    return {
      type: 'Routine', kind: kindTok.lower, className, name: routineName,
      params, returnType, locals, body,
      line: kindTok.line, col: kindTok.col,
    }
  }

  parseParamList() {
    const out = []
    if (!this.match('(')) return out
    if (this.match(')')) return out
    do {
      let mode = 'value'
      if (this.match('var')) mode = 'var'
      else if (this.match('const')) mode = 'const'
      else if (this.match('out')) mode = 'out'
      const names = [this.expectIdent('Parameter name expected').value]
      while (this.match(',')) names.push(this.expectIdent('Parameter name expected').value)
      let typeName = null
      if (this.match(':')) typeName = this.parseTypeRef()
      let defaultValue = null
      if (this.match('=')) defaultValue = this.parseExpression()
      for (const n of names) out.push({ name: n, typeName, mode, defaultValue })
    } while (this.match(';') || this.match(','))
    this.expect(')')
    return out
  }

  parseLocalVars() {
    // `var` already consumed by caller
    const out = []
    while (this.current().kind === 'ident') {
      const names = [this.expectIdent().value]
      while (this.match(',')) names.push(this.expectIdent().value)
      this.expect(':')
      const typeName = this.parseTypeRef()
      let initializer = null
      if (this.match('=')) initializer = this.parseExpression()
      this.expect(';')
      for (const n of names) out.push({ name: n, typeName, initializer })
    }
    return out
  }

  parseVarSection(section) {
    this.expect('var')
    while (this.current().kind === 'ident') {
      const names = [this.expectIdent().value]
      while (this.match(',')) names.push(this.expectIdent().value)
      this.expect(':')
      const typeName = this.parseTypeRef()
      let initializer = null
      if (this.match('=')) initializer = this.parseExpression()
      this.expect(';')
      for (const n of names) section.vars.push({ name: n, typeName, initializer })
    }
  }

  parseConstSection(section) {
    this.expect(this.current().lower) // const | resourcestring
    while (this.current().kind === 'ident') {
      const name = this.expectIdent().value
      let typeName = null
      if (this.match(':')) typeName = this.parseTypeRef()
      this.expect('=')
      const value = this.parseExpression()
      this.expect(';')
      section.consts.push({ name, typeName, value })
    }
  }

  // ─── statements ────────────────────────────────────────────────────────

  parseBlock() {
    const beginTok = this.expect('begin')
    const stmts = []
    while (!this.check('end')) {
      const stmt = this.parseStatement()
      if (stmt) stmts.push(stmt)
      if (!this.match(';')) break
    }
    this.expect('end')
    return { type: 'Block', stmts, line: beginTok.line, col: beginTok.col }
  }

  parseStatement() {
    const t = this.current()

    if (t.kind === 'eof' || t.lower === 'end' || t.lower === 'until' ||
        t.lower === 'else' || t.lower === 'finally' || t.lower === 'except') return null

    if (t.lower === 'begin') return this.parseBlock()
    if (t.lower === 'if') return this.parseIf()
    if (t.lower === 'while') return this.parseWhile()
    if (t.lower === 'for') return this.parseFor()
    if (t.lower === 'repeat') return this.parseRepeat()
    if (t.lower === 'case') return this.parseCase()
    if (t.lower === 'with') return this.parseWith()
    if (t.lower === 'try') return this.parseTry()
    if (t.lower === 'raise') { this.advance(); const expr = this.check(';') ? null : this.parseExpression(); return { type: 'Raise', value: expr, line: t.line, col: t.col } }
    if (t.lower === 'exit') { this.advance(); let arg = null; if (this.match('(')) { arg = this.parseExpression(); this.expect(')') } return { type: 'Exit', value: arg, line: t.line, col: t.col } }
    if (t.lower === 'break') { this.advance(); return { type: 'Break', line: t.line, col: t.col } }
    if (t.lower === 'continue') { this.advance(); return { type: 'Continue', line: t.line, col: t.col } }

    return this.parseAssignmentOrCall()
  }

  parseAssignmentOrCall() {
    const lhs = this.parseDesignator()
    if (this.match(':=')) {
      const rhs = this.parseExpression()
      return { type: 'Assign', target: lhs, value: rhs, line: lhs.line, col: lhs.col }
    }
    // standalone call/identifier — interpreter executes for side effects
    return { type: 'ExprStmt', expr: lhs, line: lhs.line, col: lhs.col }
  }

  parseIf() {
    const tok = this.expect('if')
    const cond = this.parseExpression()
    this.expect('then', "'then' expected")
    const thenStmt = this.parseStatement()
    let elseStmt = null
    if (this.match('else')) elseStmt = this.parseStatement()
    return { type: 'If', cond, then: thenStmt, else: elseStmt, line: tok.line, col: tok.col }
  }

  parseWhile() {
    const tok = this.expect('while')
    const cond = this.parseExpression()
    this.expect('do', "'do' expected")
    const body = this.parseStatement()
    return { type: 'While', cond, body, line: tok.line, col: tok.col }
  }

  parseFor() {
    const tok = this.expect('for')
    const varName = this.expectIdent('Loop variable expected').value
    this.expect(':=', "':=' expected")
    const start = this.parseExpression()
    const direction = this.match('downto') ? 'downto' : (this.expect('to', "'to' or 'downto' expected"), 'to')
    const stop = this.parseExpression()
    this.expect('do', "'do' expected")
    const body = this.parseStatement()
    return { type: 'For', varName, start, stop, direction, body, line: tok.line, col: tok.col }
  }

  parseRepeat() {
    const tok = this.expect('repeat')
    const stmts = []
    while (!this.check('until')) {
      const stmt = this.parseStatement()
      if (stmt) stmts.push(stmt)
      if (!this.match(';')) break
    }
    this.expect('until')
    const cond = this.parseExpression()
    return { type: 'Repeat', stmts, cond, line: tok.line, col: tok.col }
  }

  parseCase() {
    const tok = this.expect('case')
    const subject = this.parseExpression()
    this.expect('of')
    const branches = []
    let elseBranch = null
    while (!this.check('end') && !this.check('else')) {
      const labels = [this.parseCaseLabel()]
      while (this.match(',')) labels.push(this.parseCaseLabel())
      this.expect(':')
      const stmt = this.parseStatement()
      branches.push({ labels, stmt })
      if (!this.match(';')) break
    }
    if (this.match('else')) {
      const stmts = []
      while (!this.check('end')) {
        const stmt = this.parseStatement()
        if (stmt) stmts.push(stmt)
        if (!this.match(';')) break
      }
      elseBranch = { type: 'Block', stmts, line: tok.line, col: tok.col }
    }
    this.expect('end')
    return { type: 'Case', subject, branches, else: elseBranch, line: tok.line, col: tok.col }
  }

  parseCaseLabel() {
    const lo = this.parseExpression()
    if (this.match('..')) {
      const hi = this.parseExpression()
      return { kind: 'range', lo, hi }
    }
    return { kind: 'single', value: lo }
  }

  parseWith() {
    const tok = this.expect('with')
    const items = [this.parseDesignator()]
    while (this.match(',')) items.push(this.parseDesignator())
    this.expect('do')
    const body = this.parseStatement()
    return { type: 'With', items, body, line: tok.line, col: tok.col }
  }

  parseTry() {
    const tok = this.expect('try')
    const tryStmts = []
    while (!this.check('except') && !this.check('finally')) {
      const stmt = this.parseStatement()
      if (stmt) tryStmts.push(stmt)
      if (!this.match(';')) break
    }
    if (this.match('except')) {
      const handlerStmts = []
      while (!this.check('end')) {
        const stmt = this.parseStatement()
        if (stmt) handlerStmts.push(stmt)
        if (!this.match(';')) break
      }
      this.expect('end')
      return { type: 'TryExcept', tryStmts, handlerStmts, line: tok.line, col: tok.col }
    }
    this.expect('finally')
    const finallyStmts = []
    while (!this.check('end')) {
      const stmt = this.parseStatement()
      if (stmt) finallyStmts.push(stmt)
      if (!this.match(';')) break
    }
    this.expect('end')
    return { type: 'TryFinally', tryStmts, finallyStmts, line: tok.line, col: tok.col }
  }

  // ─── expressions ──────────────────────────────────────────────────────

  parseExpression() { return this.parseRelational() }

  parseRelational() {
    let left = this.parseAddSub()
    while (true) {
      const t = this.current()
      const op = t.value
      if (['=', '<>', '<', '>', '<=', '>='].includes(op) || ['in', 'is', 'as'].includes(t.lower)) {
        this.advance()
        const right = this.parseAddSub()
        left = { type: 'BinaryOp', op: t.lower === 'in' || t.lower === 'is' || t.lower === 'as' ? t.lower : op, left, right, line: t.line, col: t.col }
        continue
      }
      break
    }
    return left
  }

  parseAddSub() {
    let left = this.parseMulDiv()
    while (true) {
      const t = this.current()
      if (['+', '-'].includes(t.value) || ['or', 'xor'].includes(t.lower)) {
        this.advance()
        const right = this.parseMulDiv()
        const op = ['+', '-'].includes(t.value) ? t.value : t.lower
        left = { type: 'BinaryOp', op, left, right, line: t.line, col: t.col }
        continue
      }
      break
    }
    return left
  }

  parseMulDiv() {
    let left = this.parseUnary()
    while (true) {
      const t = this.current()
      if (['*', '/'].includes(t.value) || ['div', 'mod', 'and', 'shl', 'shr'].includes(t.lower)) {
        this.advance()
        const right = this.parseUnary()
        const op = ['*', '/'].includes(t.value) ? t.value : t.lower
        left = { type: 'BinaryOp', op, left, right, line: t.line, col: t.col }
        continue
      }
      break
    }
    return left
  }

  parseUnary() {
    const t = this.current()
    if (t.value === '+' || t.value === '-' || t.lower === 'not' || t.value === '@') {
      this.advance()
      const operand = this.parseUnary()
      return { type: 'UnaryOp', op: t.value === '@' ? '@' : (t.lower === 'not' ? 'not' : t.value), operand, line: t.line, col: t.col }
    }
    return this.parseDesignator()
  }

  parseDesignator() {
    let node = this.parsePrimary()
    while (true) {
      const t = this.current()
      if (t.value === '.') {
        this.advance()
        const member = this.expectIdent('Identifier expected after .').value
        node = { type: 'Member', object: node, name: member, line: t.line, col: t.col }
        continue
      }
      if (t.value === '(') {
        this.advance()
        const args = []
        if (!this.check(')')) {
          args.push(this.parseExpression())
          while (this.match(',')) args.push(this.parseExpression())
        }
        this.expect(')')
        node = { type: 'Call', callee: node, args, line: t.line, col: t.col }
        continue
      }
      if (t.value === '[') {
        this.advance()
        const indices = [this.parseExpression()]
        while (this.match(',')) indices.push(this.parseExpression())
        this.expect(']')
        node = { type: 'Index', object: node, indices, line: t.line, col: t.col }
        continue
      }
      if (t.value === '^') {
        this.advance()
        node = { type: 'Deref', object: node, line: t.line, col: t.col }
        continue
      }
      break
    }
    return node
  }

  parsePrimary() {
    const t = this.current()
    if (t.kind === 'integer') { this.advance(); return { type: 'IntLit', value: t.value, line: t.line, col: t.col } }
    if (t.kind === 'real') { this.advance(); return { type: 'RealLit', value: t.value, line: t.line, col: t.col } }
    if (t.kind === 'string') { this.advance(); return { type: 'StringLit', value: t.value, line: t.line, col: t.col } }
    if (t.lower === 'true') { this.advance(); return { type: 'BoolLit', value: true, line: t.line, col: t.col } }
    if (t.lower === 'false') { this.advance(); return { type: 'BoolLit', value: false, line: t.line, col: t.col } }
    if (t.lower === 'nil') { this.advance(); return { type: 'NilLit', line: t.line, col: t.col } }
    if (t.lower === 'self') { this.advance(); return { type: 'Self', line: t.line, col: t.col } }
    if (t.lower === 'result') { this.advance(); return { type: 'Ident', name: 'Result', line: t.line, col: t.col } }
    if (t.lower === 'inherited') {
      this.advance()
      let target = null
      if (this.current().kind === 'ident') target = this.expectIdent().value
      return { type: 'Inherited', target, line: t.line, col: t.col }
    }
    if (t.value === '(') {
      this.advance()
      const inner = this.parseExpression()
      this.expect(')')
      return inner
    }
    if (t.kind === 'ident') { this.advance(); return { type: 'Ident', name: t.value, line: t.line, col: t.col } }

    throw new ParseError(`Unexpected token '${t.value}'`, t.line, t.col)
  }
}

export function parseUnit(source) {
  const tokens = tokenize(source)
  const parser = new Parser(tokens)
  return parser.parseUnit()
}
