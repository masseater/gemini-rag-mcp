import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['src/**/*.ts'],
  ignore: [
    'dist/**',
    'coverage/**',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],
};

export default config;
