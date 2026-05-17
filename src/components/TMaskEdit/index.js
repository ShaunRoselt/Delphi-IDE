import { editBody, editRuntime } from '../helpers.js'

export default {
  type: 'TMaskEdit',
  definition: { kind: 'edit', w: 121, h: 21, prefix: 'MaskEdit', icon: '#', cat: 'Additional' },
  properties: [['EditMask', 'string'], ['Text', 'string']],
  defaultEvent: 'OnChange',
  renderDesigner: editBody,
  renderRuntime: editRuntime,
}
