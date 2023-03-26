import fs from 'node:fs';
import path from 'node:path';
import { CreateVitePressConfig } from './generate_config';
// Define the folder to watch
const docsPath = path.resolve('./docs');

// Define the callback function to execute when a file changes
const callback = (eventType, filename) => {
  if (filename.startsWith('.vitepress')) {
    return;
  }

  console.log(`File ${filename} has been ${eventType}`);

  CreateVitePressConfig();
};

// Watch the folder for file changes
fs.watch(docsPath, { recursive: true }, callback);
