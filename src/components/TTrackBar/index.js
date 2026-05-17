export default {
  type: 'TTrackBar',
  definition: { kind: 'trackbar', w: 150, h: 33, prefix: 'TrackBar', icon: '⊟', cat: 'Win32' },
  properties: [['Min', 'int'], ['Max', 'int', 10], ['Position', 'int']],
  defaultEvent: 'OnChange',
  renderDesigner: (c) => {
    const p = c.props || {}
    const range = ((p.Max ?? 10) - (p.Min ?? 0)) || 1
    const frac = Math.min(100, Math.max(0, (((p.Position ?? 0) - (p.Min ?? 0)) / range) * 100))
    return `<div class="ctl-tb-track"></div><div class="ctl-tb-thumb" style="left:${frac}%"></div>`
  },
  renderRuntime: (c, style, attrs) => {
    const p = c.props || {}
    const min = p.Min ?? 0
    const max = p.Max ?? 10
    const disabled = p.Enabled === false ? 'disabled' : ''
    return `<input type="range" class="rt-track" style="${style}" ${attrs.id} min="${min}" max="${max}" value="${p.Position ?? min}" ${disabled} />`
  },
}
