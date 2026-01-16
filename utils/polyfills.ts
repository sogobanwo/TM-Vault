// utils/polyfills.ts
import 'react-native-get-random-values'
import 'fast-text-encoding'
import 'react-native-url-polyfill/auto'
import { Buffer } from 'buffer'
import process from 'process'
import '@ethersproject/shims'
import '@walletconnect/react-native-compat' 

// Expose Node globals
global.Buffer = Buffer
global.process = process
if (typeof btoa === 'undefined') {
    global.btoa = function (str) {
        return new Buffer(str, 'binary').toString('base64')
    }
}
if (typeof atob === 'undefined') {
    global.atob = function (b64Encoded) {
        return new Buffer(b64Encoded, 'base64').toString('binary')
    }
}
