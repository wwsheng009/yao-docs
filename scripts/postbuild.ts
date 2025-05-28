import { copyFile } from 'node:fs/promises';

// Path to the source file
const source = './dist/yao-docs/index.html';

// Path to the destination where file will be copied
const destination = './dist/index.html';

// Copying the file
try {
  await copyFile(source, destination);
  console.log('File was copied successfully');
} catch (err) {
  console.error('Error occurred while copying the file:', err);
}
