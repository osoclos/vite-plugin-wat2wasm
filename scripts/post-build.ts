import fs from "fs";
import path from "path";

const pathIn  = path.join(__dirname, "../src/types.d.ts");
const pathOut = path.join(__dirname, "../dist", path.basename(pathIn));

fs.writeFileSync(pathOut, fs.readFileSync(pathIn));
