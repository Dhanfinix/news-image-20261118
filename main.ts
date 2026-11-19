import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("./assets/entry.png", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

if (!existsSync(source)) {
  console.error("Missing required asset: " + source);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log("Wrote " + target);
