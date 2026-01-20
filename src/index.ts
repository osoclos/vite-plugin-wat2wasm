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

type WasmParserOptions = Parameters<WabtParserFunc>[2];
type WasmGeneratorOptions = Parameters<ReturnType<WabtParserFunc>["toBinary"]>[0];

const watCompilerPlugin = (parserOptions: WasmParserOptions = {}, generatorOptions: WasmGeneratorOptions = {}): Plugin => {
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
            if (watAbsPath === null) continue;

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

        load(id: string) {
            if (!id.endsWith(".wat")) return null;

            const bfr = compileWat(id);
            const str = new TextDecoder("utf-8").decode(bfr).replaceAll("`", "\\`").replaceAll("\n", "\\n").replaceAll("\r", "\\r");

            return (
                "let hasInitialized = false;" + "\n" +
                "" + "\n" +
                "export default async function init(imports = {}) {" + "\n" +
                `    if (hasInitialized) throw new Error("Module at \\"${path.resolve(this.environment.config.base, id)}\\" has already been initialized!");` + "\n" +
                "    hasInitialized = true;" + "\n" +
                "" + "\n" +
                `    return WebAssembly.instantiate(new TextEncoder().encode(\`${str}\`), imports).then(({ instance: { exports } }) => exports);` + "\n" +
                "}" + "\n"
            );
        },

        async transform(code: string, id: string) {
            if (this.environment.mode !== "build" || !JS_FILE_EXT_REG.test(id)) return null;

            code = await transformImports(this as any, code, id, IMPORT_DEFAULT_REG, (path, name) => `const ${name} = async (imports) => WebAssembly.instantiateStreaming(fetch("${path}"), imports).then(({ instance: { exports } }) => exports);`);
            code = await transformImports(this as any, code, id, IMPORT_STAR_REG   , (path, name) => `const ${name} = { default: async (imports) => WebAssembly.instantiateStreaming(fetch("${path}"), imports).then(({ instance: { exports } }) => exports) };`);

            return code;
        },

        generateBundle() {
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
