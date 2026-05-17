import { editBody, editRuntime } from '../helpers.js'

export default {
  type: 'TDateTimePicker',
  definition: { kind: 'edit', w: 145, h: 21, prefix: 'DateTimePicker', icon: '📅', cat: 'Win32' },
  properties: [],
  defaultEvent: 'OnChange',
  renderDesigner: editBody,
  renderRuntime: editRuntime,
}
