import { defineConfig } from "vite";
import watCompilerPlugin from "../../src";

export default defineConfig({
    root: __dirname,
    plugins: [watCompilerPlugin({
        emitWasm: true,
        target: "browser"
    })]
});
