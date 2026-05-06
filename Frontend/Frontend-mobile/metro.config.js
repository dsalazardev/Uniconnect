const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Definir las rutas del proyecto y del monorepo
const projectRoot = __dirname;
// Sube 2 niveles para llegar a la raíz del monorepo (uniconnect/)
const workspaceRoot = path.resolve(projectRoot, "../..");
const sharedRoot = path.resolve(projectRoot, "../shared"); // <-- Ruta hacia tu carpeta shared

const config = getDefaultConfig(projectRoot);

// ==========================================================
// 1. CONFIGURACIÓN PARA EL MONOREPO (Workspaces)
// ==========================================================
// Dile a Metro que vigile la raíz del monorepo
config.watchFolders = [workspaceRoot];

// Dile a Metro dónde buscar los node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(sharedRoot, "node_modules"), // <-- Busca en las dependencias de shared
];

// Fuerza a Metro a resolver de forma correcta los módulos duplicados
config.resolver.disableHierarchicalLookup = true;

// ==========================================================
// 2. CONFIGURACIÓN PARA MÓDULOS DE NODE.JS (Tu código original)
// ==========================================================
// Resolver para módulos de Node.js que no existen en React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
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
    // Retorna un módulo vacío para evitar errores
    return {
      type: "empty",
    };
  }

  // Usa el resolver por defecto para otros módulos
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;