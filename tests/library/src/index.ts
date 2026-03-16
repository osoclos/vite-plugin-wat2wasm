import initSub from "./sub.wat";

export async function createSubFunc(): Promise<(a: number, b: number) => number> {
    const subModule = await initSub<{ sub(a: number, b: number): number; }>();
    return subModule.sub;
}
