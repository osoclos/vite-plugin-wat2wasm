import path from "path";
import crypto from "crypto";

import type { Plugin } from "vite";

import initWabt from "wabt";

import "./types.d.ts";

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

    /** Determine whether the `compileOptions` parameter will be used when instantiating WebAssembly modules and how will it be resolved if there is no support. */
    enableCompileOptions?: EnableCompileOptionsValue;

    /** Determines the runtimes that can be targeted when the WebAssembly modules are fetched. Does not affect anything if `inlineAssemblies` is set to `true`. */
    fetchTargets?: FetchTarget | FetchTarget[];
}

/** The values supported by the `enableCompileOptions` setting in the plugin configuration object. */
type EnableCompileOptionsValue = boolean | "auto" | "polyfill";

/** The runtimes supported as targets when fetching WebAssembly modules. */
type FetchTarget = "browser" | "node";

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

        enableCompileOptions = "auto",

        fetchTargets = ["browser", "node"]
    } = options;

    const PLUGIN_ID: string = "wat2wasm";

    const FETCH_WASM_ID   = PLUGIN_ID + ":" + crypto.randomBytes(4).toString("hex");
    const GENERATE_NEXT_ARGS_ID   = PLUGIN_ID + ":" + crypto.randomBytes(4).toString("hex");

    let root: string;

    let isServing: boolean;

    const targetsBrowser = fetchTargets.includes("browser");
    const targetsNode    = fetchTargets.includes("node"   );

    const filesToEmit: Record<string, Uint8Array> = {};

    const fetchWasmFunc =
        `import { generateNextArguments } from "${GENERATE_NEXT_ARGS_ID}";` + "\n" +
        `` + "\n" +
        `export async function fetchWasm(filename, parentPath, imports, compileOptions) {` + "\n" +
        (targetsBrowser ? `    if (typeof window !== "undefined" && typeof document !== "undefined") return WebAssembly.instantiateStreaming(fetch(new URL(filename, parentPath)), ...await generateNextArguments(imports, compileOptions));` : "") + "\n" +
        (targetsNode    ? `    if (typeof process !== "undefined" && "versions" in process && "node" in process.versions) return WebAssembly.instantiate(await (await import("fs/promises").then(({ readFile }) => readFile))(filename), ...await generateNextArguments(imports, compileOptions));` : "") + "\n" +
                                                                                                                                                                                                                                                            "\n" +
                          `    throw new Error("The runtime used to import this WebAssembly module is not supported. If this is a mistake, adjust your fetchTargets to fit the specific runtime.");` + "\n" +
        `}` + "\n";

    const generateNextArgumentsFunc =
        `export async function generateNextArguments(imports, compileOptions) {`   + "\n" +
        `    if (typeof compileOptions !== "object" || compileOptions === null) return [imports];` + "\n" +
        (
            typeof enableCompileOptions === "boolean"
                ? enableCompileOptions
                    ? `    return [imports, compileOptions];`
                    : `    return [imports];`
                :
                    `` + "\n" +
                    `    const supportsCompileOptions = await (async () => {` + "\n" +
                    `        try {`                                                             + "\n" +
                    `            await WebAssembly.compile(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]), { builtins: [], importedStringConstants: null });` + "\n" +
                    `            return true;` + "\n" +
                    `        } catch {` + "\n" +
                    `            return false;` + "\n" +
                    `        }` + "\n" +
                    `    })();` + "\n" +
                    `` + "\n" +
                    `    if (supportsCompileOptions) return [imports, compileOptions];` + "\n" +
                    `` + "\n" +
                    (
                        enableCompileOptions === "auto"
                        ?
                            `    console.warn("This runtime does not support compileOptions for WebAssembly instantiation. If this is a mistake, make sure that the enableCompileOptions setting has been set appropriately in your configuration.");`
                        :
                            `    if ("builtins" in compileOptions) {` + "\n" +
                            `        const builtins = compileOptions.builtins;` + "\n" +
                            `` + "\n" +
                            `        if (builtins.includes("js-string")) {` + "\n" +
                            `            const jsString = {` + "\n" +
                            `                cast(obj) {` + "\n" +
                            `                    if (obj === null || typeof obj !== "string") throw WebAssembly.RuntimeError("externref obj passed into wasm:js-string.cast is not castable as a string.");` + "\n" +
                            `                    return obj;` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                compare($a, $b) {` + "\n" +
                            `                    const a = this.cast($a);` + "\n" +
                            `                    const b = this.cast($b);` + "\n" +
                            `` + "\n" +
                            `                    if (a === b) return 0;` + "\n" +
                            `                    return a < b ? -1 : 1;` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                concat($a, $b) {` + "\n" +
                            `                    const a = this.cast($a);` + "\n" +
                            `                    const b = this.cast($b);` + "\n" +
                            `` + "\n" +
                            `                    return a.concat(b);` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                charCodeAt($str, i) {` + "\n" +
                            `                    const str = this.cast($str);` + "\n" +
                            `                    return str.charCodeAt(i >>> 0);` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                codePointAt($str, i) {` + "\n" +
                            `                    const str = this.cast($str);` + "\n" +
                            `` + "\n" +
                            `                    i >>>= 0;` + "\n" +
                            `                    if (i > str.length) throw new WebAssembly.RuntimeError("index exceeds passed string length.");` + "\n" +
                            `` + "\n" +
                            `                    return str.codePointAt(i);` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                equals(a, b) {` + "\n" +
                            `                    if (` + "\n" +
                            `                        (a !== null && typeof a !== "string") ||` + "\n" +
                            `                        (b !== null && typeof b !== "string")`    + "\n" +
                            `                    ) throw new WebAssembly.RuntimeError("externref obj is not a string or a null reference.");` + "\n" +
                            `` + "\n" +
                            `                    return a === b ? 1 : 0;` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                fromCharCode(code) {` + "\n" +
                            `                    return String.fromCharCode(code >>> 0);` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                fromCodePoint(point) {` + "\n" +
                            `                    point >>>= 0;` + "\n" +
                            `                    if (point > 0x0010_ffff) throw new WebAssembly.RuntimeError("passed code point is not a valid Unicode code point.");` + "\n" +
                            `` + "\n" +
                            `                    return String.fromCodePoint(point);` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                length($str) {` + "\n" +
                            `                    const str = this.cast($str);` + "\n" +
                            `                    return str.length;` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                substring($str, iStart, iEnd) {` + "\n" +
                            `                    const str = this.cast($str);` + "\n" +
                            `` + "\n" +
                            `                    iStart >>>= 0;` + "\n" +
                            `                    iEnd   >>>= 0;` + "\n" +
                            `` + "\n" +
                            `                    if (iStart > iEnd || iStart > str.length) return "";` + "\n" +
                            `                    return str.substring(iStart, iEnd);` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                test(obj) {` + "\n" +
                            `                    return typeof obj === "string" ? 1 : 0;` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                fromCharCodeArray(_arr, _iStart, _iEnd) {` + "\n" +
                            `                    throw new WebAssembly.RuntimeError("wasm:js-string.fromCharCodeArray cannot be polyfilled as it requires WASM GC arrays, which cannot be accessed or mutated in JavaScript. It is recommended that you implement the function yourself using wasm:js-string.fromCharCode instead.");` + "\n" +
                            `                },` + "\n" +
                            `` + "\n" +
                            `                intoCharCodeArray(_str, _arr, _iStart) {` + "\n" +
                            `                    throw new WebAssembly.RuntimeError("wasm:js-string.intoCharCodeArray cannot be polyfilled as it requires WASM GC arrays, which cannot be accessed or mutated in JavaScript. It is recommended that you implement the function yourself using wasm:js-string.charCodeAt instead.");` + "\n" +
                            `                }` + "\n" +
                            `            };` + "\n" +
                            `` + "\n" +
                            `            imports = { ...imports, ["wasm:js-string"]: jsString };` + "\n" +
                            `        }` + "\n" +
                            `    }` + "\n" +
                            `` + "\n" +
                            `    if ("importedStringConstants" in compileOptions) {` + "\n" +
                            `        const strModuleName = compileOptions.importedStringConstants;` + "\n" +
                            `` + "\n" +
                            `        const wasmModule = await WebAssembly.compile(bfr);` + "\n" +
                            `        const importDescriptors = WebAssembly.Module.imports(wasmModule);` + "\n" +
                            `` + "\n" +
                            `        const strModule = {};` + "\n" +
                            `` + "\n" +
                            `        const strConstants = importDescriptors.filter((desc) => desc.module === strModuleName && desc.kind === "global").map((desc) => desc.name);` + "\n" +
                            `        for (const str of strConstants) strModule[str] = str;` + "\n" +
                            `` + "\n" +
                            `        imports = { ...imports, [strModuleName]: strModule };` + "\n" +
                            `    }`
                    ) + "\n" +
                    `` + "\n" +
                    `    return [imports];`
            ) + "\n" +
        `}` + "\n";

    const transformWasm = (bfr: Uint8Array, filename: string) => inlineAssemblies || isServing
        ?
        `
        import { generateNextArguments } from "${GENERATE_NEXT_ARGS_ID}";

        export default async (imports = {}, compileOptions = null) => {
            const data = atob("${btoa(String.fromCharCode(...bfr))}");

            const len = data.length;

            const bfr = new Uint8Array(len);
            for (let i = 0; i < len; i++) bfr[i] = data.charCodeAt(i);

            return WebAssembly.instantiate(bfr, ... await generateNextArguments(imports, compileOptions)).then((src) => src.instance.exports);
        };
        `
        :
        `
        import { fetchWasm } from "${FETCH_WASM_ID}";
        export default (imports = {}, compileOptions = null) => fetchWasm("${filename.startsWith(".") ? filename : "./" + filename}", import.meta.url, imports, compileOptions).then((src) => src.instance.exports);
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

        buildStart() {
            if ("data" in this) {
                const data = this.data as any;

                root = (data.outputOptions.preserveModules ? data.outputOptions.preserveModulesRoot : path.join(data.outputOptions.dir, "../")).replaceAll("\\", "/");
                isServing = false;
            }
        },

        resolveId(id: string) {
            if (id === FETCH_WASM_ID) return "\0" + FETCH_WASM_ID;
            if (id === GENERATE_NEXT_ARGS_ID) return "\0" + GENERATE_NEXT_ARGS_ID;

            return null;
        },

        load(id: string) {
            if (!id.startsWith("\0")) return null;

            if (id.endsWith(FETCH_WASM_ID)) return fetchWasmFunc;
            if (id.endsWith(GENERATE_NEXT_ARGS_ID)) return generateNextArgumentsFunc;

            return null;
        },

        configResolved(config) {
            root = config.root.replaceAll("\\", "/");
            isServing = config.command === "serve";
        }
    };
};

export default wat2WasmPlugin;
export type { Wat2WasmOptions, WasmParserOptions, WasmGeneratorOptions, FetchTarget };
