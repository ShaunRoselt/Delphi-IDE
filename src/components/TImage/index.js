export default {
  type: 'TImage',
  definition: { kind: 'image', w: 105, h: 105, prefix: 'Image', icon: '🖼', cat: 'Additional' },
  properties: [['Stretch', 'bool'], ['Center', 'bool'], ['Proportional', 'bool']],
  defaultEvent: 'OnClick',
  renderDesigner: () => '<div class="ctl-image">🖼</div>',
  renderRuntime: (c, style, attrs) => `<div class="rt-image" style="${style}" ${attrs.id}>🖼</div>`,
}
