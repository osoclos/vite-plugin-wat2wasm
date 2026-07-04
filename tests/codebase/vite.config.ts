import { defineConfig } from "vite";
import wat2WasmPlugin from "../../dist/index.js";

export default defineConfig({
    root: __dirname,
    plugins: [wat2WasmPlugin({ enableCompileOptions: true })]
});
