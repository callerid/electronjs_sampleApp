const { app, BrowserWindow, Menu, MenuItem, remote } = require('electron')

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 800,
    height: 460,
    webPreferences: {
      nodeIntegration: true
    }
  })

  var main_menu = [
    {
      label:'Call Log', 
      click(item, focused_window)
      {
        focused_window.webContents.executeJavaScript("open_call_log_window()");
      }
    }
  ];

  var template_menu = Menu.buildFromTemplate(main_menu);

  Menu.setApplicationMenu(template_menu);

  // and load the index.html of the app.
  win.loadFile('frmMain.html');

  // Uncomment below for JS debugging
  //win.webContents.openDevTools();

  // References
  global.sharedObj = {
    frmMain: win,
    frmClientInfo: null,
    frmAddLink: null
  };

}

app.whenReady().then(createWindow)