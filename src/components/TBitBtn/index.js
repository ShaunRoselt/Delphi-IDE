import { buttonRuntime, textBody } from '../helpers.js'

export default {
  type: 'TBitBtn',
  definition: { kind: 'bitbtn', w: 75, h: 25, prefix: 'BitBtn', icon: 'OK', cat: 'Additional' },
  properties: [['Caption', 'string'], ['Kind', 'enum:bkCustom,bkOK,bkCancel,bkHelp,bkYes,bkNo,bkClose,bkAbort,bkRetry,bkIgnore,bkAll']],
  defaultEvent: 'OnClick',
  renderDesigner: textBody,
  renderRuntime: buttonRuntime,
}
