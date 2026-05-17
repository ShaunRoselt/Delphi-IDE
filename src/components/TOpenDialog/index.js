import { emptyRuntime } from '../helpers.js'

export default {
  type: 'TOpenDialog',
  definition: { kind: 'nonvisual', w: 32, h: 32, prefix: 'OpenDialog', icon: '📂', cat: 'Dialogs', nonvisual: true },
  properties: [],
  renderRuntime: emptyRuntime,
}
