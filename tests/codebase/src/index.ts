import initAdd from "./add.wat";

const add = await initAdd<{ add(a: number, b: number): number; }>().then((module) => module.add);

const updateDifference = () => {
    const a = parseInt(inA.value);
    const b = parseInt(inB.value);

    const c = add(a, b);

    out.textContent = `${c}`;
    console.log(`${a} + ${b} = ${c}`);
};

inA.value = `${Math.round(Math.random() * 100)}`;
inB.value = `${Math.round(Math.random() * 100)}`;

updateDifference();

inA.addEventListener("input", () => void updateDifference());
inB.addEventListener("input", () => void updateDifference());

declare const inA: HTMLInputElement;
declare const inB: HTMLInputElement;

declare const out: HTMLParagraphElement;
