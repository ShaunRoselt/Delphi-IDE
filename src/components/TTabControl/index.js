export default {
  type: 'TTabControl',
  definition: { kind: 'tabcontrol', w: 185, h: 121, prefix: 'TabControl', icon: '▤', cat: 'Win32' },
  properties: [['Tabs', 'strings']],
  defaultEvent: 'OnChange',
  renderDesigner: () => '<div class="ctl-tabs"><span class="ctl-tab active">Tab1</span><span class="ctl-tab">Tab2</span></div><div class="ctl-tab-body"></div>',
}
