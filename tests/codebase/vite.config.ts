import { defineConfig } from "vite";
import wat2WasmPlugin from "../../src";

export default defineConfig({
    root: __dirname,
    plugins: [wat2WasmPlugin()]
});
