export default {
  type: 'TUpDown',
  definition: { kind: 'updown', w: 15, h: 21, prefix: 'UpDown', icon: '⇕', cat: 'Win32' },
  properties: [],
  defaultEvent: 'OnClick',
  renderDesigner: () => '<div class="ctl-updown"><span>▲</span><span>▼</span></div>',
}
