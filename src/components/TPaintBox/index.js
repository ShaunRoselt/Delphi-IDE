export default {
  type: 'TPaintBox',
  definition: { kind: 'paintbox', w: 105, h: 105, prefix: 'PaintBox', icon: '✎', cat: 'System' },
  properties: [],
  defaultEvent: 'OnPaint',
  renderDesigner: () => '<div class="ctl-paintbox"></div>',
}
