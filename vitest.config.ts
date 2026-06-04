import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@react-navigation/native': resolve(__dirname, 'src/test/mocks/react-navigation-native.ts'),
      'react-native': resolve(__dirname, 'src/test/mocks/react-native.tsx'),
      'expo-modules-core': resolve(__dirname, 'src/test/mocks/expo-modules-core.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
