(module
    ;; func sub(a: i32, b: i32) -> i32:
    (func $sub (param $a i32) (param $b i32) (result i32)
        ;; return a - b
        (i32.sub (local.get $a) (local.get $b))
    )

    ;; export sub
    (export "sub" (func $sub))
)
