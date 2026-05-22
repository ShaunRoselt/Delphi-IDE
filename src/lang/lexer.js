// Object Pascal lexer for the Delphi-IDE prototype. Produces a flat token
// stream from a unit source. Identifiers and keywords are case-insensitive
// (Delphi semantics); the original spelling is preserved on `value` while
// `lower` is used for matching.
//
// Tokens carry `line`/`col` for diagnostics. Compiler directives ({$...})
// are skipped here — semantic phases ignore them.

export const KEYWORDS = new Set([
  'absolute', 'and', 'array', 'as', 'asm', 'begin', 'break', 'case', 'class',
  'const', 'constructor', 'continue', 'destructor', 'dispinterface', 'div',
  'do', 'downto', 'else', 'end', 'except', 'exit', 'exports', 'file',
  'finalization', 'finally', 'for', 'function', 'goto', 'if', 'implementation',
  'in', 'inherited', 'initialization', 'inline', 'interface', 'is', 'label',
  'library', 'mod', 'nil', 'not', 'object', 'of', 'or', 'out', 'packed',
  'private', 'procedure', 'program', 'property', 'protected', 'public',
  'published', 'raise', 'record', 'repeat', 'resourcestring', 'set', 'shl',
  'shr', 'string', 'then', 'threadvar', 'to', 'try', 'type', 'unit', 'until',
  'uses', 'var', 'while', 'with', 'xor', 'true', 'false', 'result', 'self',
  'override', 'virtual', 'abstract', 'reintroduce', 'overload', 'default',
  'stored', 'read', 'write', 'message',
])

const SINGLE_SYMBOLS = new Set(['+', '-', '*', '/', '=', '(', ')', '[', ']', ',', ';', '^', '@', '<', '>'])

export class LexError extends Error {
  constructor(message, line, col) {
    super(message)
    this.line = line
    this.col = col
  }
}

export function tokenize(source) {
  const tokens = []
  const len = source.length
  let i = 0
  let line = 1
  let col = 1

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      if (source[i + k] === '\n') { line++; col = 1 }
      else col++
    }
    i += n
  }

  const push = (kind, value, startLine, startCol, extra = {}) => {
    tokens.push({ kind, value, lower: typeof value === 'string' ? value.toLowerCase() : value, line: startLine, col: startCol, ...extra })
  }

  while (i < len) {
    const ch = source[i]
    const next = source[i + 1]

    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { advance(); continue }

    // line comment
    if (ch === '/' && next === '/') {
      while (i < len && source[i] !== '\n') advance()
      continue
    }

    // brace comment / directive
    if (ch === '{') {
      const startLine = line
      const startCol = col
      advance()
      while (i < len && source[i] !== '}') advance()
      if (i >= len) throw new LexError("Unterminated '{' comment", startLine, startCol)
      advance() // consume '}'
      continue
    }

    // paren-star comment
    if (ch === '(' && next === '*') {
      const startLine = line
      const startCol = col
      advance(2)
      while (i < len - 1 && !(source[i] === '*' && source[i + 1] === ')')) advance()
      if (i >= len - 1) throw new LexError("Unterminated '(* *)' comment", startLine, startCol)
      advance(2)
      continue
    }

    // string literal — supports '...''...', char codes #NN, and concatenation
    if (ch === "'" || ch === '#') {
      const startLine = line
      const startCol = col
      let value = ''
      while (i < len && (source[i] === "'" || source[i] === '#')) {
        if (source[i] === "'") {
          advance()
          while (i < len) {
            if (source[i] === "'") {
              if (source[i + 1] === "'") { value += "'"; advance(2); continue }
              advance()
              break
            }
            if (source[i] === '\n') throw new LexError('String literal crosses line', startLine, startCol)
            value += source[i]
            advance()
          }
        } else if (source[i] === '#') {
          advance()
          let num = ''
          if (source[i] === '$') { num = '$'; advance() }
          while (i < len && /[0-9A-Fa-f]/.test(source[i])) { num += source[i]; advance() }
          if (!num || num === '$') throw new LexError('Invalid character code after #', startLine, startCol)
          const code = num.startsWith('$') ? parseInt(num.slice(1), 16) : parseInt(num, 10)
          value += String.fromCharCode(code)
        }
      }
      push('string', value, startLine, startCol)
      continue
    }

    // hex literal
    if (ch === '$') {
      const startLine = line
      const startCol = col
      advance()
      let raw = ''
      while (i < len && /[0-9A-Fa-f]/.test(source[i])) { raw += source[i]; advance() }
      if (!raw) throw new LexError("Hex digits expected after '$'", startLine, startCol)
      push('integer', parseInt(raw, 16), startLine, startCol)
      continue
    }

    // numeric literal
    if (ch >= '0' && ch <= '9') {
      const startLine = line
      const startCol = col
      let raw = ''
      while (i < len && /[0-9]/.test(source[i])) { raw += source[i]; advance() }
      let isReal = false
      if (source[i] === '.' && source[i + 1] !== '.' && /[0-9]/.test(source[i + 1])) {
        isReal = true
        raw += '.'; advance()
        while (i < len && /[0-9]/.test(source[i])) { raw += source[i]; advance() }
      }
      if (source[i] === 'e' || source[i] === 'E') {
        isReal = true
        raw += source[i]; advance()
        if (source[i] === '+' || source[i] === '-') { raw += source[i]; advance() }
        while (i < len && /[0-9]/.test(source[i])) { raw += source[i]; advance() }
      }
      push(isReal ? 'real' : 'integer', isReal ? parseFloat(raw) : parseInt(raw, 10), startLine, startCol)
      continue
    }

    // identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      const startLine = line
      const startCol = col
      let raw = ''
      while (i < len && /[A-Za-z0-9_]/.test(source[i])) { raw += source[i]; advance() }
      const lower = raw.toLowerCase()
      if (KEYWORDS.has(lower)) push('keyword', raw, startLine, startCol, { lower })
      else push('ident', raw, startLine, startCol, { lower })
      continue
    }

    // multi-char symbols
    const startLine = line
    const startCol = col
    if (ch === ':' && next === '=') { advance(2); push('symbol', ':=', startLine, startCol); continue }
    if (ch === '<' && next === '=') { advance(2); push('symbol', '<=', startLine, startCol); continue }
    if (ch === '>' && next === '=') { advance(2); push('symbol', '>=', startLine, startCol); continue }
    if (ch === '<' && next === '>') { advance(2); push('symbol', '<>', startLine, startCol); continue }
    if (ch === '.' && next === '.') { advance(2); push('symbol', '..', startLine, startCol); continue }
    if (ch === ':') { advance(); push('symbol', ':', startLine, startCol); continue }
    if (ch === '.') { advance(); push('symbol', '.', startLine, startCol); continue }
    if (SINGLE_SYMBOLS.has(ch)) { advance(); push('symbol', ch, startLine, startCol); continue }

    throw new LexError(`Unexpected character '${ch}'`, startLine, startCol)
  }

  push('eof', '', line, col)
  return tokens
}
