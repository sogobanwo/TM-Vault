// Import required polyfills first
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import 'fast-text-encoding';
import 'react-native-get-random-values';

// Set global Buffer
global.Buffer = Buffer;

// Then import the expo router
import 'expo-router/entry';
