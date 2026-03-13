(module
    (func $add (param i32 i32) (result i32)
        local.get 0
        local.get 1

        i32.add
    )

    (func (export "sum3Nums") (param i32 i32 i32) (result i32)
        local.get 0
        local.get 1

        call $add
        local.get 2

        call $add
    )
)
