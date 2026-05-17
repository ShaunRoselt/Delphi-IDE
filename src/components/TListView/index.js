export default {
  type: 'TListView',
  definition: { kind: 'listview', w: 250, h: 150, prefix: 'ListView', icon: '☷', cat: 'Win32' },
  properties: [['ViewStyle', 'enum:vsIcon,vsSmallIcon,vsList,vsReport']],
  defaultEvent: 'OnClick',
  renderDesigner: () => '<div class="ctl-listview"><div class="ctl-lv-head">Name | Size | Date</div><div>File1.txt | 1KB | Today</div><div>File2.txt | 2KB | Today</div></div>',
}
