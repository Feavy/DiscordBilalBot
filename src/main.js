const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { setNewProfilePicture, getAuthorization, isAuthorized } = require('./discord')
const getImages = require("./googleImages");

const fs = require("fs");

let mainWindow;
let selectedImage;

var authorization;
var images;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            webviewTag: true,
            preload: path.join(__dirname, 'mainpreload.js')
        },
        autoHideMenuBar: true
    });

    launchBot();

    ipcMain.on('select', async() => {
        const rep = await setNewProfilePicture(authorization, selectedImage);
        if (Array.isArray(rep.avatar))
            mainWindow.webContents.executeJavaScript(`alert("${rep.avatar[0]}")`);
        else
            mainWindow.webContents.executeJavaScript(`alert("Photo de profil modifiée avec succès !")`);
    })

    mainWindow.loadFile('index.html')

    mainWindow.on('closed', function() {
        mainWindow = null
    });

}

async function launchBot() {
    let authorized = false;

    if (fs.existsSync("config.json")) {
        authorization = JSON.parse(fs.readFileSync("config.json")).authorization;
        authorized = await isAuthorized(authorization);
    }

    if (!authorized) {
        console.log("Not authorized with config.json");
        autorization = await getAuthorization(mainWindow);
        fs.writeFileSync("config.json", JSON.stringify({ authorization: autorization }, null, 4));
    }

    let images2;

    if (fs.existsSync("images.json") && (process.argv.length < 3 || process.argv[2] !== "images")) {
        images = JSON.parse(fs.readFileSync("images.json"));
    } else {
        images = await getImages(mainWindow);
        fs.writeFileSync("images.json", JSON.stringify(images, null, 4));
    }
    images2 = images.slice();

    while (true) {
        const index = Math.floor(Math.random() * images.length);
        const img = images[index];

        images.splice(index, 1);

        if (images.length === 0) {
            images = images2.slice();
        }

        console.log(img);
        const rep = await setNewProfilePicture(authorization, img);
        if (Array.isArray(rep.avatar))
            console.log(rep.avatar[0]);
        else
            console.log("Photo de profil modifiée avec succès !");

        console.log("waiting...");
        await new Promise(resolve => setTimeout(() => resolve(), 600000));
    }

    mainWindow.close();
}

app.on('ready', createWindow)

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function() {
    if (mainWindow === null) createWindow()
})