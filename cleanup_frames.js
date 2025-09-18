import fs from 'fs';
import path from 'path';

const framesDir = path.resolve('./frames');

if (!fs.existsSync(framesDir)) {
  console.log('Frames directory does not exist. Nothing to delete.');
  process.exit(0);
}

const files = fs.readdirSync(framesDir);
for (const file of files) {
  const filePath = path.join(framesDir, file);
  fs.unlinkSync(filePath);
}

console.log('All files in the frames folder have been deleted.');