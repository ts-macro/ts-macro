import * as serverProtocol from '@volar/language-server/protocol'
import { activateAutoInsertion, createLabsInfo, getTsdk } from '@volar/vscode'
import {
  LanguageClient,
  TransportKind,
  type LanguageClientOptions,
  type ServerOptions,
} from '@volar/vscode/node'
import {
  defineExtension,
  executeCommand,
  extensionContext,
  onDeactivate,
  useCommand,
  useFsWatcher,
  useOutputChannel,
} from 'reactive-vscode'
import * as vscode from 'vscode'

export = defineExtension(async () => {
  const outputChannel = useOutputChannel('TSM Language Server')
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { language: 'typescript' },
      { language: 'typescriptreact' },
    ],
    initializationOptions: await getInitializationOptions(
      extensionContext.value!,
    ),
    outputChannel,
  }
  const serverModule = vscode.Uri.joinPath(
    extensionContext.value!.extensionUri,
    'dist',
    'server.js',
  )
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: TransportKind.ipc,
      options: { execArgv: [] as string[] },
    },
    debug: {
      module: serverModule.fsPath,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', `--inspect=${6008}`] },
    },
  }
  const client = new LanguageClient(
    'tsm-language-server',
    'TSM Language Server',
    serverOptions,
    clientOptions,
  )
  client.start()

  // support for auto close tag
  activateAutoInsertion(['typescript'], client)
  // support for https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volarjs-labs
  // ref: https://twitter.com/johnsoncodehk/status/1656126976774791168
  const labsInfo = createLabsInfo(serverProtocol)
  labsInfo.addLanguageClient(client)

  useCommand('tsm.action.restartServer', restartServer)
  async function restartServer(restartTsServer = true) {
    if (restartTsServer) {
      await executeCommand('typescript.restartTsServer')
    }
    client.clientOptions.initializationOptions = await getInitializationOptions(
      extensionContext.value!,
    )
    await client.stop()
    outputChannel.clear()
    return client.start()
  }

  const watcher = useFsWatcher(['**/tsm.config.*'])
  watcher.onDidChange(() => {
    vscode.window.showInformationMessage(`Restart TS Macro Server.`)
    restartServer()
  })

  onDeactivate(() => {
    client?.stop()
  })

  return labsInfo.extensionExports
})

async function getInitializationOptions(
  context: vscode.ExtensionContext,
): Promise<LanguageClientOptions['initializationOptions']> {
  return {
    typescript: { tsdk: (await getTsdk(context))!.tsdk },
  }
}
