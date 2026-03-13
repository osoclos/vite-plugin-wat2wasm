(module
    (import "console" "log" (func $log (param i32)))

    (func (export "countdown") (param i32) (result i32)
        (local i32)

        local.get 0
        local.set 1

        (block
            (loop
                local.get 1
                call $log

                local.get 1
                i32.const 1

                i32.sub

                local.tee 1
                i32.const 0

                i32.gt_s
                br_if 0
            )
        )

        local.get 1
    )
)
