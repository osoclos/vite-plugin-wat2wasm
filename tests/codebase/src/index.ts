import initAdd from "./add.wat";

const addModule = await initAdd<{ add(a: number, b: number): number; }>();
console.log(addModule.add(2, 3));
