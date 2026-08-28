// Skrypt wyodrębniający CSS i JS z index.html do osobnych plików.
// Uruchom: node scripts/extract-assets.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// --- Wyodrębnij CSS (pierwszy <style>...</style>) ---
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) { console.error('Nie znaleziono <style>'); process.exit(1); }
const css = styleMatch[1];
fs.writeFileSync(path.join(root, 'css', 'style.css'), css, 'utf8');
console.log('css/style.css zapisany (' + css.length + ' znaków)');

// Zastąp blok <style>...</style> linkiem do pliku
html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="css/style.css">');

// --- Wyodrębnij JS (wszystkie <script>...</script> bez src) ---
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let jsIndex = 0;
let jsContent = '';
const scriptBlocks = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scriptBlocks.push(match[0]);
  jsContent += match[1] + '\n';
}

// Zapisujemy cały JS do jednego pliku
fs.writeFileSync(path.join(root, 'js', 'main.js'), jsContent, 'utf8');
console.log('js/main.js zapisany (' + jsContent.length + ' znaków, ' + scriptBlocks.length + ' bloków)');

// Zastąp wszystkie bloki <script>...</script> jednym odwołaniem
html = html.replace(/<script>[\s\S]*?<\/script>/g, '');

// Wstaw <script src="js/main.js"> przed </body>
html = html.replace('</body>', '<script src="js/main.js"></script>\n</body>');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('index.html zaktualizowany');