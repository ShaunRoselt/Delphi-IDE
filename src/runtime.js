// Minimal Pascal interpreter for handler bodies. Supports the common subset
// needed to make a designed form feel alive: ShowMessage, property assignments
// (Caption/Text/Visible/Enabled/Checked/Position/Color), Lines.Add/Clear,
// string concatenation, IntToStr/StrToInt/FloatToStr/Length, and reading
// component properties as expressions.
//
// This is intentionally not a full Pascal compiler. Control flow, complex
// expressions, and user procedures are out of scope. The interpreter degrades
// gracefully — unrecognized statements are silently skipped.

import { state, activeForm } from './state.js'
import { generatePascal } from './pascal.js'

const BOOL_PROPS = new Set(['Visible', 'Enabled', 'Checked', 'ReadOnly', 'Default', 'Cancel', 'AutoSize', 'Transparent', 'WordWrap', 'Sorted', 'MultiSelect', 'Smooth', 'Down', 'Flat', 'AllowGrayed'])
const INT_PROPS = new Set(['Left', 'Top', 'Width', 'Height', 'Position', 'Min', 'Max', 'ItemIndex', 'TabOrder', 'Step', 'MaxLength', 'GroupIndex', 'ColCount', 'RowCount', 'FixedCols', 'FixedRows', 'Interval', 'ActivePageIndex'])

export function startProgram() {
  const f = activeForm()
  if (!f) return
  state.running = {
    formName: f.name,
    formClassName: f.className,
    caption: f.caption,
    width: f.width,
    height: f.height,
    color: f.color,
    components: f.components.map((c) => ({
      id: c.id,
      type: c.type,
      left: c.left,
      top: c.top,
      width: c.width,
      height: c.height,
      props: structuredClone(c.props),
      events: { ...c.events },
    })),
    formCode: generatePascal(f),
  }
  state.statusMessage = `${f.className} running`
}

export function stopProgram() {
  state.running = null
  state.statusMessage = 'Program terminated.'
}

export function getRuntimeComponent(id) {
  return state.running?.components.find((c) => c.id === id)
}

export function executeHandler(handlerName) {
  if (!state.running) return
  const body = extractProcedureBody(state.running.formCode, handlerName)
  if (body == null) return
  try {
    interpretBlock(body)
  } catch (err) {
    window.alert(`Runtime error in ${handlerName}:\n${err.message}`)
  }
}

// ─── source extraction ────────────────────────────────────────────────────

function skipCommentOrString(code, i) {
  const ch = code[i]
  if (ch === '{') {
    while (i < code.length && code[i] !== '}') i++
    return Math.min(i + 1, code.length)
  }
  if (ch === '/' && code[i + 1] === '/') {
    while (i < code.length && code[i] !== '\n') i++
    return i
  }
  if (ch === '(' && code[i + 1] === '*') {
    let j = i + 2
    while (j < code.length - 1 && !(code[j] === '*' && code[j + 1] === ')')) j++
    return Math.min(j + 2, code.length)
  }
  if (ch === "'") {
    let j = i + 1
    while (j < code.length) {
      if (code[j] === "'") {
        if (code[j + 1] === "'") { j += 2; continue }
        return j + 1
      }
      j++
    }
    return j
  }
  return i
}

function isWordChar(ch) {
  return /[A-Za-z0-9_]/.test(ch || '')
}

function extractProcedureBody(code, handler) {
  const procRe = new RegExp(`procedure\\s+\\w+\\s*\\.\\s*${handler}\\b`, 'i')
  const m = code.match(procRe)
  if (!m) return null

  // Walk forward to the next `begin` outside comments/strings.
  let i = m.index + m[0].length
  while (i < code.length) {
    const skipped = skipCommentOrString(code, i)
    if (skipped !== i) { i = skipped; continue }
    if (code.substr(i, 5).toLowerCase() === 'begin' && !isWordChar(code[i + 5])) {
      i += 5
      break
    }
    i++
  }
  if (i >= code.length) return null

  // Scan for the matching `end`, tracking nested begin..end blocks.
  let depth = 1
  const start = i
  while (i < code.length) {
    const skipped = skipCommentOrString(code, i)
    if (skipped !== i) { i = skipped; continue }
    const lower3 = code.substr(i, 3).toLowerCase()
    const lower5 = code.substr(i, 5).toLowerCase()
    const prev = code[i - 1] || ' '
    if (lower5 === 'begin' && !isWordChar(prev) && !isWordChar(code[i + 5])) {
      depth++
      i += 5
      continue
    }
    if (lower3 === 'end' && !isWordChar(prev) && !isWordChar(code[i + 3])) {
      depth--
      if (depth === 0) return code.slice(start, i).trim()
      i += 3
      continue
    }
    i++
  }
  return null
}

// ─── statement splitting ──────────────────────────────────────────────────

function stripComments(code) {
  return code
    .replace(/\{[^}]*\}/g, '')
    .replace(/\(\*[\s\S]*?\*\)/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

function splitStatements(code) {
  const out = []
  let buf = ''
  let inString = false
  let parens = 0
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    if (ch === "'") {
      if (inString && code[i + 1] === "'") { buf += "''"; i++; continue }
      inString = !inString
      buf += ch
      continue
    }
    if (inString) { buf += ch; continue }
    if (ch === '(') { parens++; buf += ch; continue }
    if (ch === ')') { parens--; buf += ch; continue }
    if (ch === ';' && parens === 0) {
      if (buf.trim()) out.push(buf.trim())
      buf = ''
      continue
    }
    buf += ch
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

function interpretBlock(body) {
  const cleaned = stripComments(body)
  for (const stmt of splitStatements(cleaned)) interpretStatement(stmt)
}

// ─── statements ───────────────────────────────────────────────────────────

function interpretStatement(stmt) {
  let m

  // ShowMessage(<expr>)
  m = stmt.match(/^ShowMessage\s*\(\s*([\s\S]+)\s*\)\s*$/i)
  if (m) {
    window.alert(formatValue(evalExpr(m[1])))
    return
  }

  // <comp>.Lines.Add(<expr>)
  m = stmt.match(/^(\w+)\s*\.\s*Lines\s*\.\s*Add\s*\(\s*([\s\S]+)\s*\)\s*$/i)
  if (m) {
    const c = getRuntimeComponent(m[1])
    if (c) {
      c.props.Lines = c.props.Lines || []
      c.props.Lines.push(String(formatValue(evalExpr(m[2]))))
    }
    return
  }

  // <comp>.Lines.Clear  /  <comp>.Clear
  m = stmt.match(/^(\w+)\s*\.\s*Lines\s*\.\s*Clear\s*$/i) || stmt.match(/^(\w+)\s*\.\s*Clear\s*$/i)
  if (m) {
    const c = getRuntimeComponent(m[1])
    if (c) {
      if (c.props.Lines !== undefined) c.props.Lines = []
      if (c.props.Text !== undefined) c.props.Text = ''
    }
    return
  }

  // <comp>.<prop> := <expr>
  m = stmt.match(/^(\w+)\s*\.\s*(\w+)\s*:=\s*([\s\S]+)\s*$/i)
  if (m) {
    const c = getRuntimeComponent(m[1])
    if (c) c.props[m[2]] = coerce(m[2], evalExpr(m[3]))
    return
  }

  // <comp>.<prop>.<sub> := <expr>  — e.g. Memo1.Lines.Text := 'foo'
  m = stmt.match(/^(\w+)\s*\.\s*Lines\s*\.\s*Text\s*:=\s*([\s\S]+)\s*$/i)
  if (m) {
    const c = getRuntimeComponent(m[1])
    if (c) c.props.Lines = String(evalExpr(m[2])).split('\n')
    return
  }

  // Bare procedure call we don't know about — ignore.
}

// ─── expressions ──────────────────────────────────────────────────────────

function evalExpr(raw) {
  let expr = raw.trim()
  if (!expr) return ''

  // Strip enclosing parens if they wrap the whole expression.
  while (expr.startsWith('(') && expr.endsWith(')') && parensBalancedAround(expr)) {
    expr = expr.slice(1, -1).trim()
  }

  // String literal
  if (isCompleteString(expr)) return expr.slice(1, -1).replace(/''/g, "'")

  // Numeric literal
  if (/^-?\d+$/.test(expr)) return parseInt(expr, 10)
  if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr)

  // Boolean / nil
  if (/^true$/i.test(expr)) return true
  if (/^false$/i.test(expr)) return false
  if (/^nil$/i.test(expr)) return null

  // Function calls
  let m
  if ((m = expr.match(/^IntToStr\s*\(\s*([\s\S]+)\s*\)$/i))) return String(Number(evalExpr(m[1])) | 0)
  if ((m = expr.match(/^StrToInt\s*\(\s*([\s\S]+)\s*\)$/i))) return parseInt(evalExpr(m[1]), 10) || 0
  if ((m = expr.match(/^FloatToStr\s*\(\s*([\s\S]+)\s*\)$/i))) return String(evalExpr(m[1]))
  if ((m = expr.match(/^Length\s*\(\s*([\s\S]+)\s*\)$/i))) {
    const v = evalExpr(m[1])
    return Array.isArray(v) ? v.length : String(v).length
  }
  if ((m = expr.match(/^UpperCase\s*\(\s*([\s\S]+)\s*\)$/i))) return String(evalExpr(m[1])).toUpperCase()
  if ((m = expr.match(/^LowerCase\s*\(\s*([\s\S]+)\s*\)$/i))) return String(evalExpr(m[1])).toLowerCase()
  if ((m = expr.match(/^Trim\s*\(\s*([\s\S]+)\s*\)$/i))) return String(evalExpr(m[1])).trim()

  // Binary expression at top level (+, -, *, /)
  const parts = splitTopLevel(expr, ['+', '-', '*', '/'])
  if (parts.length > 1) {
    let acc = evalExpr(parts[0].operand)
    for (let i = 1; i < parts.length; i++) {
      const right = evalExpr(parts[i].operand)
      const op = parts[i].op
      if (op === '+') {
        acc = (typeof acc === 'string' || typeof right === 'string')
          ? String(acc) + String(right)
          : Number(acc) + Number(right)
      } else if (op === '-') acc = Number(acc) - Number(right)
      else if (op === '*') acc = Number(acc) * Number(right)
      else if (op === '/') acc = Number(acc) / Number(right)
    }
    return acc
  }

  // Property reads
  if ((m = expr.match(/^(\w+)\s*\.\s*Lines\s*\.\s*Text$/i))) {
    const c = getRuntimeComponent(m[1])
    return c ? (c.props.Lines || []).join('\n') : ''
  }
  if ((m = expr.match(/^(\w+)\s*\.\s*Lines\s*\.\s*Count$/i))) {
    const c = getRuntimeComponent(m[1])
    return c ? (c.props.Lines || []).length : 0
  }
  if ((m = expr.match(/^(\w+)\s*\.\s*(\w+)$/))) {
    const c = getRuntimeComponent(m[1])
    return c ? c.props[m[2]] ?? '' : ''
  }

  // Plain identifier — return as string fallback.
  return expr
}

function isCompleteString(s) {
  if (s.length < 2 || s[0] !== "'" || s[s.length - 1] !== "'") return false
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i] === "'") {
      if (s[i + 1] === "'") { i++; continue }
      return false
    }
  }
  return true
}

function parensBalancedAround(s) {
  let depth = 0
  let inString = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "'") {
      if (inString && s[i + 1] === "'") { i++; continue }
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0 && i < s.length - 1) return false
    }
  }
  return depth === 0
}

function splitTopLevel(expr, ops) {
  const parts = []
  let buf = ''
  let parens = 0
  let inString = false
  let pendingOp = null
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (ch === "'") {
      if (inString && expr[i + 1] === "'") { buf += "''"; i++; continue }
      inString = !inString
      buf += ch
      continue
    }
    if (inString) { buf += ch; continue }
    if (ch === '(') { parens++; buf += ch; continue }
    if (ch === ')') { parens--; buf += ch; continue }
    if (parens === 0 && ops.includes(ch)) {
      // Skip unary minus at start, or after another operator/open-paren.
      const prevNonSpace = buf.replace(/\s+$/, '').slice(-1)
      if (ch === '-' && (buf.trim() === '' || ops.includes(prevNonSpace) || prevNonSpace === '(')) {
        buf += ch
        continue
      }
      if (buf.trim() !== '') {
        parts.push({ op: pendingOp, operand: buf.trim() })
        pendingOp = ch
        buf = ''
        continue
      }
    }
    buf += ch
  }
  if (buf.trim()) parts.push({ op: pendingOp, operand: buf.trim() })
  return parts
}

function coerce(propName, value) {
  if (BOOL_PROPS.has(propName)) {
    return value === true || value === 'True' || value === 'true' || value === 1
  }
  if (INT_PROPS.has(propName)) return Number(value) || 0
  return value
}

function formatValue(v) {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  return String(v)
}
