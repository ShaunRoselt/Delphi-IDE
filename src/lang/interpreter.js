// Tree-walking interpreter for the Object Pascal subset produced by the
// parser. Designed to make a running form actually behave: component
// property reads/writes, control flow, user-defined procedures, and a
// useful slice of the RTL via `builtins.js`.
//
// The interpreter is host-agnostic — it talks to the running form through
// a `host` object passed in. That object owns the component store, alert
// routine, and any other side-effecting bits.

import { parseUnit, ParseError } from './parser.js'
import { LexError } from './lexer.js'
import { BUILTINS, getBuiltin, formatPascalValue, RuntimeBuiltinError } from './builtins.js'

const COMPONENT_METHODS = {
  show: (target, host) => { host.showForm?.(target); return null },
  hide: (target, host) => { host.hideForm?.(target); return null },
  close: (target, host) => { host.closeForm?.(target); return null },
  free: () => null,
  setfocus: (target, host) => { host.focusComponent?.(target.id); return null },
  clear: (target) => {
    if (target.props?.Lines !== undefined) target.props.Lines = []
    if (target.props?.Text !== undefined) target.props.Text = ''
    if (target.props?.Caption !== undefined && target.type === 'TLabel') target.props.Caption = ''
    return null
  },
  refresh: () => null,
  update: () => null,
}

const LINES_METHODS = {
  add: (compRef, args) => {
    const c = compRef.target
    c.props.Lines = c.props.Lines || []
    c.props.Lines.push(String(formatPascalValue(args[0])))
    return null
  },
  clear: (compRef) => { compRef.target.props.Lines = []; return null },
  insert: (compRef, args) => {
    const c = compRef.target
    c.props.Lines = c.props.Lines || []
    const idx = Math.max(0, Math.min(c.props.Lines.length, (args[0] | 0)))
    c.props.Lines.splice(idx, 0, String(formatPascalValue(args[1])))
    return null
  },
  delete: (compRef, args) => {
    const c = compRef.target
    if (!Array.isArray(c.props.Lines)) return null
    const idx = args[0] | 0
    if (idx >= 0 && idx < c.props.Lines.length) c.props.Lines.splice(idx, 1)
    return null
  },
}

const BOOL_PROPS = new Set(['Visible', 'Enabled', 'Checked', 'ReadOnly', 'Default', 'Cancel', 'AutoSize', 'Transparent', 'WordWrap', 'Sorted', 'MultiSelect', 'Smooth', 'Down', 'Flat', 'AllowGrayed'])
const INT_PROPS = new Set(['Left', 'Top', 'Width', 'Height', 'Position', 'Min', 'Max', 'ItemIndex', 'TabOrder', 'Step', 'MaxLength', 'GroupIndex', 'ColCount', 'RowCount', 'FixedCols', 'FixedRows', 'Interval', 'ActivePageIndex'])

export class RuntimeError extends Error {
  constructor(message, line, col) {
    super(message)
    this.line = line
    this.col = col
  }
}

class Scope {
  constructor(parent = null) {
    this.parent = parent
    this.vars = new Map()
  }
  define(name, value) { this.vars.set(name.toLowerCase(), { value }) }
  resolve(name) {
    const key = name.toLowerCase()
    if (this.vars.has(key)) return this.vars.get(key)
    return this.parent ? this.parent.resolve(name) : null
  }
}

class BreakSignal { constructor() { this.kind = 'break' } }
class ContinueSignal { constructor() { this.kind = 'continue' } }
class ExitSignal { constructor(value) { this.kind = 'exit'; this.value = value } }
class RaiseSignal { constructor(message) { this.kind = 'raise'; this.message = message } }

export class Program {
  constructor(unit, host) {
    this.unit = unit
    this.host = host
    this.routines = new Map()
    this.classes = new Map()
    this.globals = new Scope()

    for (const t of [...(unit.interface.types || []), ...(unit.implementation.types || [])]) {
      if (t.type === 'ClassDecl') this.classes.set(t.name.toLowerCase(), t)
    }
    for (const r of [...(unit.interface.procs || []), ...(unit.implementation.procs || [])]) {
      if (!r.body) continue
      this.routines.set(r.name.toLowerCase(), r)
    }
    for (const v of [...(unit.interface.vars || []), ...(unit.implementation.vars || [])]) {
      this.globals.define(v.name, defaultForType(v.typeName))
    }
    for (const c of [...(unit.interface.consts || []), ...(unit.implementation.consts || [])]) {
      this.globals.define(c.name, evalConstExpr(c.value))
    }
  }

  findHandler(name) {
    return this.routines.get(name.toLowerCase()) || null
  }

  callHandler(name, sender = null) {
    const routine = this.findHandler(name)
    if (!routine) throw new RuntimeError(`Handler '${name}' is not implemented in this unit`, 1, 1)
    const interpreter = new Interpreter(this)
    return interpreter.callRoutine(routine, sender ? [sender] : [])
  }
}

function defaultForType(typeName) {
  if (!typeName) return null
  const t = typeName.toLowerCase()
  if (t === 'integer' || t === 'cardinal' || t === 'int64' || t === 'byte' || t === 'word' || t === 'longint') return 0
  if (t === 'real' || t === 'double' || t === 'single' || t === 'extended' || t === 'currency') return 0.0
  if (t === 'boolean') return false
  if (t === 'string' || t === 'ansistring' || t === 'widestring' || t === 'char') return ''
  return null
}

function evalConstExpr(node) {
  if (!node) return null
  switch (node.type) {
    case 'IntLit': case 'RealLit': case 'StringLit': case 'BoolLit': return node.value
    case 'NilLit': return null
    case 'UnaryOp':
      if (node.op === '-') return -evalConstExpr(node.operand)
      if (node.op === '+') return +evalConstExpr(node.operand)
      if (node.op === 'not') return !evalConstExpr(node.operand)
      return null
    case 'BinaryOp': return applyBinary(node.op, evalConstExpr(node.left), evalConstExpr(node.right))
    default: return null
  }
}

function applyBinary(op, a, b) {
  switch (op) {
    case '+': return typeof a === 'string' || typeof b === 'string' ? String(a) + String(b) : Number(a) + Number(b)
    case '-': return Number(a) - Number(b)
    case '*': return Number(a) * Number(b)
    case '/': return Number(a) / Number(b)
    case 'div': return Math.trunc(Number(a) / Number(b))
    case 'mod': return Number(a) % Number(b)
    case 'and': return typeof a === 'boolean' ? (a && b) : ((a | 0) & (b | 0))
    case 'or':  return typeof a === 'boolean' ? (a || b) : ((a | 0) | (b | 0))
    case 'xor': return typeof a === 'boolean' ? (Boolean(a) !== Boolean(b)) : ((a | 0) ^ (b | 0))
    case 'shl': return (a | 0) << (b | 0)
    case 'shr': return (a | 0) >> (b | 0)
    case '=':  return a === b || (a == null && b == null)
    case '<>': return !(a === b || (a == null && b == null))
    case '<':  return a < b
    case '>':  return a > b
    case '<=': return a <= b
    case '>=': return a >= b
    case 'in': return Array.isArray(b) ? b.includes(a) : false
    default: throw new RuntimeError(`Unsupported operator '${op}'`, 0, 0)
  }
}

function coerceProperty(propName, value) {
  if (BOOL_PROPS.has(propName)) return value === true || value === 'True' || value === 'true' || value === 1
  if (INT_PROPS.has(propName)) return Number(value) || 0
  return value
}

class Interpreter {
  constructor(program) {
    this.program = program
    this.host = program.host
  }

  callRoutine(routine, args) {
    const scope = new Scope(this.program.globals)
    for (let i = 0; i < routine.params.length; i++) {
      const param = routine.params[i]
      const value = i < args.length
        ? args[i]
        : (param.defaultValue ? this.evaluate(param.defaultValue, scope) : defaultForType(param.typeName))
      scope.define(param.name, value)
    }
    for (const v of routine.locals || []) {
      const init = v.initializer ? this.evaluate(v.initializer, scope) : defaultForType(v.typeName)
      scope.define(v.name, init)
    }
    if (routine.kind === 'function') scope.define('Result', defaultForType(routine.returnType))

    try {
      this.execStmt(routine.body, scope)
    } catch (signal) {
      if (signal instanceof ExitSignal) {
        if (signal.value !== undefined) scope.resolve('Result').value = signal.value
      } else if (signal instanceof RaiseSignal) {
        throw new RuntimeError(signal.message, routine.line, routine.col)
      } else {
        throw signal
      }
    }
    return routine.kind === 'function' ? scope.resolve('Result').value : null
  }

  execStmt(node, scope) {
    if (!node) return
    switch (node.type) {
      case 'Block':
        for (const s of node.stmts) this.execStmt(s, scope)
        return
      case 'Assign':
        this.assignTo(node.target, this.evaluate(node.value, scope), scope)
        return
      case 'ExprStmt': {
        const value = this.evaluate(node.expr, scope)
        // Parameterless procedure call written without parens (Delphi semantics):
        // `Memo1.Lines.Clear;`, `Edit1.SetFocus;`, `Randomize;`. Invoke the
        // resolved callable so the statement actually fires.
        if (value && typeof value === 'object') {
          if (value.__linesMethod) LINES_METHODS[value.__linesMethod](value.compRef, [])
          else if (value.__compMethod) COMPONENT_METHODS[value.__compMethod](value.target, this.host, [])
          else if (value.__builtin) BUILTINS[value.__builtin.toLowerCase()].call([], { host: this.host })
          else if (value.__routine) this.callRoutine(value.__routine, [])
        }
        return
      }
      case 'If':
        if (this.evaluate(node.cond, scope)) this.execStmt(node.then, scope)
        else if (node.else) this.execStmt(node.else, scope)
        return
      case 'While':
        while (this.evaluate(node.cond, scope)) {
          try { this.execStmt(node.body, scope) }
          catch (s) { if (s instanceof BreakSignal) break; if (s instanceof ContinueSignal) continue; throw s }
        }
        return
      case 'Repeat':
        do {
          try { for (const s of node.stmts) this.execStmt(s, scope) }
          catch (s) { if (s instanceof BreakSignal) break; if (s instanceof ContinueSignal) continue; throw s }
        } while (!this.evaluate(node.cond, scope))
        return
      case 'For': {
        const start = Number(this.evaluate(node.start, scope))
        const stop = Number(this.evaluate(node.stop, scope))
        const step = node.direction === 'downto' ? -1 : 1
        let slot = scope.resolve(node.varName)
        if (!slot) { scope.define(node.varName, 0); slot = scope.resolve(node.varName) }
        if (step > 0) {
          for (let i = start; i <= stop; i++) {
            slot.value = i
            try { this.execStmt(node.body, scope) }
            catch (s) { if (s instanceof BreakSignal) return; if (s instanceof ContinueSignal) continue; throw s }
          }
        } else {
          for (let i = start; i >= stop; i--) {
            slot.value = i
            try { this.execStmt(node.body, scope) }
            catch (s) { if (s instanceof BreakSignal) return; if (s instanceof ContinueSignal) continue; throw s }
          }
        }
        return
      }
      case 'Case': {
        const subject = this.evaluate(node.subject, scope)
        for (const branch of node.branches) {
          for (const label of branch.labels) {
            if (label.kind === 'single' && subject === this.evaluate(label.value, scope)) {
              this.execStmt(branch.stmt, scope); return
            }
            if (label.kind === 'range') {
              const lo = this.evaluate(label.lo, scope)
              const hi = this.evaluate(label.hi, scope)
              if (subject >= lo && subject <= hi) { this.execStmt(branch.stmt, scope); return }
            }
          }
        }
        if (node.else) this.execStmt(node.else, scope)
        return
      }
      case 'With':
        this.execStmt(node.body, scope)
        return
      case 'TryExcept':
        try { for (const s of node.tryStmts) this.execStmt(s, scope) }
        catch (err) {
          if (err instanceof BreakSignal || err instanceof ContinueSignal || err instanceof ExitSignal) throw err
          const message = err instanceof RaiseSignal ? err.message : (err.message || String(err))
          scope.define('Exception.Message', message)
          for (const s of node.handlerStmts) this.execStmt(s, scope)
        }
        return
      case 'TryFinally':
        try { for (const s of node.tryStmts) this.execStmt(s, scope) }
        finally { for (const s of node.finallyStmts) this.execStmt(s, scope) }
        return
      case 'Raise':
        throw new RaiseSignal(node.value ? formatPascalValue(this.evaluate(node.value, scope)) : 'Exception raised')
      case 'Break': throw new BreakSignal()
      case 'Continue': throw new ContinueSignal()
      case 'Exit': throw new ExitSignal(node.value ? this.evaluate(node.value, scope) : undefined)
      default:
        throw new RuntimeError(`Unsupported statement '${node.type}'`, node.line || 0, node.col || 0)
    }
  }

  assignTo(target, value, scope) {
    switch (target.type) {
      case 'Ident': {
        const slot = scope.resolve(target.name)
        if (slot) { slot.value = value; return }
        if (this.host.getComponent(target.name)) {
          throw new RuntimeError(`Cannot assign directly to component '${target.name}'`, target.line, target.col)
        }
        throw new RuntimeError(`Undeclared identifier: '${target.name}'`, target.line, target.col)
      }
      case 'Member': {
        const owner = this.resolveOwner(target.object, scope)
        if (owner?.kind === 'component') {
          owner.target.props[target.name] = coerceProperty(target.name, value)
          return
        }
        if (owner?.kind === 'form') {
          this.assignFormProp(target.name, value)
          return
        }
        if (owner?.kind === 'linesPath' && target.name.toLowerCase() === 'text') {
          owner.compRef.target.props.Lines = String(value).split('\n')
          return
        }
        throw new RuntimeError(`Cannot assign to '${target.name}'`, target.line, target.col)
      }
      case 'Index': {
        const ownerExpr = target.object
        if (ownerExpr.type === 'Member' && ownerExpr.name.toLowerCase() === 'lines') {
          const ownerInfo = this.resolveOwner(ownerExpr.object, scope)
          if (ownerInfo?.kind === 'component') {
            const idx = Number(this.evaluate(target.indices[0], scope))
            ownerInfo.target.props.Lines = ownerInfo.target.props.Lines || []
            ownerInfo.target.props.Lines[idx] = String(formatPascalValue(value))
            return
          }
        }
        throw new RuntimeError('Indexed assignment not supported here', target.line, target.col)
      }
      default:
        throw new RuntimeError(`Cannot assign to '${target.type}'`, target.line || 0, target.col || 0)
    }
  }

  assignFormProp(name, value) {
    const r = this.host.runningState()
    if (name === 'Caption') r.caption = String(value)
    else if (name === 'Color') r.color = value
    else if (name === 'Width') r.width = Number(value)
    else if (name === 'Height') r.height = Number(value)
    else r[name.toLowerCase()] = value
  }

  resolveOwner(node, scope) {
    if (node.type === 'Ident') {
      const slot = scope.resolve(node.name)
      if (slot) return { kind: 'value', value: slot.value }
      const comp = this.host.getComponent(node.name)
      if (comp) return { kind: 'component', target: comp }
      if (this.host.isFormName(node.name)) return { kind: 'form' }
      throw new RuntimeError(`Undeclared identifier: '${node.name}'`, node.line, node.col)
    }
    if (node.type === 'Self') return { kind: 'form' }
    if (node.type === 'Member' && node.name.toLowerCase() === 'lines') {
      const inner = this.resolveOwner(node.object, scope)
      if (inner?.kind === 'component') return { kind: 'linesPath', compRef: inner }
    }
    return { kind: 'value', value: this.evaluate(node, scope) }
  }

  evaluate(node, scope) {
    switch (node.type) {
      case 'IntLit': case 'RealLit': case 'StringLit': case 'BoolLit': return node.value
      case 'NilLit': return null
      case 'Self': return null
      case 'Ident': return this.evalIdent(node, scope)
      case 'Member': return this.evalMember(node, scope)
      case 'Index': return this.evalIndex(node, scope)
      case 'Call': return this.evalCall(node, scope)
      case 'UnaryOp': return this.evalUnary(node, scope)
      case 'BinaryOp': return this.evalBinary(node, scope)
      case 'Inherited': return null
      case 'Deref': return this.evaluate(node.object, scope)
      default:
        throw new RuntimeError(`Cannot evaluate '${node.type}'`, node.line || 0, node.col || 0)
    }
  }

  evalIdent(node, scope) {
    const slot = scope.resolve(node.name)
    if (slot) return slot.value
    const comp = this.host.getComponent(node.name)
    if (comp) return { __component: comp }
    if (this.host.isFormName(node.name)) return { __form: true }
    if (getBuiltin(node.name)) return { __builtin: node.name }
    const routine = this.program.routines.get(node.name.toLowerCase())
    if (routine) return { __routine: routine }
    if (node.name.toLowerCase() === 'result') return scope.resolve('Result')?.value ?? null
    throw new RuntimeError(`Undeclared identifier: '${node.name}'`, node.line, node.col)
  }

  evalMember(node, scope) {
    const owner = this.resolveOwner(node.object, scope)
    if (owner?.kind === 'component') {
      const lower = node.name.toLowerCase()
      if (lower === 'lines') return { __linesProxy: owner.target }
      if (owner.target.props && Object.prototype.hasOwnProperty.call(owner.target.props, node.name)) {
        return owner.target.props[node.name]
      }
      if (COMPONENT_METHODS[lower]) return { __compMethod: lower, target: owner.target }
      return null
    }
    if (owner?.kind === 'form') {
      const r = this.host.runningState()
      const lower = node.name.toLowerCase()
      if (lower === 'caption') return r.caption
      if (lower === 'width') return r.width
      if (lower === 'height') return r.height
      if (lower === 'color') return r.color
      if (COMPONENT_METHODS[lower]) return { __compMethod: lower, target: { __form: true, ...r } }
      return null
    }
    if (owner?.kind === 'linesPath') {
      const lower = node.name.toLowerCase()
      if (lower === 'text') return (owner.compRef.target.props.Lines || []).join('\n')
      if (lower === 'count') return (owner.compRef.target.props.Lines || []).length
      if (LINES_METHODS[lower]) return { __linesMethod: lower, compRef: owner.compRef }
    }
    return null
  }

  evalIndex(node, scope) {
    const obj = this.evaluate(node.object, scope)
    const idx = Number(this.evaluate(node.indices[0], scope))
    if (obj && obj.__linesProxy) return (obj.__linesProxy.props.Lines || [])[idx] || ''
    if (Array.isArray(obj)) return obj[idx]
    if (typeof obj === 'string') return obj[idx - 1] || ''
    return null
  }

  evalCall(node, scope) {
    const callee = node.callee
    if (callee.type === 'Ident' && ['inc', 'dec'].includes(callee.name.toLowerCase())) {
      const delta = node.args.length > 1 ? Number(this.evaluate(node.args[1], scope)) : 1
      const sign = callee.name.toLowerCase() === 'inc' ? 1 : -1
      const current = Number(this.evaluate(node.args[0], scope)) || 0
      this.assignTo(node.args[0], current + sign * delta, scope)
      return null
    }
    const fn = this.evaluate(callee, scope)
    const args = node.args.map((a) => this.evaluate(a, scope))

    if (fn && fn.__builtin) {
      const b = BUILTINS[fn.__builtin.toLowerCase()]
      try { return b.call(args, { host: this.host }) }
      catch (err) {
        if (err instanceof RuntimeBuiltinError) throw new RuntimeError(err.message, node.line, node.col)
        throw err
      }
    }
    if (fn && fn.__routine) return this.callRoutine(fn.__routine, args)
    if (fn && fn.__compMethod) return COMPONENT_METHODS[fn.__compMethod](fn.target, this.host, args)
    if (fn && fn.__linesMethod) return LINES_METHODS[fn.__linesMethod](fn.compRef, args)
    // Type-cast: TForm14(Self) just returns the operand
    if (callee.type === 'Ident' && this.program.classes.has(callee.name.toLowerCase())) return args[0]

    throw new RuntimeError(`Cannot call '${callee.name || callee.type}'`, node.line, node.col)
  }

  evalUnary(node, scope) {
    const v = this.evaluate(node.operand, scope)
    if (node.op === '-') return -Number(v)
    if (node.op === '+') return +Number(v)
    if (node.op === 'not') return typeof v === 'boolean' ? !v : ~(v | 0)
    if (node.op === '@') return null
    throw new RuntimeError(`Unsupported unary '${node.op}'`, node.line, node.col)
  }

  evalBinary(node, scope) {
    if (node.op === 'and' || node.op === 'or') {
      const a = this.evaluate(node.left, scope)
      if (typeof a === 'boolean') {
        if (node.op === 'and' && !a) return false
        if (node.op === 'or' && a) return true
        return Boolean(this.evaluate(node.right, scope))
      }
      const b = this.evaluate(node.right, scope)
      return applyBinary(node.op, a, b)
    }
    const a = this.evaluate(node.left, scope)
    const b = this.evaluate(node.right, scope)
    return applyBinary(node.op, a, b)
  }
}

export function compileUnit(source) {
  return parseUnit(source)
}

export function makeProgram(source, host) {
  const unit = parseUnit(source)
  return new Program(unit, host)
}

export { ParseError, LexError, RuntimeError as InterpreterRuntimeError }
