# Changelog

This file details the changes that happen in `vite-plugin-wat2wasm`.

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
