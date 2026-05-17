export default {
  type: 'TToolBar',
  definition: { kind: 'toolbar', w: 250, h: 29, prefix: 'ToolBar', icon: '⎯', cat: 'Win32' },
  properties: [['Caption', 'string']],
  defaultEvent: 'OnClick',
  renderDesigner: () => '<div class="ctl-toolbar"><span>▰</span><span>▣</span><span>⌕</span></div>',
}
