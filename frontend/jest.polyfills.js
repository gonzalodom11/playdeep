import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { URL, URLSearchParams } from 'url';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock URL if not available
if (typeof global.URL === 'undefined') {
  global.URL = URL;
}

if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = URLSearchParams;
} 