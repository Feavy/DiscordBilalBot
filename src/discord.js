const fetch = require("node-fetch");
const crop = require('./faceCropper');

const { BrowserWindow } = require('electron')


async function updateDiscordAvatar(authorization, base64Avatar) {
    let response = await fetch("https://discordapp.com/api/v6/users/@me", {
        method: "PATCH",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
            "origin": "https://discordapp.com",
            "authority": 'discordapp.com',
            "accept": "*/*",
            "referer": "https://discordapp.com/activity",
            "content-type": "application/json",
            "authorization": authorization,
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzc5LjAuMzk0NS4xMzAgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6Ijc5LjAuMzk0NS4xMzAiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6NTI4NzgsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9"
        },
        body: `{"avatar":"data:image/png;base64,${base64Avatar}"}`
    });
    let json = await response.json();
    return json;
}

async function setNewProfilePicture(authorization, url) {
    const response = await fetch(url, {
        method: "GET"
    });

    const filename = url.split("/")[url.split("/").length - 1].split("?")[0];

    const data = await response.arrayBuffer();

    const avatar = await crop(data, filename);

    const rep = await updateDiscordAvatar(authorization, avatar);
    return rep;
}

async function isAuthorized(authorization) {
    var r = await fetch('https://discordapp.com/api/v6/users/@me', {
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            "authorization": authorization
        }
    });
    var json = await r.json();
    return json.code === undefined;
}

function getAuthorization(mainWindow) {
    /*protocol.interceptHttpProtocol("http", (request, result) => {
        console.log(request, result);
    });*/

    var childWindow = new BrowserWindow({
        parent: mainWindow,
        center: true,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
        },
        autoHideMenuBar: true
    });

    var promise = new Promise(function(resolve, reject) {
        childWindow.webContents.session.webRequest.onSendHeaders(function(details) {
            const nonAuthorized = [];
            try {
                if (details.requestHeaders.Authorization && details.requestHeaders.Authorization != "undefined") {
                    if (!nonAuthorized.includes(details.requestHeaders.Authorization) && isAuthorized(details.requestHeaders.Authorization)) {
                        resolve(details.requestHeaders.Authorization);
                        childWindow.close();
                    } else {
                        nonAuthorized.push(details.requestHeaders.Authorization);
                    }
                }
            } catch (error) {}
        });
    });

    childWindow.loadURL("https://discordapp.com/login");

    return promise;
}



exports.setNewProfilePicture = setNewProfilePicture;
exports.isAuthorized = isAuthorized;
exports.getAuthorization = getAuthorization;