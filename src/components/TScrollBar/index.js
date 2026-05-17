export default {
  type: 'TScrollBar',
  definition: { kind: 'scrollbar', w: 121, h: 17, prefix: 'ScrollBar', icon: '⇔', cat: 'Standard' },
  properties: [['Kind', 'enum:sbHorizontal,sbVertical'], ['Min', 'int'], ['Max', 'int', 100], ['Position', 'int']],
  defaultEvent: 'OnChange',
  renderDesigner: () => '<div class="ctl-scrollbar"><span>◀</span><div class="ctl-sb-track"><div class="ctl-sb-thumb"></div></div><span>▶</span></div>',
}
