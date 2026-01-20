import fs from "fs";
import path from "path";

import crypto from "crypto";

import type { Plugin } from "vite";
import type { TransformPluginContext } from "rolldown";

import initWabt from "wabt";

const IMPORT_DEFAULT_REG = /(^|\s)import\s+([A-Za-z_$][\w$]*)\s+from\s*['"]([^'"\n]*\.wat)['"](\s*;|$)/m;
const IMPORT_STAR_REG    = /(^|\s)import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s*['"]([^'"\n]*\.wat)[;"](\s*;|$)/m;

const JS_FILE_EXT_REG = /\.([mc]?[jt]sx?)$/i;

const wabt = await initWabt();

type WabtParserFunc = Awaited<ReturnType<typeof initWabt>>["parseWat"];

/** See @see {@link https://github.com/AssemblyScript/wabt.js/blob/main/README.md|`wabt.WasmFeatures`} for more info. @see WasmParserOptions */
type WasmParserOptions = Parameters<WabtParserFunc>[2];

/** See @see {@link https://github.com/AssemblyScript/wabt.js/blob/main/README.md|`wabt.ToBinaryOptions`} for more info. @see WasmGeneratorOptions */
type WasmGeneratorOptions = Parameters<ReturnType<WabtParserFunc>["toBinary"]>[0];

const WASM_TARGETS = ["browser", "node"] as const;

/** The available targets that is supported by `vite-plugin-wat2wasm`. @see WasmTarget */
type WasmTarget = typeof WASM_TARGETS[number];

/** The configuration settings for `vite-plugin-wat2wasm`. @see Wat2WasmOptions */
interface Wat2WasmOptions {
    /** Determines whether `.wasm` files will be outputted after compiling `.wat` files. Useful if you want other bundlers/compilers to take over generation of `.wasm` files. @default true */
    emitWasm?: boolean;

    /** Selects the targets that can use the `.wat` modules. "all" means that all targets available in @see {@link WasmTarget|`WasmTarget`} can use said modules. @default "all" */
    target?: "all" | WasmTarget | WasmTarget[];

    /** Configures `.wasm` features you wish to enable for `vite-plugin-wat2wasm`. @default {} @see {@link WasmParserOptions|`WasmParserOptions`} */
    parser?: WasmParserOptions;

    /** Configures how `vite-plugin-wat2wasm` to generate `.wasm` files. @default {} @see {@link WasmGeneratorOptions|`WasmGeneratorOptions`} */
    generator?: WasmGeneratorOptions;
}

/** Enables compilation of `.wat` files and generation of `.wasm`, with modifiable settings.
 *
 * @param options - the configuration options for `vite-plugin-wat2wasm`. @see {@link Wat2WasmOptions|`Wat2WasmOptions`}
 * @returns a Vite plugin object that allows for compilation of `.wat` files. @see {@link https://vite.dev/guide/api-plugin|`Plugin`}
 */
const watCompilerPlugin = (options: Wat2WasmOptions = {}): Plugin => {
    const {
        target: optionsTarget = "all",

        parser: parserOptions = {},
        generator: generatorOptions = {}
    } = options;

    const targets =
        optionsTarget === "all"
            ? WASM_TARGETS as unknown as WasmTarget[] :
        typeof optionsTarget === "string"
            ? [optionsTarget] :
        optionsTarget.length === 0
            ? WASM_TARGETS as unknown as WasmTarget[]
            : optionsTarget;

    const importedWatFiles = new Map<string, Uint8Array>();

    const compileWat = (watPath: string): Uint8Array => {
        const name = path.basename(watPath, ".wat");
        const textBfr = fs.readFileSync(watPath, { encoding: "utf-8" });

        const module = wabt.parseWat(name, textBfr, parserOptions);
        const bfr = module.toBinary(generatorOptions).buffer;

        return bfr;
    };

    const transformImports = async (ctx: TransformPluginContext, code: string, codePath: string, statementReg: RegExp, replacement: (importPath: string, name: string) => string): Promise<string> => {
        for (let match = code.match(statementReg); match !== null; match = code.match(statementReg)) {
            match.index ??= 0;

            const watRelPath = match[3];

            const watAbsPath = (await ctx.resolve(watRelPath, codePath))?.id ?? null;
            if (watAbsPath === null) return code;

            const bfr = compileWat(watAbsPath);

            const hasher = crypto.createHash("sha-256");
            hasher.update(bfr);

            const hash = hasher.digest("base64url").slice(0, 8);

            const watName   = path.basename(watRelPath, ".wat") + "-" + hash;
            const watParent = path.dirname(watRelPath);

            const wasmFilePath = path.posix.join(watParent, watName + ".wasm");
            if (!importedWatFiles.has(wasmFilePath)) importedWatFiles.set(wasmFilePath, bfr);

            const importName = match[2];

            const preSpacing = match[1];
            const postSpacing = match[4];

            const statementStart = match.index ?? 0;
            const statementEnd = statementStart + match[0].length;

            code = code.slice(0, statementStart) + preSpacing + replacement(wasmFilePath, importName) + postSpacing + code.slice(statementEnd);
        }

        return code;
    };

    return {
        name: "wat-compiler",
        enforce: "post",

        async load(id: string) {
            const emitWasm = options.emitWasm ?? ("environment" in this && this.environment.mode === "build");

            if (emitWasm || !id.endsWith(".wat")) return null;

            const bfr = compileWat(id);
            const str = new TextDecoder("utf-8").decode(bfr).replaceAll("`", "\\`").replaceAll("\n", "\\n").replaceAll("\r", "\\r");

            return (
                `const init = async (imports = {}) => WebAssembly.instantiate(new TextEncoder().encode(\`${str}\`), imports).then(({ instance: { exports } }) => exports);` + "\n" +
                "export default init;" + "\n"
            );
        },

        async transform(code: string, id: string) {
            const emitWasm = options.emitWasm ?? ("environment" in this && this.environment.mode === "build");

            if (!emitWasm || !JS_FILE_EXT_REG.test(id)) return null;

            const initWasmFuncName = "__" + crypto.randomBytes(4).toString("hex");
            const generateInitWasmFunc =
                `const ${initWasmFuncName} = (path, imports) => {` + "\n" +
                (targets.includes("node") ?
                "    if (typeof process !== \"undefined\" && \"versions\" in process && \"node\" in process.versions) return WebAssembly.instantiate(require(\"fs\").readFileSync(path), imports);" + "\n" :
                "") +
                (targets.includes("browser") ?
                `    if (typeof window !== "undefined" && typeof document !== "undefined") return WebAssembly.instantiateStreaming(fetch(path), imports);` + "\n" :
                "") +
                "" + "\n" +
                "    throw new Error(\"This JavaScript runtime is not supported by this module. If this is a mistake, adjust your target to fit your specific runtime.\");" + "\n" +
                "};" + "\n";

            const generateInitModuleFunc = (path: string): string => `async (imports) => ${initWasmFuncName}("${path}", imports).then(({ instance: { exports } }) => exports)`;

            const originalCode = code;

            code = await transformImports(this as any, code, id, IMPORT_DEFAULT_REG, (path, name) => `const ${name} = ${generateInitModuleFunc(path)};`);
            code = await transformImports(this as any, code, id, IMPORT_STAR_REG   , (path, name) => `const ${name} = { default: ${generateInitModuleFunc(path)} };`);

            if (code !== originalCode) code = generateInitWasmFunc + code;
            return code;
        },

        buildEnd() {
            for (const [distPath, bfr] of importedWatFiles)
                this.emitFile({
                    type: "asset",

                    fileName: distPath,
                    source: bfr
                });
        }
    };
};

export default watCompilerPlugin;
export type { Wat2WasmOptions, WasmParserOptions, WasmGeneratorOptions, WasmTarget };
