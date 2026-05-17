function shapeSvg(p) {
  const isEllipse = typeof p.Shape === 'string' && (p.Shape.includes('Ellipse') || p.Shape.includes('Circle'))
  return isEllipse ? '<ellipse cx="50" cy="50" rx="48" ry="48" />' : '<rect x="1" y="1" width="98" height="98" />'
}

export default {
  type: 'TShape',
  definition: { kind: 'shape', w: 65, h: 65, prefix: 'Shape', icon: '○', cat: 'Additional' },
  properties: [['Brush.Color', 'color'], ['Pen.Color', 'color'], ['Shape', 'enum:stRectangle,stSquare,stRoundRect,stRoundSquare,stEllipse,stCircle']],
  defaultEvent: 'OnMouseDown',
  renderDesigner: (c) => `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${shapeSvg(c.props || {})}</svg>`,
  renderRuntime: (c, style, attrs) => `<svg class="rt-shape" style="${style}" ${attrs.id} viewBox="0 0 100 100" preserveAspectRatio="none">${shapeSvg(c.props || {})}</svg>`,
}
