const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const execAsync = promisify(exec);

const POSSIBLE_7ZIP_PATHS = [
    '/usr/local/bin/7z',           // Homebrew default
    '/opt/homebrew/bin/7z',        // Apple Silicon Homebrew
    '/usr/bin/7z',                 // System location
    '/usr/local/bin/7za',          // Alternative name
    '/opt/homebrew/bin/7za'        // Alternative name on Apple Silicon
];

async function find7ZipPath() {
    for (const path of POSSIBLE_7ZIP_PATHS) {
        try {
            await fs.access(path, fs.constants.X_OK);
            return path;
        } catch (error) {
            continue;
        }
    }
    return null;
}

async function check7ZipInstallation() {
    const sevenZipPath = await find7ZipPath();
    if (sevenZipPath) {
        try {
            await execAsync(`"${sevenZipPath}" i`);
            return true;
        } catch (error) {
            console.error('7zip test failed:', error);
            return false;
        }
    }
    return false;
}

let mainWindow;

function handleWindowClose() {
    // For macOS, override the default behavior of keeping the app running when windows are closed
    app.quit();
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title: '7Zip GUI',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false
        }
    });

    const { Menu } = require('electron');
    const template = [
        {
            label: '7ZipGUI',
            submenu: [
                {
                    label: 'About 7ZipGUI',
                    click: () => {
                        app.showAboutPanel();
                    }
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    if (process.platform === 'darwin') {
        app.dock.setMenu(Menu.buildFromTemplate([
            {
                label: 'New Window',
                click() { createWindow(); }
            }
        ]));
    }
    
    // Check 7zip installation
    const is7ZipInstalled = await check7ZipInstallation();
    if (!is7ZipInstalled) {
        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: '7-Zip Not Found',
            message: '7-Zip is not installed on your system.',
            detail: 'Please install it using Terminal:\n\nbrew install p7zip',
            buttons: ['OK']
        });
    }
    
    mainWindow.on('closed', handleWindowClose);
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.setAboutPanelOptions({
    applicationName: '7ZipGUI',
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    iconPath: path.join(__dirname, 'build', 'icon.png')
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('check-7zip-installation', async () => {
    return await check7ZipInstallation();
});

ipcMain.handle('select-files', async (event, type) => {
    const properties = type === 'archive' ? ['openFile', 'multiSelections'] : ['openFile'];
    const filters = type === 'extract' ? [
        { name: 'Archives', extensions: ['7z', 'zip', 'rar', 'tar', 'gz'] }
    ] : null;

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: properties,
        filters: filters
    });
    return result.filePaths;
});

ipcMain.handle('create-archive', async (event, { input, password, format, customName }) => {
    try {
        const sevenZipPath = await find7ZipPath();
        if (!sevenZipPath) {
            throw new Error('7-Zip is not installed. Please install it using: brew install p7zip');
        }

        const inputDir = path.dirname(input[0]);
        const baseName = customName || path.basename(input[0], path.extname(input[0]));
        const output = path.join(inputDir, `${baseName}.${format}`);
        
        const passwordFlag = password ? `-p"${password}"` : '';
        const formatFlag = format === 'zip' ? '-tzip' : '';
        
        const command = `"${sevenZipPath}" a ${formatFlag} ${passwordFlag} "${output}" "${input.join('" "')}"`;
        
        console.log('Executing command:', command);
        
        return new Promise((resolve, reject) => {
            const process = exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.error('7zip stderr:', stderr);
                }
                resolve({ success: true, message: 'Archive created successfully!' });
            });

            // Optional: Handle process events
            process.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            process.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
        });
    } catch (error) {
        console.error('Error details:', error);
        return { 
            success: false, 
            message: error.message.includes('not installed') 
                ? 'Please install 7-Zip first using: brew install p7zip' 
                : `Error: ${error.message}`
        };
    }
});
