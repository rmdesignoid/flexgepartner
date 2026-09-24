import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourcePath = resolve(root, "registry/registry.json");
const outputDir = resolve(root, "public/r");
const registry = JSON.parse(await readFile(sourcePath, "utf8"));

await mkdir(outputDir, { recursive: true });
for (const item of registry.items ?? []) {
  const files = await Promise.all((item.files ?? []).map(async (file) => ({
    ...file,
    content: await readFile(resolve(root, file.path), "utf8"),
  })));
  await writeFile(resolve(outputDir, `${item.name}.json`), `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry-item.json", ...item, files }, null, 2)}\n`, "utf8");
}

const catalog = { ...registry, items: (registry.items ?? []).map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== "files"))) };
await writeFile(resolve(outputDir, "registry.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Registry gerado: ${registry.items?.length ?? 0} item(s) em public/r.`);
