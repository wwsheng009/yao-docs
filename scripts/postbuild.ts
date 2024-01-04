const fs = require('fs');

// Path to the source file
const source = './dist/yao-docs/index.html';

// Path to the destination where file will be copied
const destination = './dist/index.html';

// Copying the file
fs.copyFile(source, destination, (err) => {
  if (err) {
    console.error('Error occurred while copying the file:', err);
    return;
  }
  console.log('File was copied successfully');
});
