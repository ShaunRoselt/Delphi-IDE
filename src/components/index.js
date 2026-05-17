import TButton from './TButton/index.js'
import TLabel from './TLabel/index.js'
import TEdit from './TEdit/index.js'
import TMemo from './TMemo/index.js'
import TCheckBox from './TCheckBox/index.js'
import TRadioButton from './TRadioButton/index.js'
import TListBox from './TListBox/index.js'
import TComboBox from './TComboBox/index.js'
import TGroupBox from './TGroupBox/index.js'
import TPanel from './TPanel/index.js'
import TScrollBar from './TScrollBar/index.js'
import TBitBtn from './TBitBtn/index.js'
import TSpeedButton from './TSpeedButton/index.js'
import TMaskEdit from './TMaskEdit/index.js'
import TStringGrid from './TStringGrid/index.js'
import TImage from './TImage/index.js'
import TShape from './TShape/index.js'
import TBevel from './TBevel/index.js'
import TStaticText from './TStaticText/index.js'
import TSplitter from './TSplitter/index.js'
import TPageControl from './TPageControl/index.js'
import TTabControl from './TTabControl/index.js'
import TProgressBar from './TProgressBar/index.js'
import TTrackBar from './TTrackBar/index.js'
import TUpDown from './TUpDown/index.js'
import TTreeView from './TTreeView/index.js'
import TListView from './TListView/index.js'
import TStatusBar from './TStatusBar/index.js'
import TToolBar from './TToolBar/index.js'
import TDateTimePicker from './TDateTimePicker/index.js'
import TTimer from './TTimer/index.js'
import TPaintBox from './TPaintBox/index.js'
import TOpenDialog from './TOpenDialog/index.js'
import TSaveDialog from './TSaveDialog/index.js'
import TColorDialog from './TColorDialog/index.js'
import TFontDialog from './TFontDialog/index.js'
import { escapeHtml } from '../util.js'

export const COMPONENTS = [
  TButton, TLabel, TEdit, TMemo, TCheckBox, TRadioButton, TListBox, TComboBox, TGroupBox, TPanel,
  TScrollBar, TBitBtn, TSpeedButton, TMaskEdit, TStringGrid, TImage, TShape, TBevel, TStaticText,
  TSplitter, TPageControl, TTabControl, TProgressBar, TTrackBar, TUpDown, TTreeView, TListView,
  TStatusBar, TToolBar, TDateTimePicker, TTimer, TPaintBox, TOpenDialog, TSaveDialog, TColorDialog,
  TFontDialog,
]

export const COMPONENT_DEFS = Object.fromEntries(COMPONENTS.map((component) => [component.type, component.definition]))
export const COMMON_PROPS = Object.fromEntries(COMPONENTS.map((component) => [component.type, component.properties || []]))
export const DEFAULT_EVENT = Object.fromEntries(
  COMPONENTS.filter((component) => component.defaultEvent).map((component) => [component.type, component.defaultEvent]),
)

export function getComponent(type) {
  return COMPONENTS.find((component) => component.type === type) || null
}

export function renderDesignerComponent(c) {
  const component = getComponent(c.type)
  if (!component) return ''
  if (component.renderDesigner) return component.renderDesigner(c)
  if (component.definition.kind === 'nonvisual') {
    return `<div class="ctl-nonvis">${component.definition.icon}<br><small>${escapeHtml(c.id)}</small></div>`
  }
  return ''
}

export function renderRuntimeComponent(c, style, attrs) {
  if (c.props?.Visible === false) return ''
  const component = getComponent(c.type)
  return component?.renderRuntime ? component.renderRuntime(c, style, attrs) : ''
}
