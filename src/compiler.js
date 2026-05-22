// Compile pipeline for the Delphi-IDE prototype. Replaces the old regex
// validator with a real lexer + parser + light semantic walk that produces
// line/col-correct diagnostics. Parse errors are hard errors — the runtime
// won't launch until they're cleared.

import { tokenize, LexError } from './lang/lexer.js'
import { parseUnit, ParseError } from './lang/parser.js'
import { getBuiltin } from './lang/builtins.js'

function makeDiagnostic(line, col, code, message, severity = 'error') {
  return { line, col, code, message, severity }
}

function walkAst(unit, visitor) {
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type) visitor(node)
    for (const key of Object.keys(node)) {
      const v = node[key]
      if (Array.isArray(v)) v.forEach(visit)
      else if (v && typeof v === 'object' && v.type) visit(v)
    }
  }
  visit(unit)
}

function collectDeclaredNames(unit) {
  const names = new Set()
  const all = [unit.interface, unit.implementation]
  for (const section of all) {
    if (!section) continue
    for (const v of section.vars || []) names.add(v.name.toLowerCase())
    for (const c of section.consts || []) names.add(c.name.toLowerCase())
    for (const r of section.procs || []) names.add(r.name.toLowerCase())
    for (const t of section.types || []) if (t.type === 'ClassDecl') {
      names.add(t.name.toLowerCase())
      for (const f of t.fields || []) names.add(f.name.toLowerCase())
      for (const m of t.methods || []) names.add(m.name.toLowerCase())
      for (const p of t.properties || []) names.add(p.name.toLowerCase())
    }
  }
  return names
}

function collectRoutineLocals(routine) {
  const names = new Set()
  for (const p of routine.params || []) names.add(p.name.toLowerCase())
  for (const v of routine.locals || []) names.add(v.name.toLowerCase())
  if (routine.kind === 'function') names.add('result')
  return names
}

function semanticCheck(unit, form, diagnostics) {
  const componentNames = new Set([form.name.toLowerCase(), ...form.components.map((c) => c.id.toLowerCase())])
  const propsByComponent = new Map(
    form.components.map((c) => [c.id.toLowerCase(), new Set(Object.keys(c.props || {}).map((p) => p.toLowerCase()))]),
  )
  const declaredAtUnit = collectDeclaredNames(unit)

  const RESERVED_KNOWN_MEMBERS = new Set([
    'lines', 'text', 'count', 'add', 'clear', 'insert', 'delete', 'setfocus',
    'show', 'hide', 'close', 'free', 'caption', 'color', 'width', 'height',
    'enabled', 'visible', 'checked', 'refresh', 'update', 'message', 'create',
  ])

  for (const proc of [...(unit.interface.procs || []), ...(unit.implementation.procs || [])]) {
    if (!proc.body) continue
    const locals = collectRoutineLocals(proc)

    walkAst(proc.body, (node) => {
      if (node.type === 'Call' && node.callee?.type === 'Ident') {
        const lower = node.callee.name.toLowerCase()
        if (lower === 'inc' || lower === 'dec') return
        if (getBuiltin(lower)) return
        if (declaredAtUnit.has(lower)) return
        if (locals.has(lower)) return
        if (componentNames.has(lower)) return
        diagnostics.push(makeDiagnostic(node.callee.line, node.callee.col, 'E2003',
          `Undeclared identifier: '${node.callee.name}'`, 'error'))
      }
      if (node.type === 'Member' && node.object?.type === 'Ident') {
        const ownerLower = node.object.name.toLowerCase()
        if (!componentNames.has(ownerLower)) return
        const props = propsByComponent.get(ownerLower)
        const memberLower = node.name.toLowerCase()
        if (!props) return
        if (props.has(memberLower)) return
        if (RESERVED_KNOWN_MEMBERS.has(memberLower)) return
        diagnostics.push(makeDiagnostic(node.line, node.col, 'E2003',
          `Undeclared property or method: '${node.name}'`, 'warning'))
      }
    })
  }
}

export function compilePascal(form, source) {
  const diagnostics = []

  try { tokenize(source) }
  catch (err) {
    if (err instanceof LexError) {
      diagnostics.push(makeDiagnostic(err.line, err.col, 'E2029', err.message))
      return { ok: false, diagnostics, unit: null }
    }
    throw err
  }

  let unit
  try { unit = parseUnit(source) }
  catch (err) {
    if (err instanceof ParseError) {
      diagnostics.push(makeDiagnostic(err.line, err.col, 'E2029', err.message))
      return { ok: false, diagnostics, unit: null }
    }
    throw err
  }

  semanticCheck(unit, form, diagnostics)
  const errors = diagnostics.filter((d) => d.severity === 'error').length
  return { ok: errors === 0, diagnostics: dedupe(diagnostics), unit }
}

function dedupe(list) {
  const seen = new Set()
  return list.filter((d) => {
    const key = `${d.line}:${d.col}:${d.code}:${d.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => (a.line - b.line) || (a.col - b.col))
}
