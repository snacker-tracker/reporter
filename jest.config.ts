import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  preset: "ts-jest/presets/js-with-babel",
  verbose: true,
  "moduleFileExtensions": ["ts","js","json","node"]
};

export default config;
