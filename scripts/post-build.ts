import fs from "fs";
import path from "path";

copyFile(path.join(__dirname, "../src/types.d.ts"), path.join(__dirname, "../dist/types.d.ts"));
copyFile(path.join(__dirname, "../src/types-next.d.ts"), path.join(__dirname, "../dist/types-next.d.ts"));

function copyFile(pathIn: string, pathOut: string) {
    fs.writeFileSync(pathOut, fs.readFileSync(pathIn));
}
