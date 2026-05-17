export default {
  type: 'TStringGrid',
  definition: { kind: 'grid', w: 185, h: 121, prefix: 'StringGrid', icon: '⊞', cat: 'Additional' },
  properties: [['ColCount', 'int', 5], ['RowCount', 'int', 5], ['FixedCols', 'int', 1], ['FixedRows', 'int', 1]],
  defaultEvent: 'OnClick',
  renderDesigner: () => `<div class="ctl-grid">${Array.from({ length: 5 }).map(() =>
    `<div class="ctl-grid-row">${Array.from({ length: 5 }).map(() => '<div class="ctl-grid-cell"></div>').join('')}</div>`,
  ).join('')}</div>`,
}
