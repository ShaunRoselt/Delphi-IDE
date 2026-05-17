import { editBody, editRuntime } from '../helpers.js'

export default {
  type: 'TEdit',
  definition: { kind: 'edit', w: 121, h: 21, prefix: 'Edit', icon: 'ab|', cat: 'Standard' },
  properties: [['Text', 'string'], ['ReadOnly', 'bool'], ['PasswordChar', 'char'], ['MaxLength', 'int'], ['Enabled', 'bool', true]],
  defaultEvent: 'OnChange',
  renderDesigner: editBody,
  renderRuntime: editRuntime,
}
