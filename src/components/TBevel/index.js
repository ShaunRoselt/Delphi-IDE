export default {
  type: 'TBevel',
  definition: { kind: 'bevel', w: 50, h: 50, prefix: 'Bevel', icon: '▭', cat: 'Additional' },
  properties: [['Shape', 'enum:bsBox,bsFrame,bsTopLine,bsBottomLine,bsLeftLine,bsRightLine,bsSpacer'], ['Style', 'enum:bsLowered,bsRaised']],
  defaultEvent: 'OnMouseDown',
  renderDesigner: () => '',
}
