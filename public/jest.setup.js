const { TextEncoder, TextDecoder } = require('util');
require('jest-fetch-mock').enableMocks();


global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
