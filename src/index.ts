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
    /** Configures `.wasm` features you wish to enable for `vite-plugin-wat2wasm`. @default {} @see {@link WasmParserOptions|`WasmParserOptions`} */
    parser?: WasmParserOptions;

    /** Configures how `vite-plugin-wat2wasm` to generate `.wasm` files. @default {} @see {@link WasmGeneratorOptions|`WasmGeneratorOptions`} */
    generator?: WasmGeneratorOptions;
}

const wat2WasmPlugin = (options: Wat2WasmOptions = {}): Plugin => {
    const {
        parser: parserOptions = {},
        generator: generatorOptions = {},
    } = options;

    return {
        name: "wat2wasm",

        transform(code: string, id: string) {
            if (!id.endsWith(".wat")) return null;

            const module = wabt.parseWat(id, code, parserOptions);

            const wasmWrapper = module.toBinary(generatorOptions);
            if (generatorOptions.log) console.log(id + "\n", wasmWrapper.log);

            const bfr = wasmWrapper.buffer;

            return `export default async (imports = {}) => WebAssembly.instantiate(Uint8Array.from(atob("${btoa(String.fromCharCode(...bfr))}"), (char) => char.charCodeAt(0)), imports).then(({ instance: { exports } }) => exports);`;
        }
    };
};

export default wat2WasmPlugin;
