// Full-source Object Pascal syntax highlighter. Operates on the complete
// source string so multi-line {…} and (* *) comments are highlighted correctly.
// Produces an HTML string with embedded \n that can be set as pre.innerHTML.

import { escapeHtml } from '../util.js'

const KEYWORDS = new Set([
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

const BUILTINS = new Set([
  'showmessage', 'messagedlg', 'beep', 'inttostr', 'strtoint', 'strtointdef',
  'floattostr', 'strtofloat', 'format', 'length', 'copy', 'pos', 'uppercase',
  'lowercase', 'trim', 'trimleft', 'trimright', 'stringreplace', 'ord', 'chr',
  'succ', 'pred', 'abs', 'sqr', 'sqrt', 'round', 'trunc', 'frac', 'int',
  'min', 'max', 'random', 'randomize', 'odd', 'assigned', 'freeandnil',
  'inc', 'dec', 'setlength', 'writeln', 'readln',
])

const TYPES = new Set([
  'integer', 'boolean', 'double', 'single', 'byte', 'char', 'cardinal',
  'pointer', 'variant', 'word', 'longint', 'int64', 'shortint', 'smallint',
  'extended', 'currency', 'comp', 'real', 'ansistring', 'widestring',
  'unicodestring', 'pchar', 'pwidechar', 'shortstring', 'nativeint',
  'nativeuint', 'uint64', 'tbytes', 'rawbytestring',
  'tobject', 'tform', 'tbutton', 'tlabel', 'tedit', 'tmemo',
  'tcheckbox', 'tradiobutton', 'tlistbox', 'tcombobox', 'tgroupbox',
  'tpanel', 'timage', 'tshape', 'tbevel', 'tstatictext', 'tbitbtn',
  'tspeedbutton', 'tstringgrid', 'tpagecontrol', 'ttabcontrol',
  'tprogressbar', 'ttrackbar', 'tupdown', 'ttreeview', 'tlistview',
  'tstatusbar', 'ttoolbar', 'ttimer', 'tpaintbox', 'topendialog',
  'tsavedialog', 'tcolordialog', 'tfontdialog', 'tstrings', 'tstringlist',
  'tcomponent', 'tcontrol', 'twincontrol', 'taction', 'tcolor', 'tfont',
  'tcursor', 'trect', 'tpoint', 'tsize',
])

function buildDiagMap(diagnostics) {
  const map = new Map()
  for (const d of diagnostics || []) {
    if (!map.has(d.line)) map.set(d.line, [])
    map.get(d.line).push(d)
  }
  return map
}

function diagForToken(diagMap, line, col, len) {
  const items = diagMap.get(line)
  if (!items) return null
  const endCol = col + len
  let best = null
  for (const d of items) {
    if (d.col >= col && d.col < endCol) {
      if (!best || (d.severity === 'error' && best.severity !== 'error')) best = d
    }
  }
  return best
}

function emitSpan(cls, text, diagMap, line, col) {
  if (!text) return ''
  const d = diagMap ? diagForToken(diagMap, line, col, text.length) : null
  const extra = d ? ` ${d.severity === 'error' ? 'tok-err' : 'tok-warn'}` : ''
  const title = d ? ` title="${escapeHtml(d.message)}"` : ''
  return `<span class="tok-${cls}${extra}"${title}>${escapeHtml(text)}</span>`
}

export function highlightPascalFull(src, diagnostics) {
  const diagMap = buildDiagMap(diagnostics)
  let out = ''
  const len = src.length
  let i = 0
  let line = 1
  let col = 1

  const cur = () => src[i]
  const peek = () => src[i + 1] ?? ''

  const step = () => {
    if (src[i] === '\n') { line++; col = 1 } else col++
    i++
  }

  while (i < len) {
    const ch = cur()
    const nx = peek()

    // Line comment (//)
    if (ch === '/' && nx === '/') {
      const sl = line, sc = col
      let text = ''
      while (i < len && cur() !== '\n') { text += cur(); step() }
      out += emitSpan('c', text, diagMap, sl, sc)
      continue
    }

    // Brace comment or compiler directive ({ ... } or {$ ... })
    if (ch === '{') {
      const sl = line, sc = col
      let text = ch; step()
      const isDir = i < len && cur() === '$'
      while (i < len && cur() !== '}') { text += cur(); step() }
      if (i < len) { text += cur(); step() }
      out += emitSpan(isDir ? 'dir' : 'c', text, diagMap, sl, sc)
      continue
    }

    // Paren-star comment (* ... *)
    if (ch === '(' && nx === '*') {
      const sl = line, sc = col
      let text = ch; step()
      text += cur(); step()
      while (i < len - 1 && !(cur() === '*' && peek() === ')')) { text += cur(); step() }
      if (i < len) { text += cur(); step() }
      if (i < len) { text += cur(); step() }
      out += emitSpan('c', text, diagMap, sl, sc)
      continue
    }

    // String / char literal ('...' or #NN or 'a'#13'b')
    if (ch === "'" || ch === '#') {
      const sl = line, sc = col
      let text = ''
      while (i < len && (cur() === "'" || cur() === '#')) {
        if (cur() === "'") {
          text += cur(); step()
          while (i < len && cur() !== '\n') {
            if (cur() === "'") {
              text += cur(); step()
              if (i < len && cur() === "'") { text += cur(); step(); continue }
              break
            }
            text += cur(); step()
          }
        } else {
          text += cur(); step()
          if (i < len && cur() === '$') { text += cur(); step() }
          while (i < len && /[0-9A-Fa-f]/.test(cur())) { text += cur(); step() }
        }
      }
      out += emitSpan('s', text, diagMap, sl, sc)
      continue
    }

    // $HEX literal
    if (ch === '$') {
      const sl = line, sc = col
      let text = ch; step()
      while (i < len && /[0-9A-Fa-f]/i.test(cur())) { text += cur(); step() }
      out += emitSpan('n', text, diagMap, sl, sc)
      continue
    }

    // Numeric literal (integer or real)
    if (ch >= '0' && ch <= '9') {
      const sl = line, sc = col
      let text = ''
      while (i < len && /[0-9]/.test(cur())) { text += cur(); step() }
      if (i < len && cur() === '.' && peek() !== '.' && /[0-9]/.test(src[i + 1] ?? '')) {
        text += cur(); step()
        while (i < len && /[0-9]/.test(cur())) { text += cur(); step() }
      }
      if (i < len && (cur() === 'e' || cur() === 'E')) {
        text += cur(); step()
        if (i < len && (cur() === '+' || cur() === '-')) { text += cur(); step() }
        while (i < len && /[0-9]/.test(cur())) { text += cur(); step() }
      }
      out += emitSpan('n', text, diagMap, sl, sc)
      continue
    }

    // Identifier → keyword / type / builtin / plain identifier
    if (/[A-Za-z_]/.test(ch)) {
      const sl = line, sc = col
      let text = ''
      while (i < len && /[A-Za-z0-9_]/.test(cur())) { text += cur(); step() }
      const lower = text.toLowerCase()
      let cls
      if (KEYWORDS.has(lower)) cls = 'k'
      else if (TYPES.has(lower)) cls = 't'
      else if (BUILTINS.has(lower)) cls = 'b'
      else cls = 'id'
      out += emitSpan(cls, text, diagMap, sl, sc)
      continue
    }

    // Newline — output raw so the pre renders lines correctly
    if (ch === '\n') {
      out += '\n'; step()
      continue
    }

    // Whitespace — pass through verbatim (no span needed)
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      let ws = ''
      while (i < len && (cur() === ' ' || cur() === '\t' || cur() === '\r')) {
        ws += cur(); step()
      }
      out += escapeHtml(ws)
      continue
    }

    // Multi-char operators
    const sl = line, sc = col
    const twoChar = ch + nx
    if (twoChar === ':=' || twoChar === '<=' || twoChar === '>=' ||
        twoChar === '<>' || twoChar === '..') {
      out += emitSpan('op', twoChar, diagMap, sl, sc)
      step(); step()
      continue
    }

    // Single-char operator vs delimiter
    if ('+-*/=<>@^'.includes(ch)) {
      out += emitSpan('op', ch, diagMap, sl, sc)
    } else {
      out += emitSpan('sym', ch, diagMap, sl, sc)
    }
    step()
  }

  return out || ' '
}
