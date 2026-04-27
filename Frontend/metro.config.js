const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Resolver para módulos de Node.js que no existen en React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Módulos de Node.js que no están disponibles en React Native
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
