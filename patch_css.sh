cat << 'INNER_EOF' > /tmp/css_patch.js
const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');

// Replace avatar-moving-in animation
css = css.replace(
  /animation: avatar-to-center 1\.5s ease-in-out forwards;/g,
  'animation: avatar-to-center 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;'
);

// Replace avatar-moving-out animation
css = css.replace(
  /animation: avatar-to-origin 1\.5s ease-in-out forwards;/g,
  'animation: avatar-to-origin 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;'
);

fs.writeFileSync('src/index.css', css);
INNER_EOF
node /tmp/css_patch.js
