const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');

const cleanDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) return;
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      cleanDir(fullPath);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${fullPath}`);
    }
  }
};

console.log('Cleaning uploads directory...');
cleanDir(uploadsDir);
console.log('Clean completed!');
