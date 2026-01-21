# vite-plugin-wat2wasm

Enable `.wat` compilation and integrate generated WebAssembly modules into your codebase with type support

## Installation

``` bash
$ <your-preferred-package-manager> install -D vite-plugin-wat2wasm
```

## Usage

### Adding into your Vite configuration

``` ts
import { defineConfig } from "vite";
import watVitePlugin from "vite-plugin-wat2wasm";

export default defineConfig({
    plugins: [
        watVitePlugins({ /* Refer to the API docs below for options */ }),
        /* ...other plugins */
    ],

    // ... other configuration settings
});
```

### Adding types for import statements

Reference it as a comment...

``` ts
/// <reference types="vite-plugin-wat2wasm/module-types" />
```

or include it in your `tsconfig.json` file

``` json
{
    "include": ["src"],
    "compilerOptions": {
        "types": ["vite-plugin-wat2wasm/module-types", /* ... other type files/packages */]
        // ... other options for Typescript
    }
}
```

### Using it in your application/library

``` ts
import initFoo from "./foo.wat"

const bar = new WebAssembly.Global("i32", { value: 13 });
const foo = await initFoo<FooExports, FooImports>({
    bar: { val: bar },

    console: {
        log(a: number) {
            console.log(a);
        }
    }
});

console.log(foo.add(21, 46)); // returns 67
foo.logBar(); // logs 13

// In Typescript, you can also specify the types of your .wat file module.
interface FooExports {
    add(a: number, b: number): number;
    logBar(): void;
}

interface FooImports {
    bar: { val: WebAssembly.Global<"i32">; };
    console: { log(a: number): void; };
}
```

## Reference

This section contains more in-depth details about the `vite-plugin-wat2wasm` library and how to make use of what `vite-plugin-wat2wasm` offers.

### `watVitePlugin`

Enables compilation of `.wat` files and generation of `.wasm`, with modifiable settings.

`watVitePlugin(options:` [`Wat2WasmOptions`](#wat2wasmoptions)`):`[`Plugin`](<https://vite.dev/guide/api-plugin>)

#### Parameters

- `options:` [`Wat2WasmOptions`](#wat2wasmoptions) `= {}` - the configuration options for `vite-plugin-wat2wasm`.

#### Returns

- [`Plugin`](https://vite.dev/guide/api-plugin) - a Vite plugin object that allows for compilation of `.wat` files.

### `Wat2WasmOptions`

The configuration settings for `vite-plugin-wat2wasm`.

#### Properties

- `emitWasm?: boolean = true` - Determines whether `.wasm` files will be outputted after compiling `.wat` files during build. Useful if you want other bundlers/compilers to take over generation of `.wasm` files.

- `target?: "all" |` [`WasmTarget`](#wasmtarget) `| WasmTarget[] = "all"` - Selects the targets that can use the `.wat` modules. "all" means that all targets available in [`WasmTarget`](#wasmtarget) can use said modules.

- `parser?:` [`WasmParserOptions`](#wasmparseroptions) `= {}` -
Configures `.wasm` features you wish to enable for `vite-plugin-wat2wasm`.

- `generator?:` [`WasmGeneratorOptions`](#wasmgeneratoroptions) `= {}` - Configures how `vite-plugin-wat2wasm` to generate `.wasm` files.

### `WasmTarget`

The available targets that is supported by `vite-plugin-wat2wasm`.

#### Values

`"browser"` - Browsers and runtimes that include DOM libraries can use the bundled `.wat` modules.

`"node"` - Node.js and runtimes that include the node library can use the bundled `.wat` modules.

### `WasmParserOptions`

See [`wabt.WasmFeatures`](https://github.com/AssemblyScript/wabt.js/blob/main/README.md) for more info.

### `WasmGeneratorOptions`

See [`wabt.ToBinaryOptions`](https://github.com/AssemblyScript/wabt.js/blob/main/README.md) for more info.
