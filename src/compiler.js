const KNOWN_PROCS = new Set([
  'ShowMessage', 'MessageDlg', 'Beep', 'Inc', 'Dec', 'Assigned', 'FreeAndNil',
])

const KNOWN_FUNCS = new Set([
  'IntToStr', 'StrToInt', 'StrToIntDef', 'FloatToStr', 'Length',
  'UpperCase', 'LowerCase', 'Trim', 'Copy', 'Pos',
])

const STATEMENT_START = /^(?:[A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*|\w+\s*\()/

function locFromIndex(source, index) {
  let line = 1
  let col = 1
  for (let i = 0; i < index; i++) {
    if (source[i] === '\n') {
      line++
      col = 1
    } else {
      col++
    }
  }
  return { line, col }
}

function makeDiagnostic(source, index, code, message, severity = 'error') {
  return { ...locFromIndex(source, index), code, message, severity }
}

function scanSource(source) {
  const diagnostics = []
  const tokens = []
  let i = 0

  const pushToken = (kind, value, start) => {
    tokens.push({ kind, value, lower: value.toLowerCase(), index: start, ...locFromIndex(source, start) })
  }

  while (i < source.length) {
    const ch = source[i]
    const next = source[i + 1]

    if (/\s/.test(ch)) { i++; continue }

    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }

    if (ch === '{') {
      const start = i
      i++
      while (i < source.length && source[i] !== '}') i++
      if (i >= source.length) diagnostics.push(makeDiagnostic(source, start, 'E2029', "'}' expected"))
      else i++
      continue
    }

    if (ch === '(' && next === '*') {
      const start = i
      i += 2
      while (i < source.length - 1 && !(source[i] === '*' && source[i + 1] === ')')) i++
      if (i >= source.length - 1) diagnostics.push(makeDiagnostic(source, start, 'E2029', "'*)' expected"))
      else i += 2
      continue
    }

    if (ch === "'") {
      const start = i
      i++
      let closed = false
      while (i < source.length) {
        if (source[i] === "'") {
          if (source[i + 1] === "'") { i += 2; continue }
          i++
          closed = true
          break
        }
        if (source[i] === '\n') break
        i++
      }
      if (!closed) diagnostics.push(makeDiagnostic(source, start, 'E2029', 'String literal not terminated'))
      pushToken('string', source.slice(start, i), start)
      continue
    }

    if (/[A-Za-z_]/.test(ch)) {
      const start = i
      i++
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) i++
      pushToken('word', source.slice(start, i), start)
      continue
    }

    if (/[0-9]/.test(ch)) {
      const start = i
      i++
      while (i < source.length && /[0-9.]/.test(source[i])) i++
      pushToken('number', source.slice(start, i), start)
      continue
    }

    const start = i
    if (ch === ':' && next === '=') {
      pushToken('symbol', ':=', start)
      i += 2
    } else {
      pushToken('symbol', ch, start)
      i++
    }
  }

  return { diagnostics, tokens }
}

function nextToken(tokens, i) {
  return tokens[i + 1] || null
}

function prevToken(tokens, i) {
  return tokens[i - 1] || null
}

function findToken(tokens, word) {
  return tokens.find((t) => t.lower === word)
}

function validateUnitShape(source, tokens, diagnostics) {
  const first = tokens[0]
  if (!first) {
    diagnostics.push({ line: 1, col: 1, code: 'E2029', message: 'Program expected', severity: 'error' })
    return
  }
  if (first.lower !== 'unit') {
    diagnostics.push(makeDiagnostic(source, first.index, 'E2029', "'unit' expected"))
  } else if (nextToken(tokens, 0)?.kind !== 'word') {
    diagnostics.push(makeDiagnostic(source, first.index + first.value.length, 'E2029', 'Unit identifier expected'))
  }

  for (const word of ['interface', 'implementation']) {
    if (!findToken(tokens, word)) diagnostics.push(makeDiagnostic(source, 0, 'E2029', `'${word}' expected`))
  }

  const last = tokens[tokens.length - 1]
  const beforeLast = tokens[tokens.length - 2]
  if (!(beforeLast?.lower === 'end' && last?.value === '.')) {
    diagnostics.push(makeDiagnostic(source, source.length, 'E2029', "'.' expected after final 'end'"))
  }
}

function validateBlocks(source, tokens, diagnostics) {
  const stack = []
  const openers = new Set(['begin', 'class', 'record', 'try', 'case'])

  tokens.forEach((tok, i) => {
    if (tok.kind !== 'word') return
    if (openers.has(tok.lower)) {
      if (tok.lower === 'class') {
        const prev = prevToken(tokens, i)
        if (prev?.value !== '=') return
      }
      stack.push(tok)
      return
    }
    if (tok.lower === 'repeat') {
      stack.push(tok)
      return
    }
    if (tok.lower === 'until') {
      const last = stack.pop()
      if (!last || last.lower !== 'repeat') {
        diagnostics.push(makeDiagnostic(source, tok.index, 'E2029', "'repeat' expected"))
      }
      return
    }
    if (tok.lower === 'end') {
      if (!stack.length && nextToken(tokens, i)?.value === '.') return
      const last = stack.pop()
      if (!last || last.lower === 'repeat') {
        diagnostics.push(makeDiagnostic(source, tok.index, 'E2029', "'begin' expected"))
      }
    }
  })

  for (const opener of stack) {
    diagnostics.push(makeDiagnostic(source, opener.index, 'E2029', `'end' expected for '${opener.value}'`))
  }
}

function stripComments(source) {
  return source
    .replace(/\{[^}]*\}/g, '')
    .replace(/\(\*[\s\S]*?\*\)/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

function findProcedureBodies(source) {
  const clean = stripComments(source)
  const bodies = []
  const procRe = /procedure\s+([A-Za-z_]\w*)\s*\.\s*([A-Za-z_]\w*)\s*\([^)]*\)\s*;/gi
  let match
  while ((match = procRe.exec(clean))) {
    const beginRe = /\bbegin\b/gi
    beginRe.lastIndex = procRe.lastIndex
    const begin = beginRe.exec(clean)
    if (!begin) continue
    let depth = 1
    const endRe = /\b(begin|end)\b/gi
    endRe.lastIndex = begin.index + begin[0].length
    let endMatch
    while ((endMatch = endRe.exec(clean))) {
      if (endMatch[1].toLowerCase() === 'begin') depth++
      else depth--
      if (depth === 0) break
    }
    if (!endMatch) continue
    bodies.push({
      formClass: match[1],
      name: match[2],
      body: clean.slice(begin.index + begin[0].length, endMatch.index),
      bodyIndex: begin.index + begin[0].length,
    })
    procRe.lastIndex = endMatch.index + endMatch[0].length
  }
  return bodies
}

function splitStatements(body, sourceOffset) {
  const statements = []
  let start = 0
  let parens = 0
  let inString = false

  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === "'") {
      if (inString && body[i + 1] === "'") { i++; continue }
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '(') parens++
    else if (ch === ')') parens--
    else if (ch === ';' && parens === 0) {
      const text = body.slice(start, i).trim()
      if (text) statements.push({ text, index: sourceOffset + start + body.slice(start).search(/\S/) })
      start = i + 1
    }
  }

  const tail = body.slice(start)
  if (tail.trim()) {
    statements.push({ text: tail.trim(), index: sourceOffset + start + tail.search(/\S/), missingSemicolon: true })
  }
  return statements
}

function validateProcedureStatements(source, form, diagnostics) {
  const components = new Set([form.name, ...form.components.map((c) => c.id)])
  const propsByComponent = new Map(form.components.map((c) => [c.id.toLowerCase(), new Set(Object.keys(c.props || {}))]))

  for (const proc of findProcedureBodies(source)) {
    for (const stmt of splitStatements(proc.body, proc.bodyIndex)) {
      if (stmt.missingSemicolon && STATEMENT_START.test(stmt.text)) {
        diagnostics.push(makeDiagnostic(source, stmt.index + stmt.text.length, 'E2066', 'Missing statement terminator ";"'))
      }

      let m = stmt.text.match(/^([A-Za-z_]\w*)\s*\(/)
      if (m && !KNOWN_PROCS.has(m[1]) && !KNOWN_FUNCS.has(m[1])) {
        diagnostics.push(makeDiagnostic(source, stmt.index, 'E2003', `Undeclared identifier: '${m[1]}'`, 'warning'))
      }

      m = stmt.text.match(/^([A-Za-z_]\w*)\s*\.\s*([A-Za-z_]\w*)/)
      if (!m) continue
      const [, compName, propName] = m
      if (!components.has(compName)) {
        diagnostics.push(makeDiagnostic(source, stmt.index, 'E2003', `Undeclared identifier: '${compName}'`))
        continue
      }
      const props = propsByComponent.get(compName.toLowerCase())
      if (props && !props.has(propName) && !['Lines', 'Clear', 'SetFocus'].includes(propName)) {
        diagnostics.push(makeDiagnostic(source, stmt.index + compName.length + 1, 'E2003', `Undeclared property or method: '${propName}'`, 'warning'))
      }
    }
  }
}

function dedupeDiagnostics(items) {
  const seen = new Set()
  return items.filter((d) => {
    const key = `${d.line}:${d.col}:${d.code}:${d.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => (a.line - b.line) || (a.col - b.col))
}

export function compilePascal(form, source) {
  const { diagnostics, tokens } = scanSource(source)
  validateUnitShape(source, tokens, diagnostics)
  validateBlocks(source, tokens, diagnostics)
  validateProcedureStatements(source, form, diagnostics)

  const finalDiagnostics = dedupeDiagnostics(diagnostics)
  return {
    ok: finalDiagnostics.every((d) => d.severity !== 'error'),
    diagnostics: finalDiagnostics,
  }
}
