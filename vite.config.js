import { defineConfig } from 'vite';import glsl from 'vite-plugin-glsl';


export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.glb')) {
            return 'assets/[name][extname]'; // Customize as needed
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.json'],
  plugins: [glsl()], // Ensure correct asset types
});

