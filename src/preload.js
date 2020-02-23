const { ipcRenderer } = require('electron')

const cheerio = require('cheerio');

const allIds = [];

ipcRenderer.on("getImages", (event, predata) => {
  if(allIds.length == 0) {
    addLinks(document.documentElement.innerHTML.split("\n"));
    addLinks(predata.split("\\\"").join("\"").split("\\n"))
  }
  ipcRenderer.send("images", allIds);
});

function addLinks(lines) {
  for(let i = 0; i < lines.length;i++) {
    if(lines[i].includes('["https://encrypted-tbn0.gstatic.com/images')) {
        allIds.push(lines[i+1].split('"')[1].split('"')[0]);
    }
  }
}