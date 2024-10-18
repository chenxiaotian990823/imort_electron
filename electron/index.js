// electron.js
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // 加载 Vite 的开发服务器或打包后的文件
  win.loadURL('http://localhost:5173'); // 如果在开发模式下
  // win.loadFile(path.join(__dirname, 'dist/index.html')); // 如果打包后使用

  // 当页面加载完成时，清空 localStorage 的某个字段
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      localStorage.removeItem('currentProjectPath');
      localStorage.removeItem('currentTableId');
    `).then(() => {
      console.log('localStorage key "yourKey" has been cleared.');
    }).catch(err => {
      console.error('Failed to clear localStorage key:', err);
    });
  });
}

// Electron 的应用程序事件
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
