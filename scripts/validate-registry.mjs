import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile("registry/registry.json", "utf8"));
if (!registry.name || !Array.isArray(registry.items)) throw new Error("registry.json inválido");
for (const item of registry.items) {
  if (!item.name || !item.type || !Array.isArray(item.files) || item.files.length === 0) {
    throw new Error(`Item inválido: ${item.name ?? "sem nome"}`);
  }
  for (const file of item.files) {
    if (!file.path || !file.type) throw new Error(`Arquivo inválido em ${item.name}`);
  }
}
console.log(`Registry válido: ${registry.items.length} item(s).`);
