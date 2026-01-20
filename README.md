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
        watVitePlugins(
            { /* ...wasm features to include */ },
            { /* ...wasm generation settings */ }
        ),
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

const bar = new WebAssembly.Global("i32");

const foo = await initFoo<FooExports, FooImports>({
    bar: { val: bar },

    console: {
        log(a: number) {
            console.log(a);
        }
    }
});

console.log(foo.add(21, 46)); // returns 67
foo.logBar();

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
