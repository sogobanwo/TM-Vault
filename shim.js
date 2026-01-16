// Must be first - polyfills crypto.getRandomValues
import "react-native-get-random-values"

import "@ethersproject/shims"
import { Buffer } from "buffer"
import "fast-text-encoding"

global.Buffer = Buffer
