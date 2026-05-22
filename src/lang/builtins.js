// RTL subset implemented for the interpreter. Names are matched
// case-insensitively (Delphi semantics). Each entry returns a JS value;
// the interpreter takes care of coercing it back into a Pascal-shaped
// result (booleans render as True/False via formatPascalValue).

export function formatPascalValue(v) {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  return String(v)
}

function argCount(name, args, expected) {
  if (args.length !== expected) {
    throw new RuntimeBuiltinError(`${name} expects ${expected} argument(s), got ${args.length}`)
  }
}

export class RuntimeBuiltinError extends Error {}

function format(fmt, args) {
  let out = ''
  let i = 0
  let argIdx = 0
  while (i < fmt.length) {
    const ch = fmt[i]
    if (ch !== '%') { out += ch; i++; continue }
    i++
    // optional index specifier %0:
    let indexSpec = null
    const numStart = i
    while (i < fmt.length && /[0-9]/.test(fmt[i])) i++
    if (i < fmt.length && fmt[i] === ':') {
      indexSpec = parseInt(fmt.slice(numStart, i), 10)
      i++
    }
    // flags
    while (i < fmt.length && '-+ 0#'.includes(fmt[i])) i++
    // width
    while (i < fmt.length && /[0-9*]/.test(fmt[i])) i++
    // precision
    if (i < fmt.length && fmt[i] === '.') {
      i++
      while (i < fmt.length && /[0-9*]/.test(fmt[i])) i++
    }
    const spec = fmt[i]
    i++
    const a = indexSpec != null ? args[indexSpec] : args[argIdx++]
    if (spec === 'd' || spec === 'D') out += String(Math.trunc(Number(a) || 0))
    else if (spec === 's' || spec === 'S') out += String(a ?? '')
    else if (spec === 'f' || spec === 'F') out += Number(a).toFixed(2)
    else if (spec === 'g' || spec === 'G') out += String(Number(a))
    else if (spec === 'x' || spec === 'X') out += Math.trunc(Number(a) || 0).toString(16).toUpperCase()
    else if (spec === '%') out += '%'
    else out += String(a ?? '')
  }
  return out
}

export const BUILTINS = {
  showmessage: { kind: 'procedure', args: 1, call: ([msg], ctx) => ctx.host.showMessage(formatPascalValue(msg)) },
  messagedlg: { kind: 'function', call: ([msg], ctx) => (ctx.host.showMessage(formatPascalValue(msg)), 1) },
  beep: { kind: 'procedure', call: () => {} },

  inttostr: { kind: 'function', call: ([v]) => { argCount('IntToStr', [v], 1); return String(Math.trunc(Number(v) || 0)) } },
  strtoint: { kind: 'function', call: ([v]) => { argCount('StrToInt', [v], 1); const n = parseInt(String(v).trim(), 10); if (Number.isNaN(n)) throw new RuntimeBuiltinError(`'${v}' is not a valid integer value`); return n } },
  strtointdef: { kind: 'function', call: ([v, d]) => { argCount('StrToIntDef', [v, d], 2); const n = parseInt(String(v).trim(), 10); return Number.isNaN(n) ? d : n } },
  floattostr: { kind: 'function', call: ([v]) => String(Number(v)) },
  strtofloat: { kind: 'function', call: ([v]) => { const n = parseFloat(String(v).trim()); if (Number.isNaN(n)) throw new RuntimeBuiltinError(`'${v}' is not a valid float value`); return n } },
  format: { kind: 'function', call: ([fmt, list]) => format(String(fmt), Array.isArray(list) ? list : [list]) },

  length: { kind: 'function', call: ([v]) => Array.isArray(v) ? v.length : String(v ?? '').length },
  copy: { kind: 'function', call: ([s, idx, count]) => String(s ?? '').substring((idx | 0) - 1, (idx | 0) - 1 + (count | 0)) },
  pos: { kind: 'function', call: ([sub, s]) => String(s ?? '').indexOf(String(sub ?? '')) + 1 },
  uppercase: { kind: 'function', call: ([s]) => String(s ?? '').toUpperCase() },
  lowercase: { kind: 'function', call: ([s]) => String(s ?? '').toLowerCase() },
  trim: { kind: 'function', call: ([s]) => String(s ?? '').trim() },
  trimleft: { kind: 'function', call: ([s]) => String(s ?? '').replace(/^\s+/, '') },
  trimright: { kind: 'function', call: ([s]) => String(s ?? '').replace(/\s+$/, '') },
  stringreplace: { kind: 'function', call: ([s, oldv, newv]) => String(s ?? '').split(String(oldv)).join(String(newv)) },

  ord: { kind: 'function', call: ([v]) => {
    if (typeof v === 'string') return v.charCodeAt(0) || 0
    if (typeof v === 'boolean') return v ? 1 : 0
    return Number(v) | 0
  } },
  chr: { kind: 'function', call: ([v]) => String.fromCharCode(Number(v) | 0) },
  succ: { kind: 'function', call: ([v]) => typeof v === 'number' ? v + 1 : String.fromCharCode((v.charCodeAt(0) || 0) + 1) },
  pred: { kind: 'function', call: ([v]) => typeof v === 'number' ? v - 1 : String.fromCharCode((v.charCodeAt(0) || 0) - 1) },

  abs: { kind: 'function', call: ([v]) => Math.abs(Number(v)) },
  sqr: { kind: 'function', call: ([v]) => { const n = Number(v); return n * n } },
  sqrt: { kind: 'function', call: ([v]) => Math.sqrt(Number(v)) },
  round: { kind: 'function', call: ([v]) => Math.round(Number(v)) },
  trunc: { kind: 'function', call: ([v]) => Math.trunc(Number(v)) },
  frac: { kind: 'function', call: ([v]) => Number(v) - Math.trunc(Number(v)) },
  int: { kind: 'function', call: ([v]) => Math.trunc(Number(v)) },
  min: { kind: 'function', call: ([a, b]) => Math.min(Number(a), Number(b)) },
  max: { kind: 'function', call: ([a, b]) => Math.max(Number(a), Number(b)) },
  random: { kind: 'function', call: ([n]) => n != null ? Math.floor(Math.random() * Number(n)) : Math.random() },
  randomize: { kind: 'procedure', call: () => {} },

  odd: { kind: 'function', call: ([v]) => (Number(v) | 0) % 2 !== 0 },
  assigned: { kind: 'function', call: ([v]) => v != null },

  // No-ops / convenience
  freeandnil: { kind: 'procedure', call: () => {} },

  // Inc/Dec are special-cased in the interpreter (they need a writable target).
}

export function isBuiltin(name) {
  return Object.prototype.hasOwnProperty.call(BUILTINS, name.toLowerCase())
}

export function getBuiltin(name) {
  return BUILTINS[name.toLowerCase()] || null
}
