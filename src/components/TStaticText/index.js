import { staticRuntime, textBody } from '../helpers.js'

export default {
  type: 'TStaticText',
  definition: { kind: 'statictext', w: 105, h: 17, prefix: 'StaticText', icon: 'T', cat: 'Additional' },
  properties: [['Caption', 'string']],
  defaultEvent: 'OnClick',
  renderDesigner: textBody,
  renderRuntime: staticRuntime,
}
