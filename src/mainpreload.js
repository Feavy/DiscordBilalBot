// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const fs = require("fs");

const {ipcRenderer} = require('electron');
var isFirst = true;

var allImagesURL = [];

ipcRenderer.on('images', (e, imagesURL) => {
    try {
        var data = fs.readFileSync("images.json");
        allImagesURL = JSON.parse(data);
    }catch(error){}

    const images = document.getElementById("images");
    for(let url of imagesURL) {
        let div = document.createElement("div");
        div.style.position = "relative";

        let img = document.createElement("img");
        img.src = url;
        div.appendChild(img);

        let div2 = document.createElement("div");
        div2.style.position = "absolute";
        div2.style.left = "50%";
        div2.style.top = "15%";
        
        let icon = document.createElement("img");
        icon.className = "check";
        icon.src = "check.png";

        if(allImagesURL.includes(url))
            icon.style.opacity = "1";

        div2.appendChild(icon);

        div.appendChild(div2);

        div.addEventListener("click", elem => {
            if(icon.style.opacity) {
                icon.style.opacity = null;
                allImagesURL.splice(allImagesURL.indexOf(url), 1);
            }else{
                icon.style.opacity = "1";
                allImagesURL.push(url);
            }
            console.log(allImagesURL);
        })
        images.appendChild(div);
    }

    document.getElementById("save_button").addEventListener("click", function(e) {
        ipcRenderer.send("images_selected", allImagesURL);
        alert("Images sauvegardées !");
    });

});