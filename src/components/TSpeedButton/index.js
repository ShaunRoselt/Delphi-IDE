import { buttonRuntime, textBody } from '../helpers.js'

export default {
  type: 'TSpeedButton',
  definition: { kind: 'speedbutton', w: 23, h: 22, prefix: 'SpeedButton', icon: '⏵', cat: 'Additional' },
  properties: [['Caption', 'string'], ['Down', 'bool'], ['Flat', 'bool'], ['GroupIndex', 'int']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => textBody(c, 'ctl-text', ''),
  renderRuntime: buttonRuntime,
}
