import { memoBody, memoRuntime } from '../helpers.js'

export default {
  type: 'TMemo',
  definition: { kind: 'memo', w: 185, h: 89, prefix: 'Memo', icon: '≡', cat: 'Standard' },
  properties: [['Lines', 'strings'], ['ReadOnly', 'bool'], ['ScrollBars', 'enum:ssNone,ssHorizontal,ssVertical,ssBoth'], ['WordWrap', 'bool', true]],
  defaultEvent: 'OnChange',
  renderDesigner: memoBody,
  renderRuntime: memoRuntime,
}
