// Must be first - polyfills crypto.getRandomValues
import "react-native-get-random-values"
import "@walletconnect/react-native-compat"

import "@ethersproject/shims"
import { Buffer } from "buffer"
import "fast-text-encoding"

global.Buffer = Buffer
