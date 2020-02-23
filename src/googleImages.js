const { ipcMain, BrowserWindow, ClientRequest } = require("electron");

const path = require('path')

const fetch = require("node-fetch");

async function getImages(mainWindow) {
    return new Promise(function (resolve, reject) {
        mainWindow.show();

        var childWindow = new BrowserWindow({
            parent: mainWindow,
            center: true,
            width: 800,
            height: 600,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        childWindow.webContents.session.protocol.registerBufferProtocol("http", (requ, callback) => {
            console.log("callback");
        })

        var otherdata = "";
        var pending = [];

        childWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
            if(details.url.includes("batchexecute")) {
                const data = details.uploadData[0].bytes.toString();
                pending.push(0);
                fetch(details.url, {
                    method: "POST",
                    headers: {
                        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                        "content-length": data.length 
                    },
                    body: data
                }).then(rep => rep.text())
                .then(txt => {
                    otherdata += txt;
                    pending.pop();
                });
            }
            callback(undefined);
        });

        childWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36");

        childWindow.webContents.openDevTools();

        //childWindow.loadURL("https://www.google.com/search?q=php&sxsrf=ACYBGNTyPzJJ-JL_fKIgRJtjK96E5xSMZg:1580054738272&source=lnms&tbm=isch&sa=X&ved=2ahUKEwjL15nL0qHnAhUM1RoKHeVADS4Q_AUoAXoECBEQAw&biw=1920&bih=973");
        childWindow.loadURL("https://www.google.com/search?q=bilal+hassani&sxsrf=ACYBGNR_ug5rjjHa_sE5bYpxpZbMHz9dgA:1579375905221&source=lnms&tbm=isch&sa=X&ved=2ahUKEwi-pLDe8Y3nAhWryIUKHbYcDUcQ_AUoAXoECBUQAw&biw=1366&bih=629");

        childWindow.webContents.on('dom-ready', async function () {
            for (let i = 0; i < 8; i++) {
                await childWindow.webContents.executeJavaScript(`window.scroll(0, ${(i + 1) * 6000});`);
                //Google Images :
                try {
                    await childWindow.webContents.executeJavaScript(`document.getElementsByClassName("mye4qd")[0].click()`);
                } catch (error) { }
                await new Promise(resolve => setTimeout(() => resolve(), 250));
            }

            while(pending.length > 0) {
                await new Promise(resolve => setTimeout(() => resolve(), 250));
            }

            childWindow.send("getImages", otherdata);
        })

        ipcMain.on('images', (event, images) => {
            mainWindow.webContents.send("images", images);
        })

        ipcMain.on("images_selected", (event, images) => {
            resolve(images);
            childWindow.close();
            mainWindow.hide();
        });
    });
}

module.exports = getImages;