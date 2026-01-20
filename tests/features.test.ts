import { expect, test } from "vitest";

import initPassAndReturn from "./pass-and-return.wat";

import initMultiFunc     from "./multi-func.wat";
import initControlFlow   from "./control-flow.wat";

import initCountdown     from "./countdown.wat";

const { passAndReturn } = await initPassAndReturn();

const { sum3Nums } = await initMultiFunc();
const { abs } = await initControlFlow();

const { countdown } = await initCountdown({ console });

test("pass and return", () => void expect(passAndReturn(42)).toBe(42));

test("sum 3 numbers"  , () => void expect(sum3Nums(27, 59, 88)).toBe(174));
test("abs number"     , () => void expect(abs(-19)).toBe(19));

test("countdown to 0" , () => void expect(countdown(3)).toBe(0));
