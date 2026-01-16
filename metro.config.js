const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push("mjs")

const emptyModule = path.resolve(__dirname, "shims/empty.js")

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve("readable-stream"),
  crypto: require.resolve("crypto-browserify"),
  https: emptyModule,
  http: emptyModule,
  net: emptyModule,
  tls: emptyModule,
  zlib: emptyModule,
  fs: emptyModule,
  path: emptyModule,
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "jose" || moduleName.startsWith("jose/")) {
    const browserPath = moduleName.replace(
      /^jose(\/.*)?$/,
      "jose/dist/browser$1"
    )
    return context.resolveRequest(context, browserPath, platform)
  }

  if (moduleName === "stream") {
    return {
      filePath: require.resolve("readable-stream"),
      type: "sourceFile",
    }
  }

  if (moduleName === "crypto") {
    return {
      filePath: require.resolve("crypto-browserify"),
      type: "sourceFile",
    }
  }

  if (moduleName === "ws" || moduleName.startsWith("ws/")) {
    return {
      filePath: emptyModule,
      type: "sourceFile",
    }
  }

  if (moduleName === "isows" || moduleName.startsWith("isows/")) {
    return {
      filePath: emptyModule,
      type: "sourceFile",
    }
  }

  
  const nodeBuiltins = ["https", "http", "net", "tls", "zlib", "fs", "url", "os", "child_process"]
  if (nodeBuiltins.includes(moduleName)) {
    return {
      filePath: emptyModule,
      type: "sourceFile",
    }
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: "./global.css" })
