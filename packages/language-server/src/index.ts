import { join } from 'node:path'
import { getLanguagePlugins } from '@ts-macro/language-plugin'
import { getOptions } from '@ts-macro/language-plugin/options'
import {
  createConnection,
  createServer,
  createTypeScriptProject,
  loadTsdkByPath,
} from '@volar/language-server/node'
import { create as createCssService } from 'volar-service-css'
import { create as createTypeScriptSyntacticPlugin } from 'volar-service-typescript/lib/plugins/syntactic'

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
          languagePlugins: getLanguagePlugins(
            tsdk.typescript,
            compilerOptions,
            getOptions(tsdk.typescript),
          ),
        }
      },
    ),
    [createCssService(), createTypeScriptSyntacticPlugin(tsdk.typescript)],
  )

  result.capabilities.semanticTokensProvider = undefined
  result.capabilities.documentHighlightProvider = undefined

  return result
})

connection.onInitialized(server.initialized)

connection.onShutdown(server.shutdown)

function getCompilerOptions(
  ts: typeof import('typescript'),
  configFileName?: string,
) {
  if (configFileName) {
    configFileName = configFileName.endsWith('.json')
      ? configFileName
      : join(configFileName, 'tsconfig.json')
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
