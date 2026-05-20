const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
// Sube 2 niveles para llegar a la raiz del monorepo (uniconnect/)
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Configuracion obligatoria para monorepos
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// Resolver para modulos de Node.js que no existen en React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Modulos de Node.js que no estan disponibles en React Native
  if (
    moduleName === "crypto" ||
    moduleName === "http" ||
    moduleName === "https" ||
    moduleName === "stream" ||
    moduleName === "zlib" ||
    moduleName === "assert" ||
    moduleName === "util" ||
    moduleName === "tty" ||
    moduleName === "os" ||
    moduleName === "path"
  ) {
    // Retorna un modulo vacio para evitar errores
    return {
      type: "empty",
    };
  }

  // Usa el resolver por defecto para otros modulos
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
