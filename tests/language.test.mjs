import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const filesToCheck = [
  'README.md',
  'src/panels/Home.tsx',
  'src/panels/Persik.tsx',
  'src/panels/Category.tsx',
  'src/panels/Logs.tsx',
  'src/components/CapabilityCard.tsx',
  'src/components/CapabilityResult.tsx',
  'src/App.tsx',
  'src/AppConfig.tsx',
  'src/routes.ts',
  'src/utils/index.ts',
  'src/utils/transformVKBridgeAdaptivity.ts',
  'vite.config.ts',
];

for (const file of filesToCheck) {
  const content = await readFile(file, 'utf8');
  assert.doesNotMatch(content, /[\u0410-\u042F\u0430-\u044F\u0401\u0451]/u, `${file} 中仍包含俄文或西里尔字母`);
}

const home = await readFile('src/panels/Home.tsx', 'utf8');
assert.match(home, /能力实验室/u);
assert.match(home, /基础信息/u);
assert.match(home, /功能分类/u);
assert.doesNotMatch(home, /\bDiv\b/u, 'Home.tsx 不应继续使用已弃用的 Div');

const persik = await readFile('src/panels/Persik.tsx', 'utf8');
  assert.match(persik, /VK Bridge 方法测试中心/u);
assert.match(persik, /VK Bridge 方法测试中心/u);
