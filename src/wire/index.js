import { wireGlobal, wireMenus, wireTabs, wireWelcome } from './chrome.js'
import { wirePalette } from './palette.js'
import { wireStructure, wireInspector } from './inspector.js'
import { wireDesigner } from './designer.js'
import { wireDesignerTools } from './designer-tools.js'
import { wireLayoutResize } from './layout.js'
import { wireCodeEditor } from './code.js'
import { wireRuntime } from './runtime.js'
import './keyboard.js'

export function wireAll() {
  wireGlobal()
  wireMenus()
  wireTabs()
  wirePalette()
  wireStructure()
  wireInspector()
  wireDesigner()
  wireDesignerTools()
  wireLayoutResize()
  wireCodeEditor()
  wireWelcome()
  wireRuntime()
}
