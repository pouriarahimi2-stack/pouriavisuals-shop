#!/usr/bin/env node
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
function findRoot(s) { let d=s; for(let i=0;i<8;i++){if(fs.existsSync(path.join(d,"package.json"))&&fs.existsSync(path.join(d,"app")))return d;d=path.dirname(d);}throw new Error("root not found"); }
const root = findRoot(__dirname);

function removeDuplicateProps(filePath, propName) {
  let lines = fs.readFileSync(filePath, "utf8").split("\n");
  const indices = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(propName + ":")) indices.push(i);
  }
  console.log(`${propName} at lines:`, indices.map(i => i+1));
  if (indices.length >= 2) {
    for (let k = indices.length - 1; k >= 1; k--) {
      const start = indices[k];
      let end = start;
      while (end < lines.length && !lines[end].trimEnd().endsWith(",")) end++;
      console.log(`  حذف خطوط ${start+1}–${end+1}`);
      lines.splice(start, end - start + 1);
    }
    fs.writeFileSync(filePath, lines.join("\n"), "utf8");
    console.log(`  ✅ تکراری ${propName} حذف شد`);
  } else {
    console.log(`  ✅ تکراری نیست`);
  }
}

removeDuplicateProps(path.join(root, "components/ProductDetailClient.tsx"), "selectedColor");
removeDuplicateProps(path.join(root, "components/ProductDetailClient.tsx"), "shipping_type");

console.log("\n🔨 Build...");
try { execSync("npm run build", { cwd: root, stdio: "inherit" }); console.log("✅ Build!"); }
catch { console.error("❌ Build failed"); process.exit(1); }

try {
  execSync("git add -A", { cwd: root, stdio: "inherit" });
  execSync(`git commit -m "fix(ProductDetailClient): remove duplicate selectedColor/shipping_type\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01N9e81KV3KtagzZWbr79joe"`, { cwd: root, stdio: "inherit" });
  execSync("git push origin main", { cwd: root, stdio: "inherit" });
  console.log("🚀 push!");
} catch(e) { console.error("git:", e.message); }