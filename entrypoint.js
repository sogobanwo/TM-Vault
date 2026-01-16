import 'react-native-get-random-values';
import '@ethersproject/shims';
import '@walletconnect/react-native-compat';
import { Buffer } from 'buffer';
import 'fast-text-encoding';

global.Buffer = Buffer;

import 'expo-router/entry';
