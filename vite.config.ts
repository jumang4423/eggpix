import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import renderer from "vite-plugin-electron-renderer";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [
    electron({
      main: {
        entry: "src/main/index.ts",
        vite: {
          build: {
            outDir: "dist-electron/main",
          },
        },
      },
    }),
    renderer(),
  ],
});
