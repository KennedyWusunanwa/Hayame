import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function getSocialPreviewLogoSrc() {
  const logoBuffer = await readFile(join(process.cwd(), "public", "logo.png"));
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}
