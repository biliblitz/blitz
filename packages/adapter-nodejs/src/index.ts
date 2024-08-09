import type { Plugin } from "vite";

export function nodejsAdapter(): Plugin {
  return {
    name: "blitz-adapter-nodejs",
    apply: "build",
    config() {
      return {
        build: {
          target: "esnext",
          outDir: "dist/nodejs",
          rollupOptions: {
            input: "./src/entry.nodejs.ts",
            output: {
              entryFileNames: "server.js",
              assetFileNames: "build/assets/[hash].[ext]",
            },
            external: [/^node:/, /node_modules/],
          },
          copyPublicDir: false,
          cssMinify: true,
        },
      };
    },
  };
}
