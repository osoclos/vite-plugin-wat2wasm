# vite-plugin-wat2wasm

A simple Vite plugin that enables `.wat` (WebAssembly Text Format) compilation and allows usage of WebAssembly within your codebase/library.

## Installation

``` bash
$ <your-preferred-package-manager> install -D vite-plugin-wat2wasm
```

## Usage

### Adding into your Vite configuration

``` ts
import { defineConfig } from "vite";
import wat2WasmPlugin from "vite-plugin-wat2wasm";

export default defineConfig({
    plugins: [
        wat2WasmPlugin({ /* Refer to the API docs below for options */ }),
        /* ...other plugins */
    ],

    // ... other configuration settings
});
```

### Adding types for import statements

Reference it as a comment...

``` ts
/// <reference types="vite-plugin-wat2wasm/types" />
```

or include it in your `tsconfig.json` file

``` json
{
    "include": ["src"],
    "compilerOptions": {
        "types": ["vite-plugin-wat2wasm/types", /* ... other type files/packages */]
        // ... other options for Typescript
    }
}
```

If you wish to use the `compileOptions` parameter supported on later browser versions by native WebAssembly instantiation functions, you can use `"vite-plugin-wat2wasm/types-next"` instead of `"vite-plugin-wat2wasm/types"` for your types.

### Using it in your application/library

``` ts
import initFoo from "./foo.wat";

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

### `wat2WasmPlugin`

Enables compilation of `.wat` files and generation of WebAssembly, with modifiable settings.

`wat2WasmPlugin(options:` [`Wat2WasmOptions`](#wat2wasmoptions)`):`[`Plugin`](<https://vite.dev/guide/api-plugin>)

#### Parameters

- `options:` [`Wat2WasmOptions`](#wat2wasmoptions) `= {}` - the configuration options for `vite-plugin-wat2wasm`.

#### Returns

- [`Plugin`](https://vite.dev/guide/api-plugin) - a Vite plugin object that allows for compilation of `.wat` files.

### `Wat2WasmOptions`

The configuration settings for `vite-plugin-wat2wasm`.

#### Properties

- `inlineAssemblies?:` `boolean` `= false` - Whether to inline generated WebAssembly output within JavaScript files when transforming `.wat` files.

- `parser?:` [`WasmParserOptions`](#wasmparseroptions) `= {}` - Configures WebAssembly features you wish to enable for `vite-plugin-wat2wasm`.
- `generator?:` [`WasmGeneratorOptions`](#wasmgeneratoroptions) `= {}` - Configures how `vite-plugin-wat2wasm` to generate WebAssembly output.

- `enableCompileOptions?`: [`EnableCompileOptionsValue`](#enablecompileoptionsvalue) - Determine whether the `compileOptions` parameter will be used when instantiating WebAssembly modules and how will it be resolved if there is no support.

- `fetchTargets?:` [`FetchTarget`](#fetchtarget) `|` [`FetchTarget`](#fetchtarget)`[]` `= ["browser" | "node"]` - Determines the runtimes that can be targeted when the WebAssembly modules are fetched. Does not affect anything if `inlineAssemblies` is set to `true`.

### `WasmParserOptions`

See [`wabt.WasmFeatures`](https://github.com/AssemblyScript/wabt.js/blob/main/README.md) for more info.

### `WasmGeneratorOptions`

See [`wabt.ToBinaryOptions`](https://github.com/AssemblyScript/wabt.js/blob/main/README.md) for more info.

### `EnableCompileOptionsValue`

The values supported by the `enableCompileOptions` setting in the plugin configuration object.

- `boolean` - Force to enable or disable the `compileOptions` parameter.

- `"auto"` - Automatically use the `compileOptions` parameter if it is supported and provided, else it warns the user and instanatiates WebAssembly modules without it.
- `"polyfill"` - Polyfills features based on the `compileOptions` argument if it is not supported natively.

### `FetchTarget`

The runtimes supported as targets when fetching WebAssembly modules.

- `"browser"` - Enable support for browser-based runtimes.
- `"node"` - Enable support for Node-based runtimes.
