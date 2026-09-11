/**
 * AXON CORE - Fix CI Workflow Script Escaping (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-FIX]\x1b[0m اصلاح کاراکترهای اسکریپت خط لوله...");

const githubWorkflowCode = `name: Axon Core CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Production Build Test
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: \${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: \${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
`;

writeFile('.github/workflows/ci.yml', githubWorkflowCode);

console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "ci(pipeline): add github actions workflow with proper escaping"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ خط لوله CI با موفقیت در گیت‌هاب ثبت شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}