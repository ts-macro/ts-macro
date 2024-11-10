import {
  createConnection,
  createServer,
  createTypeScriptProject,
  loadTsdkByPath,
} from '@volar/language-server/node'
import { getLanguagePlugins } from 'ts-macro'
import { create as createCssService } from 'volar-service-css'
import { create as createEmmetService } from 'volar-service-emmet'
import { create as createTypeScriptServices } from 'volar-service-typescript'

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
      ({ configFileName }) => {
        const compilerOptions = getCompilerOptions(
          tsdk.typescript,
          configFileName,
        )
        return {
          languagePlugins: getLanguagePlugins(tsdk.typescript, compilerOptions),
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

function getCompilerOptions(
  ts: typeof import('typescript'),
  configFileName?: string,
) {
  if (configFileName) {
    const parsedCommandLine = ts.parseJsonSourceFileConfigFileContent(
      ts.readJsonConfigFile(configFileName, ts.sys.readFile),
      ts.sys,
      ts.sys.getCurrentDirectory(),
      {},
      configFileName,
    )
    return parsedCommandLine.options
  } else {
    return ts.getDefaultCompilerOptions()
  }
}
