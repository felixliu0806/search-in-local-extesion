import { build } from 'vite';
import { copyFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// 创建一个基础的 16x16 图标（base64 编码的简单方块）
const createPlaceholderIcon = (size) => {
  // 这是一个简单的透明PNG图标，大小为指定尺寸
  const pngHeader = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(pngHeader, 'base64');
};

// 构建扩展
async function buildExtension() {
  console.log('Building extension...');
  
  // 运行 Vite 构建
  await build({
    build: {
      outDir: 'dist'
    }
  });
  
  // 创建图标
  const sizes = [16, 32, 48, 128];
  for (const size of sizes) {
    const iconBuffer = createPlaceholderIcon(size);
    const iconPath = path.join('dist', `icon-${size}.png`);
    writeFileSync(iconPath, iconBuffer);
    console.log(`Created icon-${size}.png`);
  }
  
  console.log('Extension build completed!');
  console.log('You can now load the "dist" folder as an unpacked extension in Chrome.');
}

buildExtension().catch(console.error);