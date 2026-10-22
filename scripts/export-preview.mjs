import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// 生成可直接双击打开的单文件原型，无需 Node、CDN 或本地服务器。
const root = resolve(import.meta.dirname, '..');
const assets = await readdir(resolve(root, 'dist/assets'));
const jsFile = assets.find(name => /^index-.*\.js$/.test(name));
const cssFile = assets.find(name => /^index-.*\.css$/.test(name));
if (!jsFile || !cssFile) throw new Error('请先运行 npm run build');
const avatar = await readFile(resolve(root, 'ui-design/public/assets/avatar.jpg'));
const avatarUrl = `data:image/jpeg;base64,${avatar.toString('base64')}`;
const js = (await readFile(resolve(root, 'dist/assets', jsFile), 'utf8'))
  .replaceAll('/assets/avatar.jpg', avatarUrl).replaceAll('</script', '<\\/script');
const css = await readFile(resolve(root, 'dist/assets', cssFile), 'utf8');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f8f9fb"><title>zeze49024 · UI 设计预览</title><style>${css}</style><script>try{if(localStorage.getItem('zeze-theme')==='dark')document.documentElement.classList.add('dark')}catch{}</script></head><body><a class="skip-link" href="#main">跳转到内容</a><div id="app"></div><script type="module">${js}</script></body></html>`;
await writeFile(resolve(root, 'ui-design/preview.html'), html, 'utf8');
console.log('已生成 ui-design/preview.html，可直接双击打开。');
