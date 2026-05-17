function fraction(p) {
  const range = ((p.Max ?? 100) - (p.Min ?? 0)) || 1
  return Math.min(100, Math.max(0, (((p.Position ?? 0) - (p.Min ?? 0)) / range) * 100))
}

export default {
  type: 'TProgressBar',
  definition: { kind: 'progressbar', w: 150, h: 17, prefix: 'ProgressBar', icon: '▓', cat: 'Win32' },
  properties: [['Min', 'int'], ['Max', 'int', 100], ['Position', 'int'], ['Step', 'int', 10], ['Smooth', 'bool']],
  defaultEvent: 'OnClick',
  renderDesigner: (c) => `<div class="ctl-pb-track"><div class="ctl-pb-fill" style="width:${fraction(c.props || {})}%"></div></div>`,
  renderRuntime: (c, style, attrs) => `<div class="rt-pb" style="${style}" ${attrs.id}><div class="rt-pb-fill" style="width:${fraction(c.props || {})}%"></div></div>`,
}
