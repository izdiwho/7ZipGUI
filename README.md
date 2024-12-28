# 7ZipGUI

A simple GUI wrapper for 7-Zip on macOS. Created using Electron and Claude.

<img src="screenshot.png" width="600" alt="7ZipGUI Screenshot">

## Features
- Create .7z and .zip archives
- Password protect archives
- Custom naming options
- Simple and intuitive interface
- Native macOS experience

## Requirements
- macOS
- [7-Zip](https://www.7-zip.org/) (p7zip)

## Installation
1. Download the latest release from the [releases page](https://github.com/izdiwho/7ZipGUI/releases)
2. Install 7-Zip if you haven't:
   ```bash
   brew install p7zip
   ```
3. Move the app to your Applications folder

## Development

```bash
# Install dependencies
npm install

# Run the app
npm start

# Build the app
npm run build
```

## Why?

This project was created because I got tired of using the 7z command line to password protect stuff and the Mac apps for these functionalities are sooooo expensive. Cost me ~USD2 of Anthropic credits to create this, enjoy.

## Support

☕ [Buy me a coffee](https://buymeacoffee.com/izdiwho/)

## Credits

- Created by [Claude](https://anthropic.com/claude) & [izdiwho](https://izdiwho.com)
- Uses [7-Zip](https://www.7-zip.org/) for compression