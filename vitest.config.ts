import { defineConfig } from "vitest/config";
import { preview } from "@vitest/browser-preview";

import watCompilerPlugin from "./src";

export default defineConfig({
    test: {
        browser: {
            enabled: true,

            provider: preview(),
            instances: [{ browser: "chromium" }]
        }
    },

    plugins: [watCompilerPlugin()]
});
