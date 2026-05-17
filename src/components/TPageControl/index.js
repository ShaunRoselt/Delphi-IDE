export default {
  type: 'TPageControl',
  definition: { kind: 'pagecontrol', w: 185, h: 121, prefix: 'PageControl', icon: '▤', cat: 'Win32' },
  properties: [['ActivePageIndex', 'int']],
  defaultEvent: 'OnChange',
  renderDesigner: () => '<div class="ctl-tabs"><span class="ctl-tab active">Tab1</span><span class="ctl-tab">Tab2</span></div><div class="ctl-tab-body"></div>',
}
