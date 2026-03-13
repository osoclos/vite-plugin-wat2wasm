import initPassAndReturn from "./pass-and-return.wat";

import initMultiFunc     from "./multi-func.wat";
import initControlFlow   from "./control-flow.wat";

import initCountdown     from "./countdown.wat";

import { initAdd } from "./subfolder";

const { passAndReturn } = await initPassAndReturn();

const { sum3Nums } = await initMultiFunc();
const { abs } = await initControlFlow();

const { countdown } = await initCountdown({ console });

const { add } = await initAdd();

console.log(passAndReturn(42) === 42);

console.log(sum3Nums(27, 59, 88) === 174);
console.log(abs(-19) === 19);

console.log(countdown(3) === 0);

console.log(add(31, 36) === 67);
