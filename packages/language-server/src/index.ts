import {
  createConnection,
  createServer,
  createSimpleProject,
  loadTsdkByPath,
} from '@volar/language-server/node'
import { getLanguagePlugin } from 'ts-macro'
import { create as createCssService } from 'volar-service-css'
import { create as createEmmetService } from 'volar-service-emmet'
import { create as createTypeScriptServices } from 'volar-service-typescript'
export { getLanguagePlugin }

const connection = createConnection()
const server = createServer(connection)

connection.listen()

connection.onInitialize(async (params) => {
  const tsdk = loadTsdkByPath(
    params.initializationOptions.typescript.tsdk,
    params.locale,
  )

  const result = await server.initialize(
    params,
    createSimpleProject([
      getLanguagePlugin(tsdk.typescript, params.workspaceFolders![0].uri),
    ]),
    [
      createCssService(),
      createEmmetService(),
      ...createTypeScriptServices(tsdk.typescript).filter(
        (plugin) => plugin.name === 'typescript-syntactic',
      ),
    ],
  )

  result.capabilities.semanticTokensProvider = undefined

  return result
})

connection.onInitialized(server.initialized)

connection.onShutdown(server.shutdown)
