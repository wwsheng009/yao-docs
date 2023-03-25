const fs = require("fs");
const path = require("path");
const CreateConfig = require("./generate_config");
// Define the folder to watch
const docsPath = path.resolve("./docs");

// Define the callback function to execute when a file changes
const callback = (eventType, filename) => {
  if (filename.startsWith(".vitepress")) {
    return;
  }
  console.log(`File ${filename} has been ${eventType}`);

  CreateConfig();
};

// Watch the folder for file changes
fs.watch(docsPath, { recursive: true }, callback);
