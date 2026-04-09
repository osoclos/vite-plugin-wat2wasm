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
        parser: parserOptions = {},
        generator: generatorOptions = {},
    } = options;

    let root: string;

    return {
        name: "wat2wasm",

        configResolved(config) {
            root = config.root;
        },

        transform(code: string, pathId: string) {
            if (!pathId.endsWith(".wat")) return null;

            const pathRel = path.relative(root, pathId).replaceAll("\\", "/");
            const filename = path.basename(pathId);

            const module = wabt.parseWat(filename, code, parserOptions);

            const wasmWrapper = module.toBinary(generatorOptions);
            if (generatorOptions.log) console.log("\x1b[1;35m[plugin-wat2wasm]\x1b[0;39m \x1b[36mLog Output\x1b[39m - \x1b[92m" + pathRel + "\n" + "\x1b[39m" + wasmWrapper.log);

            const bfr = wasmWrapper.buffer;

            return `export default async (imports = {}) => WebAssembly.instantiate(Uint8Array.from(atob("${btoa(String.fromCharCode(...bfr))}"), (char) => char.charCodeAt(0)), imports).then(({ instance: { exports } }) => exports);`;
        }
    };
};

export default wat2WasmPlugin;
export type { Wat2WasmOptions, WasmParserOptions, WasmGeneratorOptions };
