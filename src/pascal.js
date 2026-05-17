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
export function highlightPascal(src) {
  let out = ''
  let plain = ''
  const len = src.length
  let i = 0

  const flush = () => {
    if (plain) { out += escapeHtml(plain); plain = '' }
  }
  const span = (cls, text) => `<span class="tok-${cls}">${escapeHtml(text)}</span>`

  while (i < len) {
    const ch = src[i]
    const next = src[i + 1]

    if (ch === '/' && next === '/') {
      flush()
      let j = i
      while (j < len && src[j] !== '\n') j++
      out += span('c', src.slice(i, j))
      i = j
      continue
    }

    if (ch === '{') {
      flush()
      let j = i + 1
      while (j < len && src[j] !== '}') j++
      if (j < len) j++
      out += span('c', src.slice(i, j))
      i = j
      continue
    }

    if (ch === '(' && next === '*') {
      flush()
      let j = i + 2
      while (j < len - 1 && !(src[j] === '*' && src[j + 1] === ')')) j++
      j = Math.min(j + 2, len)
      out += span('c', src.slice(i, j))
      i = j
      continue
    }

    if (ch === "'") {
      flush()
      let j = i + 1
      while (j < len) {
        if (src[j] === "'") {
          if (src[j + 1] === "'") { j += 2; continue }
          j++
          break
        }
        j++
      }
      out += span('s', src.slice(i, j))
      i = j
      continue
    }

    if (ch >= '0' && ch <= '9') {
      flush()
      let j = i
      while (j < len && /[0-9.]/.test(src[j])) j++
      out += span('n', src.slice(i, j))
      i = j
      continue
    }

    if (IDENT_START.test(ch)) {
      let j = i
      while (j < len && IDENT_BODY.test(src[j])) j++
      const word = src.slice(i, j)
      if (KEYWORDS.has(word.toLowerCase())) {
        flush()
        out += span('k', word)
      } else if (TYPES.has(word)) {
        flush()
        out += span('t', word)
      } else {
        plain += word
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
