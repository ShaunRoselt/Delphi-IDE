import { buttonRuntime, textBody } from '../helpers.js'

export default {
  type: 'TButton',
  definition: { kind: 'button', w: 75, h: 25, prefix: 'Button', icon: 'OK', cat: 'Standard' },
  properties: [['Caption', 'string'], ['Default', 'bool'], ['Cancel', 'bool'], ['Enabled', 'bool', true], ['Visible', 'bool', true], ['TabOrder', 'int'], ['Hint', 'string'], ['ShowHint', 'bool']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => textBody(c),
  renderRuntime: buttonRuntime,
}
