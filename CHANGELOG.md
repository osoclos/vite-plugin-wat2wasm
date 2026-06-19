# Changelog

This file details the changes that happen in `vite-plugin-wat2wasm`.

## v2.2.1 (19/06/26 - 11:33pm|UTC+8)

- Fixes

- - Changed wabt dependency to a peer dependency.

## v2.2.0 (12/04/26 - 12:16pm|UTC+8)

- Additions

- - Added the ability to use the `compileOptions` parameter from native WebAssembly instantiation functions in runtimes that support them, with the option to resolve them using `enableCompileOptions` configuration setting if it is not supported otherwise.

- Fixes

- - Re-introduced usage of import objects in WebAssembly modules where they are inlined within JavaScript files.

## v2.1.2 (10/04/26 - 3:48pm|UTC+8)

- Fixes

- - Fixed path resolutions where it is treated as a package path instead of as a relative path in some situations.

## v2.1.1 (10/04/26 - 3:35pm|UTC+8)

- Additions

- - Added the ability to load WebAssembly modules using Node.js' `fs.readFile` function for node-based runtimes.

- - Allowed developers to target specific runtimes for fetching WebAssembly modules using `fetchTargets`.

- Fixes

- - Re-introduced usage of import objects in WebAssembly modules.

## v2.1.0 (10/04/26 - 1:37am|UTC+8)

- Additions

- - Added the ability to inline or separate Webassembly output using `options.inlineAssemblies`.

- Changes

- - Generating separate `.wasm` files is now the default; inlining them now requires the `inlineAssemblies` in the options object to be explicitly set to true.

- - Improved debug logging of `.wat` file compilation, with a neater format for indicating the start and end of logs.

## v2.0.0 (16/03/26 - 5:07pm|UTC+8)

- Additions

- - Improved the compilation of `.wat` files, with an option to display logs.

- - Enabled inlining of `.wasm` buffers within instantiating functions and generation of `.js` files for initialising the WebAssembly modules.

- Removals

- - Removed the options (`emitWasm`, `target`, `relDir`) responsible for emitting `.wasm` files due to technical complications and little demand.

## v1.2.7 (15/03/26 - 11:58pm|UTC+8)

- Additions

- - Added an option to redirect generated `.wasm` files when `emitWasm` is enabled.

## v1.2.6 (13/03/26 - 10:15pm|UTC+8)

- Fixes

- - Re-added `module-types` types file.

## v1.2.5 (13/03/26 - 10:09pm|UTC+8)

- Fixes

- - Fixed an error regarding WebAssembly error handling.

## v1.2.4 (13/03/26 - 10:05pm|UTC+8)

- Fixes

- - Fixed an error regarding WebAssembly error handling.

## v1.2.3 (13/03/26 - 9:59pm|UTC+8)

- Fixes

- - Threw more readable and better-handled errors for some errors when instantiating WebAssembly files.

## v1.2.2 (13/03/26 - 6:30pm|UTC+8)

- Fixes

- - Fixed configurations whereby there is no valid environment to choose.

## v1.2.1 (13/03/26 - 4:28pm|UTC+8)

- Fixes

- - Emitted files now follow its relative location from the root given by Vite when building.

## v1.2.0 (25/01/26 - 12:54am|UTC+8)

- Additions

- - Added error logging when `.wat` file compilation fails.

## v1.1.2 (22/01/26 - 9:44pm|UTC+8)

- Fixes

- - Made compilation of `.wat` files during dev-mode more reliable.

## v1.1.1 (22/01/26 - 3:58pm|UTC+8)

- Fixes

- - Fixed certain characters not decoded correctly when compiling `.wat` files during dev-mode.

## v1.1.0 (20/01/26 - 9:47pm|UTC+8)

- Additions

- - Added specification for different runtime targets.
- - Provide the ability to emit `.js` files instead of `.wasm` files during build-mode.

## v1.0.0 (20/01/26 - 10:38am|UTC+8)

- Additions

- - Created and published `vite-plugin-wat2wasm`!
