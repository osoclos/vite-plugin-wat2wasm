import fs from "fs";
import path from "path";

const MODULE_TYPES_FILENAME: string = "modules.d.ts";

const MODULE_TYPES_SRC_DIR: string = "src" ;
const MODULE_TYPES_DST_DIR: string = "dist";

fs.copyFileSync(path.join(MODULE_TYPES_SRC_DIR, MODULE_TYPES_FILENAME), path.join(MODULE_TYPES_DST_DIR, MODULE_TYPES_FILENAME));
