import path from "node:path";
import { BrowserWindow, app, ipcMain } from "electron";

app.whenReady().then(() => {
    // アプリの起動イベント発火で BrowserWindow インスタンスを作成
    const mainWindow = new BrowserWindow({
        webPreferences: {
            // webpack が出力したプリロードスクリプトを読み込み
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // レンダラープロセスをロード
    mainWindow.loadFile(path.join(__dirname, "index.html"));
    // 起動時にデベロッパーツールを別ウィンドウで表示する
    mainWindow.webContents.openDevTools({ mode: "detach" });
});

// すべてのウィンドウが閉じられたらアプリを終了する
app.once("window-all-closed", () => app.quit());
