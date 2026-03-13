(module
    (func (export "abs") (param i32) (result i32)
        local.get 0
        i32.const 0

        i32.lt_s

        (if (result i32)
            (then
                local.get 0
                i32.const -1

                i32.mul
            )
            (else
                local.get 0
            )
        )
    )
)
