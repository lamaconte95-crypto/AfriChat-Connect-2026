import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svg192 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="afriGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="38" fill="url(#bgGrad)" stroke="#f59e0b" stroke-width="4" />
  
  <g transform="translate(48, 48) scale(0.1875)">
    <path d="M256 32C132.3 32 32 124.9 32 239.5c0 47.9 17.5 92.1 47.2 127.1L49 464.3c-4.4 13.3 6.9 26.6 20.7 24.3l108.5-17.9c24.6 9.6 50.8 14.8 77.8 14.8 123.7 0 224-92.9 224-207.5S379.7 32 256 32z" fill="url(#afriGrad)"/>
    <text x="256" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="140" font-weight="900" text-anchor="middle" fill="#0c0a09">AC</text>
  </g>
</svg>
`;

const svg512 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="afriGrad512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="bgGrad512" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad512)" stroke="#f59e0b" stroke-width="10" />
  
  <g transform="translate(128, 128) scale(0.5)">
    <path d="M256 32C132.3 32 32 124.9 32 239.5c0 47.9 17.5 92.1 47.2 127.1L49 464.3c-4.4 13.3 6.9 26.6 20.7 24.3l108.5-17.9c24.6 9.6 50.8 14.8 77.8 14.8 123.7 0 224-92.9 224-207.5S379.7 32 256 32z" fill="url(#afriGrad512)"/>
    <text x="256" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="140" font-weight="900" text-anchor="middle" fill="#0c0a09">AC</text>
  </g>
</svg>
`;

const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="afriGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#0c0a09" />
    </linearGradient>
  </defs>
  <!-- Full bleed for maskable icon -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />
  
  <g transform="translate(156, 156) scale(0.39)">
    <path d="M256 32C132.3 32 32 124.9 32 239.5c0 47.9 17.5 92.1 47.2 127.1L49 464.3c-4.4 13.3 6.9 26.6 20.7 24.3l108.5-17.9c24.6 9.6 50.8 14.8 77.8 14.8 123.7 0 224-92.9 224-207.5S379.7 32 256 32z" fill="url(#afriGradMask)"/>
    <text x="256" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="140" font-weight="900" text-anchor="middle" fill="#0c0a09">AC</text>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');
  
  await sharp(Buffer.from(svg192))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  await sharp(Buffer.from(svgMaskable))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('Created icon-maskable-192.png');

  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Created icon-maskable-512.png');
}

generate().catch(console.error);
