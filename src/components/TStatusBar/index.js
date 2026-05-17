export default {
  type: 'TStatusBar',
  definition: { kind: 'statusbar', w: 250, h: 19, prefix: 'StatusBar', icon: '⎯', cat: 'Win32' },
  properties: [['SimplePanel', 'bool'], ['SimpleText', 'string']],
  defaultEvent: 'OnClick',
  renderDesigner: () => '<span class="ctl-text">Ready</span>',
}
