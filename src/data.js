export const COMPONENT_DEFS = {
  TButton:         { kind: 'button',       w:  75, h: 25, prefix: 'Button',         icon: 'OK',  cat: 'Standard' },
  TLabel:          { kind: 'label',        w:  44, h: 13, prefix: 'Label',          icon: 'A',   cat: 'Standard' },
  TEdit:           { kind: 'edit',         w: 121, h: 21, prefix: 'Edit',           icon: 'ab|', cat: 'Standard' },
  TMemo:           { kind: 'memo',         w: 185, h: 89, prefix: 'Memo',           icon: '≡',   cat: 'Standard' },
  TCheckBox:       { kind: 'checkbox',     w:  97, h: 17, prefix: 'CheckBox',       icon: '☑',   cat: 'Standard' },
  TRadioButton:    { kind: 'radio',        w: 113, h: 17, prefix: 'RadioButton',    icon: '◉',   cat: 'Standard' },
  TListBox:        { kind: 'listbox',      w: 121, h: 97, prefix: 'ListBox',        icon: '☰',   cat: 'Standard' },
  TComboBox:       { kind: 'combobox',     w: 145, h: 21, prefix: 'ComboBox',       icon: '▼',   cat: 'Standard' },
  TGroupBox:       { kind: 'groupbox',     w: 185, h:105, prefix: 'GroupBox',       icon: '▢',   cat: 'Standard' },
  TPanel:          { kind: 'panel',        w: 185, h: 41, prefix: 'Panel',          icon: '▣',   cat: 'Standard' },
  TScrollBar:      { kind: 'scrollbar',    w: 121, h: 17, prefix: 'ScrollBar',      icon: '⇔',   cat: 'Standard' },
  TBitBtn:         { kind: 'bitbtn',       w:  75, h: 25, prefix: 'BitBtn',         icon: 'OK',  cat: 'Additional' },
  TSpeedButton:    { kind: 'speedbutton',  w:  23, h: 22, prefix: 'SpeedButton',    icon: '⏵',   cat: 'Additional' },
  TMaskEdit:       { kind: 'edit',         w: 121, h: 21, prefix: 'MaskEdit',       icon: '#',   cat: 'Additional' },
  TStringGrid:     { kind: 'grid',         w: 185, h:121, prefix: 'StringGrid',     icon: '⊞',   cat: 'Additional' },
  TImage:          { kind: 'image',        w: 105, h:105, prefix: 'Image',          icon: '🖼',  cat: 'Additional' },
  TShape:          { kind: 'shape',        w:  65, h: 65, prefix: 'Shape',          icon: '○',   cat: 'Additional' },
  TBevel:          { kind: 'bevel',        w:  50, h: 50, prefix: 'Bevel',          icon: '▭',   cat: 'Additional' },
  TStaticText:     { kind: 'statictext',   w: 105, h: 17, prefix: 'StaticText',     icon: 'T',   cat: 'Additional' },
  TSplitter:       { kind: 'splitter',     w:   3, h: 81, prefix: 'Splitter',       icon: '║',   cat: 'Additional' },
  TPageControl:    { kind: 'pagecontrol',  w: 185, h:121, prefix: 'PageControl',    icon: '▤',   cat: 'Win32' },
  TTabControl:     { kind: 'tabcontrol',   w: 185, h:121, prefix: 'TabControl',     icon: '▤',   cat: 'Win32' },
  TProgressBar:    { kind: 'progressbar',  w: 150, h: 17, prefix: 'ProgressBar',    icon: '▓',   cat: 'Win32' },
  TTrackBar:       { kind: 'trackbar',     w: 150, h: 33, prefix: 'TrackBar',       icon: '⊟',   cat: 'Win32' },
  TUpDown:         { kind: 'updown',       w:  15, h: 21, prefix: 'UpDown',         icon: '⇕',   cat: 'Win32' },
  TTreeView:       { kind: 'treeview',     w: 121, h: 97, prefix: 'TreeView',       icon: '⊟',   cat: 'Win32' },
  TListView:       { kind: 'listview',     w: 250, h:150, prefix: 'ListView',       icon: '☷',   cat: 'Win32' },
  TStatusBar:      { kind: 'statusbar',    w: 250, h: 19, prefix: 'StatusBar',      icon: '⎯',   cat: 'Win32' },
  TToolBar:        { kind: 'toolbar',      w: 250, h: 29, prefix: 'ToolBar',        icon: '⎯',   cat: 'Win32' },
  TDateTimePicker: { kind: 'edit',         w: 145, h: 21, prefix: 'DateTimePicker', icon: '📅',  cat: 'Win32' },
  TTimer:          { kind: 'nonvisual',    w:  32, h: 32, prefix: 'Timer',          icon: '⏲',   cat: 'System', nonvisual: true },
  TPaintBox:       { kind: 'paintbox',     w: 105, h:105, prefix: 'PaintBox',       icon: '✎',   cat: 'System' },
  TOpenDialog:     { kind: 'nonvisual',    w:  32, h: 32, prefix: 'OpenDialog',     icon: '📂',  cat: 'Dialogs', nonvisual: true },
  TSaveDialog:     { kind: 'nonvisual',    w:  32, h: 32, prefix: 'SaveDialog',     icon: '💾',  cat: 'Dialogs', nonvisual: true },
  TColorDialog:    { kind: 'nonvisual',    w:  32, h: 32, prefix: 'ColorDialog',    icon: '🎨',  cat: 'Dialogs', nonvisual: true },
  TFontDialog:     { kind: 'nonvisual',    w:  32, h: 32, prefix: 'FontDialog',     icon: 'F',   cat: 'Dialogs', nonvisual: true },
}

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

export const COMMON_PROPS = {
  TButton:        [['Caption','string'],['Default','bool'],['Cancel','bool'],['Enabled','bool',true],['Visible','bool',true],['TabOrder','int'],['Hint','string'],['ShowHint','bool']],
  TLabel:         [['Caption','string'],['AutoSize','bool',true],['Transparent','bool',true],['WordWrap','bool'],['Alignment','enum:taLeftJustify,taCenter,taRightJustify']],
  TEdit:          [['Text','string'],['ReadOnly','bool'],['PasswordChar','char'],['MaxLength','int'],['Enabled','bool',true]],
  TMemo:          [['Lines','strings'],['ReadOnly','bool'],['ScrollBars','enum:ssNone,ssHorizontal,ssVertical,ssBoth'],['WordWrap','bool',true]],
  TCheckBox:      [['Caption','string'],['Checked','bool'],['State','enum:cbUnchecked,cbChecked,cbGrayed'],['AllowGrayed','bool']],
  TRadioButton:   [['Caption','string'],['Checked','bool']],
  TListBox:       [['Items','strings'],['ItemIndex','int'],['Sorted','bool'],['MultiSelect','bool']],
  TComboBox:      [['Items','strings'],['ItemIndex','int'],['Text','string'],['Style','enum:csDropDown,csSimple,csDropDownList,csOwnerDrawFixed']],
  TGroupBox:      [['Caption','string']],
  TPanel:         [['Caption','string'],['BevelInner','enum:bvNone,bvLowered,bvRaised,bvSpace'],['BevelOuter','enum:bvNone,bvLowered,bvRaised,bvSpace']],
  TProgressBar:   [['Min','int'],['Max','int',100],['Position','int'],['Step','int',10],['Smooth','bool']],
  TTrackBar:      [['Min','int'],['Max','int',10],['Position','int']],
  TStaticText:    [['Caption','string']],
  TShape:         [['Brush.Color','color'],['Pen.Color','color'],['Shape','enum:stRectangle,stSquare,stRoundRect,stRoundSquare,stEllipse,stCircle']],
  TBevel:         [['Shape','enum:bsBox,bsFrame,bsTopLine,bsBottomLine,bsLeftLine,bsRightLine,bsSpacer'],['Style','enum:bsLowered,bsRaised']],
  TImage:         [['Stretch','bool'],['Center','bool'],['Proportional','bool']],
  TBitBtn:        [['Caption','string'],['Kind','enum:bkCustom,bkOK,bkCancel,bkHelp,bkYes,bkNo,bkClose,bkAbort,bkRetry,bkIgnore,bkAll']],
  TSpeedButton:   [['Caption','string'],['Down','bool'],['Flat','bool'],['GroupIndex','int']],
  TStringGrid:    [['ColCount','int',5],['RowCount','int',5],['FixedCols','int',1],['FixedRows','int',1]],
  TPageControl:   [['ActivePageIndex','int']],
  TTabControl:    [['Tabs','strings']],
  TTreeView:      [['Items','strings']],
  TListView:      [['ViewStyle','enum:vsIcon,vsSmallIcon,vsList,vsReport']],
  TStatusBar:     [['SimplePanel','bool'],['SimpleText','string']],
  TToolBar:       [['Caption','string']],
  TTimer:         [['Enabled','bool',true],['Interval','int',1000]],
  TScrollBar:     [['Kind','enum:sbHorizontal,sbVertical'],['Min','int'],['Max','int',100],['Position','int']],
  TMaskEdit:      [['EditMask','string'],['Text','string']],
}

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

export const DEFAULT_EVENT = {
  TButton: 'OnClick', TBitBtn: 'OnClick', TSpeedButton: 'OnClick',
  TLabel: 'OnClick', TPanel: 'OnClick', TGroupBox: 'OnClick',
  TCheckBox: 'OnClick', TRadioButton: 'OnClick', TStaticText: 'OnClick',
  TEdit: 'OnChange', TMaskEdit: 'OnChange', TMemo: 'OnChange',
  TComboBox: 'OnChange', TTrackBar: 'OnChange', TScrollBar: 'OnChange',
  TPageControl: 'OnChange', TTabControl: 'OnChange', TDateTimePicker: 'OnChange',
  TListBox: 'OnClick', TStringGrid: 'OnClick', TImage: 'OnClick',
  TShape: 'OnMouseDown', TBevel: 'OnMouseDown',
  TProgressBar: 'OnClick', TUpDown: 'OnClick',
  TTreeView: 'OnClick', TListView: 'OnClick',
  TStatusBar: 'OnClick', TToolBar: 'OnClick',
  TTimer: 'OnTimer', TPaintBox: 'OnPaint',
}

export const DELPHI_COLORS = {
  clBtnFace: '#f0f0f0', clWindow: '#ffffff', clWhite: '#ffffff', clBlack: '#000000',
  clRed: '#ff0000', clBlue: '#0000ff', clGreen: '#008000', clYellow: '#ffff00',
  clNavy: '#000080', clMaroon: '#800000', clSilver: '#c0c0c0', clGray: '#808080',
  clTeal: '#008080', clActiveCaption: '#99b4d1',
}
