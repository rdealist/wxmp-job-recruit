const fs = require('fs');
const path = require('path');

// 简单的SVG到PNG转换脚本
// 由于没有安装图像处理库，我们先创建一个基础的PNG文件

const iconNames = ['home', 'home-active', 'publish', 'publish-active', 'user', 'user-active'];

// 创建一个简单的32x32像素的PNG文件头
function createSimplePNG(color = '#9ca3af') {
  // 这是一个简化的PNG创建，实际项目中建议使用专业的图像处理库
  const width = 32;
  const height = 32;
  
  // PNG文件签名
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // chunk length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // bit depth
  ihdr.writeUInt8(2, 17); // color type (RGB)
  ihdr.writeUInt8(0, 18); // compression
  ihdr.writeUInt8(0, 19); // filter
  ihdr.writeUInt8(0, 20); // interlace
  
  // 计算CRC
  const crc = require('zlib').crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(crc, 21);
  
  // IEND chunk
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  
  return Buffer.concat([signature, ihdr, iend]);
}

// 创建图标目录
const iconsDir = path.join(__dirname, '../src/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('正在创建PNG图标文件...');

iconNames.forEach(iconName => {
  const isActive = iconName.includes('active');
  const pngData = createSimplePNG(isActive ? '#6697f5' : '#9ca3af');
  const outputPath = path.join(iconsDir, `${iconName}.png`);
  
  fs.writeFileSync(outputPath, pngData);
  console.log(`✅ 创建了 ${iconName}.png`);
});

console.log('图标转换完成！');
