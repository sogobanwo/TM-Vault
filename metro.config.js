const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push("mjs")

// Create path to empty module for Node.js built-ins that don't exist in React Native
const emptyModule = path.resolve(__dirname, "shims/empty.js")

// Provide Node.js polyfills for packages that need them
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve("readable-stream"),
  crypto: require.resolve("crypto-browserify"),
  // Mock Node.js modules that ws/viem try to import
  https: emptyModule,
  http: emptyModule,
  net: emptyModule,
  tls: emptyModule,
  zlib: emptyModule,
  fs: emptyModule,
  path: emptyModule,
}

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

  // Redirect stream to readable-stream polyfill
  if (moduleName === "stream") {
    return {
      filePath: require.resolve("readable-stream"),
      type: "sourceFile",
    }
  }

  // Redirect crypto to crypto-browserify
  if (moduleName === "crypto") {
    return {
      filePath: require.resolve("crypto-browserify"),
      type: "sourceFile",
    }
  }

  // Mock the ws package entirely - React Native has native WebSocket
  if (moduleName === "ws" || moduleName.startsWith("ws/")) {
    return {
      filePath: emptyModule,
      type: "sourceFile",
    }
  }

  // Mock isows to use native WebSocket
  if (moduleName === "isows" || moduleName.startsWith("isows/")) {
    return {
      filePath: emptyModule,
      type: "sourceFile",
    }
  }

  // Mock Node.js built-in modules that various packages require
  // Note: crypto is NOT mocked - react-native-get-random-values provides the polyfill
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
