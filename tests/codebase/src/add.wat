(module
    ;; func add(a: i32, b: i32) -> i32:
    (func $add (param $a i32) (param $b i32) (result i32)
        ;; return a + b
        (i32.add (local.get $a) (local.get $b))
    )

    ;; export add
    (export "add" (func $add))
)
