import { writeFileSync } from 'fs';

// 一个1x1像素的透明PNG（最小PNG格式）
const base64TransparentPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// 创建不同尺寸的相同图标
const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const buffer = Buffer.from(base64TransparentPNG, 'base64');
  writeFileSync(`dist/icon-${size}.png`, buffer);
  console.log(`Created icon-${size}.png`);
}

console.log('Icons created successfully! You may want to replace these with actual icons.');