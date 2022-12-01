import { defineConfig } from "vite";
import manifest from "./package.json" assert { type: "json" };

const filename = "kitten-scientists.inject.js";

const KG_SAVEGAME = process.env.KG_SAVEGAME ?? null;
const KS_SETTINGS = process.env.KS_SETTINGS ?? null;
const KS_VERSION = JSON.stringify(process.env.KS_VERSION ?? `${manifest.version}-live`);

export default defineConfig({
  build: {
    lib: {
      entry: "source/index.ts",
      name: "kitten-scientists",
    },
    minify: false,
    outDir: "output",
    rollupOptions: {
      output: {
        extend: true,
        format: "umd",
        entryFileNames: filename,
      },
    },
    sourcemap: "true",
  },
  define: {
    KG_SAVEGAME,
    KS_SETTINGS,
    KS_VERSION,
  },
});
