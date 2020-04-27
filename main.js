const { app, BrowserWindow } = require('electron')

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 550,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('frmMain.html');
  win.removeMenu();

  // Uncomment below for JS debugging
  win.webContents.openDevTools();

}

app.whenReady().then(createWindow)