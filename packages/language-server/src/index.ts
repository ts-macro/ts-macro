import {
  createConnection,
  createServer,
  createTypeScriptProject,
  loadTsdkByPath,
} from "@volar/language-server/node";
import { create as createCssService } from "volar-service-css";
import { create as createEmmetService } from "volar-service-emmet";
import { create as createTypeScriptServices } from "volar-service-typescript";
import { getLanguagePlugin } from "./language-plugin";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  const tsdk = loadTsdkByPath(
    params.initializationOptions.typescript.tsdk,
    params.locale,
  );
  const project = createTypeScriptProject(
    tsdk.typescript,
    tsdk.diagnosticMessages,
    () => ({
      languagePlugins: [getLanguagePlugin(tsdk.typescript)],
    }),
  );

  return server.initialize(params, project, [
    createCssService(),
    createEmmetService(),
    ...createTypeScriptServices(tsdk.typescript).filter(
      (plugin) => plugin.name === "typescript-syntactic",
    ),
  ]);
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);
