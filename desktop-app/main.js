const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const localIndex = path.join(
    __dirname,
    "..",
    "admin-panel",
    "build",
    "index.html"
  );
  if (fs.existsSync(localIndex)) {
    console.log("✅ Load local build");
    win.loadFile(localIndex);

  } else {
    console.log("🌐 Load dev server at http://localhost:3000");
    win.loadURL(process.env.ADMIN_PANEL_URL || "http://localhost:3000");
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
