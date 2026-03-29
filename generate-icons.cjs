const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = 'assets/icon.png';
const RES_DIR = 'android/app/src/main/res';

const SIZES = {
  'mipmap-mdpi': { launcher: 48, adaptive: 108 },
  'mipmap-hdpi': { launcher: 72, adaptive: 162 },
  'mipmap-xhdpi': { launcher: 96, adaptive: 216 },
  'mipmap-xxhdpi': { launcher: 144, adaptive: 324 },
  'mipmap-xxxhdpi': { launcher: 192, adaptive: 432 }
};

async function generateIcons() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found at', SOURCE_ICON);
    process.exit(1);
  }

  console.log('Generating Android icons from', SOURCE_ICON);

  for (const [dirName, sizes] of Object.entries(SIZES)) {
    const dirPath = path.join(RES_DIR, dirName);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 1. Standard Launcher Icon (ic_launcher.png)
    await sharp(SOURCE_ICON)
      .resize(sizes.launcher, sizes.launcher, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(dirPath, 'ic_launcher.png'));

    // 2. Round Launcher Icon (ic_launcher_round.png)
    const circleSvg = Buffer.from(`<svg width="${sizes.launcher}" height="${sizes.launcher}"><circle cx="${sizes.launcher/2}" cy="${sizes.launcher/2}" r="${sizes.launcher/2}" /></svg>`);
    await sharp(SOURCE_ICON)
      .resize(sizes.launcher, sizes.launcher, { fit: 'cover' })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // 3. Adaptive Foreground (ic_launcher_foreground.png)
    // The foreground should be smaller inside the 108dp box (usually 72dp is the safe zone).
    const innerSize = Math.floor(sizes.adaptive * 0.66); // 66% of the adaptive size
    const padding = Math.floor((sizes.adaptive - innerSize) / 2);
    
    await sharp(SOURCE_ICON)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: sizes.adaptive - innerSize - padding,
        left: padding,
        right: sizes.adaptive - innerSize - padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));

    // 4. Adaptive Background (ic_launcher_background.png)
    await sharp({
      create: {
        width: sizes.adaptive,
        height: sizes.adaptive,
        channels: 4,
        background: { r: 8, g: 8, b: 12, alpha: 1 } // #08080c
      }
    })
    .png()
    .toFile(path.join(dirPath, 'ic_launcher_background.png'));

    console.log(`Generated icons for ${dirName}`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
