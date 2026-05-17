export default {
  type: 'TTreeView',
  definition: { kind: 'treeview', w: 121, h: 97, prefix: 'TreeView', icon: '⊟', cat: 'Win32' },
  properties: [['Items', 'strings']],
  defaultEvent: 'OnClick',
  renderDesigner: () => '<div class="ctl-tree">▾ Root<br>&nbsp;&nbsp;▸ Item1<br>&nbsp;&nbsp;▸ Item2</div>',
}
