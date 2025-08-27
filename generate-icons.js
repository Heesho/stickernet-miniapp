const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG content for the icon
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- White background with rounded corners -->
  <rect width="512" height="512" rx="76.8" ry="76.8" fill="white"/>
  
  <!-- Logo with padding -->
  <g transform="translate(64, 64) scale(1.92)">
    <path 
      d="M40 20 C20 20, 0 40, 0 60 L0 140 C0 160, 20 180, 40 180 L80 180 L80 120 C80 100, 100 80, 120 80 L180 80 L180 60 C180 40, 160 20, 140 20 Z M120 100 C100 100, 100 100, 100 120 L100 160 L140 160 C160 160, 180 140, 180 120 L180 100 Z M100 160 L180 100" 
      fill="black"
      fill-rule="evenodd"
    />
  </g>
</svg>
`;

async function generateIcons() {
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }
  ];

  for (const { name, size } of sizes) {
    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, 'public', name));
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons();