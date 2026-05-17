export { COMPONENT_DEFS, COMMON_PROPS, DEFAULT_EVENT } from './components/index.js'

export const PALETTE_CATEGORIES = [
  'Standard', 'Additional', 'Win32', 'System', 'Dialogs',
  'Data Access', 'Data Controls', 'dbExpress', 'LiveBindings',
  'Internet', 'Indy Clients', 'Indy Servers', 'Samples',
]

export const EVENT_LIST = [
  'OnClick', 'OnChange', 'OnEnter', 'OnExit',
  'OnKeyDown', 'OnKeyPress', 'OnKeyUp',
  'OnMouseDown', 'OnMouseMove', 'OnMouseUp', 'OnDblClick',
]

export const FORM_EVENTS = ['OnCreate', 'OnDestroy', 'OnShow', 'OnClose', 'OnResize']

export const MENU_DEFS = {
  File:     ['New ▶','Open Project... | Ctrl+O','Open File... | Ctrl+F11','-','Save | Ctrl+S','Save As...','Save Project As...','Save All | Shift+Ctrl+S','-','Close','Close All','-','Exit'],
  Edit:     ['Undo | Ctrl+Z','Redo | Shift+Ctrl+Z','-','Cut | Ctrl+X','Copy | Ctrl+C','Paste | Ctrl+V','Delete | Del','Select All | Ctrl+A'],
  Search:   ['Find... | Ctrl+F','Replace... | Ctrl+R','Find Next | F3','Find in Files... | Shift+Ctrl+F','-','Go to Line Number... | Alt+G'],
  View:     ['Project Manager | Ctrl+Alt+F11','Structure | Ctrl+Shift+Alt+F11','Object Inspector | F11','Tool Palette | Ctrl+Alt+P','-','Toggle Form/Unit | F12','Units... | Ctrl+F12','Forms... | Shift+F12'],
  Refactor: ['Rename...','Extract Method...','Find Unit...','-','Find References...'],
  Project:  ['Add to Project...','Remove from Project...','-','Build | Shift+F9','Compile | Ctrl+F9','Build All Projects','-','Options... | Shift+Ctrl+F11'],
  Run:      ['Run | F9','Run Without Debugging | Shift+Ctrl+F9','-','Parameters...','-','Step Over | F8','Trace Into | F7','Run to Cursor | F4','-','Program Reset | Ctrl+F2'],
  Component:['New Component...','Install Component...','Import Component...','-','Configure Palette...'],
  Tools:    ['Options...','Configure Tools...','-','GetIt Package Manager...','-','Form Designer','Translation Manager'],
  Window:   ['Welcome Page','Cascade','Tile Horizontally','Tile Vertically'],
  Help:     ['Embarcadero Documentation','Welcome Page','-','About Embarcadero RAD Studio'],
}

export const PLATFORMS = ['Windows 64-bit','Windows 32-bit','Linux 64-bit','macOS ARM 64-bit','Android 64-bit','iOS Device 64-bit']
export const CONFIGURATIONS = ['Debug', 'Release']
export const LAYOUTS = ['Default Layout', 'Classic Undocked', 'Debug', 'Designer', 'Editor only']

export const DELPHI_COLORS = {
  clBtnFace: '#f0f0f0', clWindow: '#ffffff', clWhite: '#ffffff', clBlack: '#000000',
  clRed: '#ff0000', clBlue: '#0000ff', clGreen: '#008000', clYellow: '#ffff00',
  clNavy: '#000080', clMaroon: '#800000', clSilver: '#c0c0c0', clGray: '#808080',
  clTeal: '#008080', clActiveCaption: '#99b4d1',
}
