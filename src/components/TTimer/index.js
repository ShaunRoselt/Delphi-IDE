import { emptyRuntime } from '../helpers.js'

export default {
  type: 'TTimer',
  definition: { kind: 'nonvisual', w: 32, h: 32, prefix: 'Timer', icon: '⏲', cat: 'System', nonvisual: true },
  properties: [['Enabled', 'bool', true], ['Interval', 'int', 1000]],
  defaultEvent: 'OnTimer',
  renderRuntime: emptyRuntime,
}
