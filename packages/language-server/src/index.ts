import {
  createConnection,
  createServer,
  createTypeScriptProject,
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
    createTypeScriptProject(
      tsdk.typescript,
      tsdk.diagnosticMessages,
      ({ projectHost, sys, configFileName }) => {
        const configDir = projectHost.getCurrentDirectory()
        const configFilePath = configFileName || `${configDir}/tsconfig.json`
        const parsedCommandLine =
          tsdk.typescript.parseJsonSourceFileConfigFileContent(
            tsdk.typescript.readJsonConfigFile(configFilePath, sys.readFile),
            sys,
            configDir,
            {},
            configFilePath,
          )
        return {
          languagePlugins: [
            getLanguagePlugin(
              tsdk.typescript,
              configDir,
              parsedCommandLine.options,
            ),
          ],
        }
      },
    ),
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
