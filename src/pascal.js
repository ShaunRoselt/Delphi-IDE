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

const ROUTINE_SIGNATURES = {
  ShowMessage: 'procedure ShowMessage(const Msg: string)',
  MessageDlg: 'function MessageDlg(const Msg: string; DlgType: TMsgDlgType; Buttons: TMsgDlgButtons; HelpCtx: Longint): Integer',
  IntToStr: 'function IntToStr(Value: Integer): string',
  StrToInt: 'function StrToInt(const S: string): Integer',
  StrToIntDef: 'function StrToIntDef(const S: string; Default: Integer): Integer',
  FloatToStr: 'function FloatToStr(Value: Extended): string',
  Length: 'function Length(S): Integer',
  Copy: 'function Copy(S; Index, Count: Integer): string',
  Pos: 'function Pos(Substr, S: string): Integer',
  Inc: 'procedure Inc(var X; N: Integer)',
  Dec: 'procedure Dec(var X; N: Integer)',
  Assigned: 'function Assigned(P): Boolean',
  FreeAndNil: 'procedure FreeAndNil(var Obj)',
}

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


export function getRoutineSignature(name) {
  if (!name) return null
  const found = Object.keys(ROUTINE_SIGNATURES).find((key) => key.toLowerCase() === name.toLowerCase())
  return found ? ROUTINE_SIGNATURES[found] : null
}

export function findNavigationSections(source) {
  const lines = source.split('\n')
  const sections = [{ label: 'Top of File', line: 1 }]
  const sectionWords = [
    ['interface', 'Interface Section'],
    ['uses', 'Interface Uses Clause'],
    ['implementation', 'Implementation Section'],
    ['initialization', 'Initialization Section'],
  ]
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim().toLowerCase()
    const found = sectionWords.find(([word]) => trimmed === word || trimmed.startsWith(`${word} `))
    if (found && !sections.some((s) => s.label === found[1])) sections.push({ label: found[1], line: i + 1 })
  }
  sections.push({ label: 'Bottom of File', line: Math.max(1, lines.length) })
  return sections
}

export function findTypeLines(source) {
  const lines = source.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*([A-Za-z_]\w*)\s*=\s*class\b/i)
    if (m) result.push({ name: m[1], line: i + 1 })
  }
  return result
}

function escapeRe(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function renameIdentifierInCode(source, oldName, newName) {
  if (!source || !oldName || !newName || oldName === newName) return source
  return source.replace(new RegExp(`\\b${escapeRe(oldName)}\\b`, 'g'), () => newName)
}

function componentFieldLines(form) {
  return [
    ...form.components.map((c) => `    ${c.id}: ${c.type};`),
    ...collectHandlers(form).map((h) => `    procedure ${h}(Sender: TObject);`),
  ]
}

function replaceClassDeclaration(source, form) {
  const classRe = new RegExp(`(^\\s*)${escapeRe(form.className)}\\s*=\\s*class\\(TForm\\)[\\s\\S]*?^\\s*end;`, 'mi')
  const block = [
    `  ${form.className} = class(TForm)`,
    ...componentFieldLines(form),
    '  private',
    '    { Private declarations }',
    '  public',
    '    { Public declarations }',
    '  end;',
  ].join('\n')
  if (classRe.test(source)) return source.replace(classRe, block)

  const typeRe = /^type\s*$/mi
  if (typeRe.test(source)) return source.replace(typeRe, `type\n${block}`)
  return source.replace(/\binterface\b/i, `interface\n\ntype\n${block}`)
}

function ensureHandlerImplementations(source, form) {
  let out = source
  for (const handler of collectHandlers(form)) {
    const procRe = new RegExp(`procedure\\s+${escapeRe(form.className)}\\s*\\.\\s*${escapeRe(handler)}\\s*\\(`, 'i')
    if (procRe.test(out)) continue
    const stub = `\nprocedure ${form.className}.${handler}(Sender: TObject);\nbegin\n  { TODO: ${handler} body }\nend;\n`
    out = /\nend\.\s*$/i.test(out)
      ? out.replace(/\nend\.\s*$/i, `${stub}\nend.\n`)
      : `${out.trimEnd()}${stub}`
  }
  return out
}

export function syncPascalWithForm(form) {
  if (!form) return ''
  let source = form.code || buildPascalUnit(form)
  source = source.replace(/^\s*unit\s+\w+\s*;/mi, `unit ${form.unitName};`)
  source = source.replace(/^\s*var\s*\n\s*\w+\s*:\s*\w+\s*;/mi, `var\n  ${form.name}: ${form.className};`)
  source = replaceClassDeclaration(source, form)
  source = ensureHandlerImplementations(source, form)
  form.code = source
  return source
}

export function completeDelphiBlock(lineHead, indent) {
  const trimmed = lineHead.trim().toLowerCase()
  if (trimmed === 'begin') return { text: `\n${indent}  \n${indent}end;`, caretBack: (`\n${indent}end;`).length }
  if (trimmed === 'try') return { text: `\n${indent}  \n${indent}finally\n${indent}  \n${indent}end;`, caretBack: (`\n${indent}finally\n${indent}  \n${indent}end;`).length }
  if (trimmed === 'repeat') return { text: `\n${indent}  \n${indent}until ;`, caretBack: (`\n${indent}until ;`).length }
  if (/^case\b.*\bof$/.test(trimmed)) return { text: `\n${indent}  \n${indent}end;`, caretBack: (`\n${indent}end;`).length }
  if (/\bthen$/.test(trimmed) || /\bdo$/.test(trimmed)) return { text: `\n${indent}  `, caretBack: 0 }
  return { text: `\n${indent}`, caretBack: 0 }
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

function buildPascalUnit(form) {
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

export function generatePascal(form) {
  return syncPascalWithForm(form)
}
