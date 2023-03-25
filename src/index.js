/* eslint-disable no-console */
const fs = require('node:fs')
const path = require('node:path')
const { CreateVitePressConfig } = require('./generate_config')
// Define the folder to watch
const docsPath = path.resolve('./docs')

// Define the callback function to execute when a file changes
const callback = (eventType, filename) => {
  if (filename.startsWith('.vitepress'))
    return

  console.log(`File ${filename} has been ${eventType}`)

  CreateVitePressConfig()
}

// Watch the folder for file changes
fs.watch(docsPath, { recursive: true }, callback)
