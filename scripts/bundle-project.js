const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging clean project ZIP bundle...');

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, 'temp_bundle_staging');
const outputFile = path.join(rootDir, 'healthcare-appointment-platform.zip');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

fs.mkdirSync(stagingDir, { recursive: true });

function copyRecursive(src, dest, ignores = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    const base = path.basename(src);
    if (ignores.includes(base)) return;

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file), ignores);
    }
  } else {
    const base = path.basename(src);
    if (ignores.includes(base) || base.endsWith('.db') || base.endsWith('.zip')) return;
    fs.copyFileSync(src, dest);
  }
}

const ignoreFolders = ['node_modules', 'dist', '.git', '.cache', 'temp_bundle_staging'];

console.log('Copying backend...');
copyRecursive(path.join(rootDir, 'backend'), path.join(stagingDir, 'backend'), ignoreFolders);

console.log('Copying frontend...');
copyRecursive(path.join(rootDir, 'frontend'), path.join(stagingDir, 'frontend'), ignoreFolders);

console.log('Copying documentation & scripts...');
copyRecursive(path.join(rootDir, 'scripts'), path.join(stagingDir, 'scripts'), ignoreFolders);

const rootFiles = ['.gitignore', 'README.md', 'SYSTEM_DESIGN.md', '.env.example', 'package.json', 'render.yaml'];
for (const file of rootFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, path.join(stagingDir, file));
  }
}

console.log('Compressing staging directory into healthcare-appointment-platform.zip...');
const zipCmd = `powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${outputFile}' -Force"`;
execSync(zipCmd, { stdio: 'inherit' });

fs.rmSync(stagingDir, { recursive: true, force: true });

const sizeMB = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(2);
console.log(`✅ Complete project ZIP successfully created: ${outputFile} (${sizeMB} MB)`);

