import { escapeHtml } from './util.js'

const KEYWORDS = new Set([
  'unit', 'interface', 'implementation', 'uses', 'type', 'class', 'end', 'var', 'begin',
  'procedure', 'function', 'private', 'public', 'protected', 'published',
  'if', 'then', 'else', 'while', 'do', 'for', 'to', 'downto', 'repeat', 'until',
  'case', 'of', 'with', 'try', 'except', 'finally', 'raise', 'nil', 'true', 'false',
  'const', 'inherited', 'out', 'in', 'as', 'is', 'not', 'and', 'or', 'xor',
  'div', 'mod', 'shl', 'shr', 'new', 'self', 'result', 'exit', 'continue', 'break',
])

const TYPES = new Set([
  'TObject', 'TForm', 'TButton', 'TLabel', 'TEdit', 'TMemo', 'TCheckBox', 'TRadioButton',
  'TListBox', 'TComboBox', 'TGroupBox', 'TPanel', 'TImage', 'TShape', 'TBevel',
  'TStaticText', 'TBitBtn', 'TSpeedButton', 'TStringGrid', 'TPageControl', 'TTabControl',
  'TProgressBar', 'TTrackBar', 'TUpDown', 'TTreeView', 'TListView', 'TStatusBar',
  'TToolBar', 'TTimer', 'TPaintBox', 'TOpenDialog', 'TSaveDialog', 'TColorDialog', 'TFontDialog',
  'Integer', 'String', 'Boolean', 'Double', 'Single', 'Byte', 'Char', 'Cardinal', 'Pointer', 'Variant',
])

const IDENT_START = /[A-Za-z_]/
const IDENT_BODY = /[A-Za-z0-9_]/

// Single-pass tokenizer. Critically, this does not run regex replacements over
// its own HTML output — the previous implementation broke on the word "class"
// inside attributes like `class="tok-t"`.
export function highlightPascal(src, diagnostics = []) {
  let out = ''
  let plain = ''
  const len = src.length
  let i = 0

  const diagAt = (startCol, length) => {
    const endCol = startCol + length
    let best = null
    for (const d of diagnostics) {
      if (d.col >= startCol && d.col <= endCol) {
        if (!best || (d.severity === 'error' && best.severity !== 'error')) best = d
      }
    }
    return best
  }

  const flush = () => {
    if (plain) { out += escapeHtml(plain); plain = '' }
  }

  const emit = (cls, text, startIndex) => {
    const startCol = startIndex + 1
    const d = diagAt(startCol, text.length)
    const extra = d ? ` ${d.severity === 'error' ? 'tok-err' : 'tok-warn'}` : ''
    const title = d ? ` title="${escapeHtml(d.message)}"` : ''
    out += `<span class="tok-${cls}${extra}"${title}>${escapeHtml(text)}</span>`
  }

  while (i < len) {
    const ch = src[i]
    const next = src[i + 1]

    if (ch === '/' && next === '/') {
      flush()
      const start = i
      let j = i
      while (j < len && src[j] !== '\n') j++
      emit('c', src.slice(start, j), start)
      i = j
      continue
    }

    if (ch === '{') {
      flush()
      const start = i
      let j = i + 1
      while (j < len && src[j] !== '}') j++
      if (j < len) j++
      emit('c', src.slice(start, j), start)
      i = j
      continue
    }

    if (ch === '(' && next === '*') {
      flush()
      const start = i
      let j = i + 2
      while (j < len - 1 && !(src[j] === '*' && src[j + 1] === ')')) j++
      j = Math.min(j + 2, len)
      emit('c', src.slice(start, j), start)
      i = j
      continue
    }

    if (ch === "'") {
      flush()
      const start = i
      let j = i + 1
      while (j < len) {
        if (src[j] === "'") {
          if (src[j + 1] === "'") { j += 2; continue }
          j++
          break
        }
        j++
      }
      emit('s', src.slice(start, j), start)
      i = j
      continue
    }

    if (ch >= '0' && ch <= '9') {
      flush()
      const start = i
      let j = i
      while (j < len && /[0-9.]/.test(src[j])) j++
      emit('n', src.slice(start, j), start)
      i = j
      continue
    }

    if (IDENT_START.test(ch)) {
      const start = i
      let j = i
      while (j < len && IDENT_BODY.test(src[j])) j++
      const word = src.slice(start, j)
      if (KEYWORDS.has(word.toLowerCase())) {
        flush()
        emit('k', word, start)
      } else if (TYPES.has(word)) {
        flush()
        emit('t', word, start)
      } else {
        const d = diagAt(start + 1, word.length)
        if (d) {
          flush()
          out += `<span class="tok-id ${d.severity === 'error' ? 'tok-err' : 'tok-warn'}" title="${escapeHtml(d.message)}">${escapeHtml(word)}</span>`
        } else {
          plain += word
        }
      }
      i = j
      continue
    }

    plain += ch
    i++
  }

  flush()
  return out
}

const KNOWN_PROCS = [
  'ShowMessage', 'MessageDlg', 'Beep', 'Inc', 'Dec', 'Assigned', 'FreeAndNil',
  'IntToStr', 'StrToInt', 'StrToIntDef', 'FloatToStr', 'Length',
  'UpperCase', 'LowerCase', 'Trim', 'Copy', 'Pos',
]

const FORM_MEMBERS = [
  ['Caption', 'property', 'String'],
  ['Color', 'property', 'TColor'],
  ['Width', 'property', 'Integer'],
  ['Height', 'property', 'Integer'],
  ['ClientWidth', 'property', 'Integer'],
  ['ClientHeight', 'property', 'Integer'],
  ['Position', 'property', 'TPosition'],
  ['BorderStyle', 'property', 'TBorderStyle'],
  ['Show', 'method', 'procedure'],
  ['Close', 'method', 'procedure'],
  ['Hide', 'method', 'procedure'],
  ['Free', 'method', 'procedure'],
]

const COMPONENT_MEMBER_DEFAULTS = [
  ['SetFocus', 'method', 'procedure'],
  ['Free', 'method', 'procedure'],
  ['Show', 'method', 'procedure'],
  ['Hide', 'method', 'procedure'],
]

export function collectSymbols(form) {
  const identifiers = []
  const members = {}

  if (!form) return { identifiers, members }

  const pushIdent = (s) => identifiers.push(s)

  // Form itself
  pushIdent({ label: form.name, kind: 'component', detail: form.className })
  members[form.name.toLowerCase()] = FORM_MEMBERS.map(([label, kind, detail]) => ({ label, kind, detail }))

  // Components
  for (const c of form.components || []) {
    pushIdent({ label: c.id, kind: 'component', detail: c.type })
    const props = Object.keys(c.props || {}).map((p) => ({ label: p, kind: 'property', detail: c.type }))
    const events = Object.keys(c.events || {}).map((e) => ({ label: e, kind: 'event', detail: 'event' }))
    members[c.id.toLowerCase()] = [
      ...props,
      ...events,
      ...COMPONENT_MEMBER_DEFAULTS.map(([label, kind, detail]) => ({ label, kind, detail })),
    ]
  }

  // Handlers
  const seen = new Set()
  for (const c of form.components || []) {
    for (const handler of Object.values(c.events || {})) {
      if (handler && !seen.has(handler)) {
        seen.add(handler)
        pushIdent({ label: handler, kind: 'procedure', detail: 'event handler' })
      }
    }
  }

  // Keywords and types
  for (const k of KEYWORDS) pushIdent({ label: k, kind: 'keyword' })
  for (const t of TYPES) pushIdent({ label: t, kind: 'type' })

  // Built-ins
  for (const p of KNOWN_PROCS) pushIdent({ label: p, kind: 'function' })

  return { identifiers, members }
}

export function analyzeCompletionContext(text, caretOffset) {
  let start = caretOffset
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) start--
  const partial = text.slice(start, caretOffset)

  let dotBase = null
  if (start > 0 && text[start - 1] === '.') {
    let baseEnd = start - 1
    let baseStart = baseEnd
    while (baseStart > 0 && /[A-Za-z0-9_]/.test(text[baseStart - 1])) baseStart--
    if (baseStart < baseEnd) dotBase = text.slice(baseStart, baseEnd)
  }

  return { partial, partialStart: start, dotBase }
}

export function findProcedureLines(source) {
  const lines = source.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*procedure\s+([A-Za-z_]\w*)\s*\.\s*([A-Za-z_]\w*)/)
    if (m) result.push({ qualified: `${m[1]}.${m[2]}`, name: m[2], line: i + 1 })
  }
  return result
}

export function findDeclarationLine(source, identifier) {
  const lines = source.split('\n')
  const wordRe = new RegExp(`\\b${identifier.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`)
  // Prefer the procedure implementation line.
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*procedure\s+\w+\s*\.\s*(\w+)/)
    if (m && m[1] === identifier) return i + 1
  }
  // Then the field/property declaration inside the class.
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (/^\s*procedure\s+/i.test(ln)) continue
    if (wordRe.test(ln)) return i + 1
  }
  return -1
}

function collectHandlers(form) {
  const seen = new Set()
  const out = []
  for (const c of form.components) {
    for (const handler of Object.values(c.events || {})) {
      if (handler && !seen.has(handler)) {
        seen.add(handler)
        out.push(handler)
      }
    }
  }
  return out
}

export function generatePascal(form) {
  if (form.code) return form.code
  const handlers = collectHandlers(form)
  const lines = [
    `unit ${form.unitName};`,
    '',
    'interface',
    '',
    'uses',
    '  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,',
    '  System.Classes, Vcl.Graphics, Vcl.Controls, Vcl.Forms, Vcl.Dialogs,',
    '  Vcl.StdCtrls, Vcl.ExtCtrls, Vcl.ComCtrls;',
    '',
    'type',
    `  ${form.className} = class(TForm)`,
    ...form.components.map((c) => `    ${c.id}: ${c.type};`),
    ...handlers.map((h) => `    procedure ${h}(Sender: TObject);`),
    '  private',
    '    { Private declarations }',
    '  public',
    '    { Public declarations }',
    '  end;',
    '',
    'var',
    `  ${form.name}: ${form.className};`,
    '',
    'implementation',
    '',
    '{$R *.dfm}',
    '',
  ]
  for (const h of handlers) {
    lines.push(
      `procedure ${form.className}.${h}(Sender: TObject);`,
      'begin',
      `  { TODO: ${h} body }`,
      'end;',
      '',
    )
  }
  lines.push('end.')
  return lines.join('\n')
}
