import { textBody } from '../helpers.js'
import { escapeHtml } from '../../util.js'

export default {
  type: 'TPanel',
  definition: { kind: 'panel', w: 185, h: 41, prefix: 'Panel', icon: '▣', cat: 'Standard' },
  properties: [['Caption', 'string'], ['BevelInner', 'enum:bvNone,bvLowered,bvRaised,bvSpace'], ['BevelOuter', 'enum:bvNone,bvLowered,bvRaised,bvSpace']],
  defaultEvent: 'OnClick',
  renderDesigner: textBody,
  renderRuntime: (c, style, attrs) => `<div class="rt-panel" style="${style}" ${attrs.id}>${escapeHtml(c.props?.Caption || '')}</div>`,
}
