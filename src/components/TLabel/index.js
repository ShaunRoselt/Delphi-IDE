import { labelRuntime } from '../helpers.js'
import { escapeHtml } from '../../util.js'

export default {
  type: 'TLabel',
  definition: { kind: 'label', w: 44, h: 13, prefix: 'Label', icon: 'A', cat: 'Standard' },
  properties: [['Caption', 'string'], ['AutoSize', 'bool', true], ['Transparent', 'bool', true], ['WordWrap', 'bool'], ['Alignment', 'enum:taLeftJustify,taCenter,taRightJustify']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => `<span class="ctl-label">${escapeHtml(c.props?.Caption || c.id)}</span>`,
  renderRuntime: labelRuntime,
}
