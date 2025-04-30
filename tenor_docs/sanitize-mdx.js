import fs from "fs";
import path from "path";

const dir = "./docs/api";
const files = fs.readdirSync(dir);

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Convert HTML-style comments to MDX-safe comments
  content = content.replace(/<!--(.*?)-->/gs, "{/*$1*/}");

  // (Optional) remove images that use ![]()
  content = content.replace(/!\[.*?\]\(.*?\)/g, "");

  fs.writeFileSync(filePath, content);
}
