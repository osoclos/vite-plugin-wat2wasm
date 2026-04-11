declare module "*.wat" {
    // @ts-ignore
    type ModuleObject = Record<string, any>;

    export default function init<T extends ModuleObject = ModuleObject                             >(                                                                  ): Promise<T>;
    export default function init<T extends ModuleObject = ModuleObject, I extends ModuleObject = {}>(imports: I, compileOptions?: WebAssembly.WebAssemblyCompileOptions): Promise<T>;
}
