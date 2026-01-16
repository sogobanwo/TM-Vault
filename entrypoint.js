// 1. First, import polyfills that MUST be initialized before anything else
import 'react-native-get-random-values';
import '@ethersproject/shims';
import '@walletconnect/react-native-compat';
import { Buffer } from 'buffer';
import 'fast-text-encoding';

// 2. Set global Buffer
global.Buffer = Buffer;

// 3. Finally, import the expo router entry point
import 'expo-router/entry';
