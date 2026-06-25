const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let nextProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        icon: path.join(__dirname, '../public/icon-512x512.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        backgroundColor: '#ffffff',
        title: 'MediHub'
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    // Load the app
    const startURL = isDev
        ? 'http://localhost:3000'
        : `http://localhost:3000`;

    mainWindow.loadURL(startURL);

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startNextServer() {
    if (isDev) {
        // In development, Next.js is already running
        return;
    }

    // In production, start Next.js server
    const nextPath = path.join(process.resourcesPath, 'app', 'node_modules', '.bin', 'next');
    const appPath = path.join(process.resourcesPath, 'app');

    nextProcess = spawn('node', [nextPath, 'start', '-p', '3000'], {
        cwd: appPath,
        env: { ...process.env, NODE_ENV: 'production' }
    });

    nextProcess.stdout.on('data', (data) => {
        console.log(`Next.js: ${data}`);
    });

    nextProcess.stderr.on('data', (data) => {
        console.error(`Next.js Error: ${data}`);
    });
}

app.whenReady().then(() => {
    if (!isDev) {
        startNextServer();
        // Wait for server to start
        setTimeout(createWindow, 3000);
    } else {
        createWindow();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
});
