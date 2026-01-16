const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push("mjs")

// Force browser versions of packages that have Node.js dependencies
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect jose to browser build
  if (moduleName === "jose" || moduleName.startsWith("jose/")) {
    const browserPath = moduleName.replace(
      /^jose(\/.*)?$/,
      "jose/dist/browser$1"
    )
    return context.resolveRequest(context, browserPath, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: "./global.css" })

