import path from "path";

import type { Plugin } from "vite";
import initWabt from "wabt";

const wabt = await initWabt();

type WabtParserFunc = Awaited<ReturnType<typeof initWabt>>["parseWat"];

/** See @see {@link https://github.com/AssemblyScript/wabt.js/blob/main/README.md|`wabt.WasmFeatures`} for more info. @see WasmParserOptions */
type WasmParserOptions = Parameters<WabtParserFunc>[2];

/** See @see {@link https://github.com/AssemblyScript/wabt.js/blob/main/README.md|`wabt.ToBinaryOptions`} for more info. @see WasmGeneratorOptions */
type WasmGeneratorOptions = Parameters<ReturnType<WabtParserFunc>["toBinary"]>[0];

/** The configuration settings for `vite-plugin-wat2wasm`. @see Wat2WasmOptions */
interface Wat2WasmOptions {
    /** Whether to inline generated WebAssembly output within JavaScript files when transforming `.wat` files. */
    inlineAssemblies?: boolean;

    /** Configures WebAssembly features you wish to enable for `vite-plugin-wat2wasm`. @default {} @see {@link WasmParserOptions|`WasmParserOptions`} */
    parser?: WasmParserOptions;

    /** Configures how `vite-plugin-wat2wasm` to generate WebAssembly output. @default {} @see {@link WasmGeneratorOptions|`WasmGeneratorOptions`} */
    generator?: WasmGeneratorOptions;
}

/** Enables compilation of `.wat` files and generation of WebAssembly, with modifiable settings.
 *
 * @param options - the configuration options for `vite-plugin-wat2wasm`. @see {@link Wat2WasmOptions|`Wat2WasmOptions`}
 * @returns a Vite plugin object that allows for compilation of `.wat` files. @see {@link https://vite.dev/guide/api-plugin|`Plugin`}
 */
const wat2WasmPlugin = (options: Wat2WasmOptions = {}): Plugin => {
    const {
        inlineAssemblies = false,

        parser: parserOptions = {},
        generator: generatorOptions = {},
    } = options;

    let root: string;
    let isServing: boolean;

    const filesToEmit: Record<string, Uint8Array> = {};

    const transformWasm = (bfr: Uint8Array, filename: string) => inlineAssemblies || isServing
        ?
        `
        export default async (imports = {}) => {
            const data = atob("${btoa(String.fromCharCode(...bfr))}");

            const len = data.length;

            const bfr = new Uint8Array(len);
            for (let i = 0; i < len; i++) bfr[i] = data.charCodeAt(i);

            return WebAssembly.instantiate(bfr).then((src) => src.instance.exports);
        };
        `
        :
        `
        export default (imports = {}) => WebAssembly.instantiateStreaming(fetch(new URL("${filename}", import.meta.url))).then((src) => src.instance.exports);
        `;

    return {
        name: "wat2wasm",
        enforce: "pre",

        transform(code: string, pathId: string) {
            if (!pathId.endsWith(".wat")) return null;

            pathId = pathId.replaceAll("\\", "/");

            const pathRel = path.relative(root, pathId);
            const basename = path.basename(pathId, ".wat");

            const module = wabt.parseWat(basename + ".wat", code, parserOptions);

            const output = module.toBinary(generatorOptions);
            if (generatorOptions.log) console.log("\x1b[1;35m[plugin-wat2wasm]\x1b[0;39m \x1b[36mLog Output\x1b[39m - \x1b[92m" + pathRel + "\n" + "\x1b[39m" + output.log);

            const bfr = output.buffer;

            filesToEmit[pathId] = bfr;

            return transformWasm(bfr, basename + ".wasm");
        },

        generateBundle(_options, bundles) {
            if (inlineAssemblies) return;

            for (let [pathBundle, bundle] of Object.entries(bundles)) {
                if (bundle.type === "asset") continue;

                pathBundle = pathBundle.replaceAll("\\", "/");

                const pathParent = path.join(pathBundle, "../");

                const modules = bundle.moduleIds;
                for (let pathModule of modules) {
                    pathModule = pathModule.replaceAll("\\", "/");
                    if (!(pathModule in filesToEmit)) continue;

                    const filename = path.basename(pathModule, ".wat") + ".wasm";
                    const pathEmittedFile = path.join(pathParent, filename);

                    const bfr = filesToEmit[pathModule]!;

                    this.emitFile({
                        type: "asset",

                        source: bfr,
                        fileName: pathEmittedFile
                    });
                }
            }
        },

        configResolved(config) {
            root = config.root.replaceAll("\\", "/");
            isServing = config.command === "serve";
        }
    };
};

export default wat2WasmPlugin;
export type { Wat2WasmOptions, WasmParserOptions, WasmGeneratorOptions };
