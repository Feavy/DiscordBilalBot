const nativeImage = require("electron").nativeImage;
const fetch = require("node-fetch");

const fs = require("fs");

async function crop(data, filename) {
    const base64Picture = new Buffer(data).toString("base64");

    const body = `<?xml version="1.0" encoding="utf-8"?>
    <ImageRequestBinary xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key>
    <api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>
    <detection_flags></detection_flags>
    <imagefile_data>${base64Picture}</imagefile_data>
    <original_filename>${filename}.png</original_filename>
    </ImageRequestBinary>`;

    let response = await fetch("http://www.betafaceapi.com/service.svc/UploadNewImage_File", {
        method: "POST",
        headers: {
            "content-type": "application/xml",
            "content-length": body.length
        },
        body: body
    });

    let txt = await response.text();
    let media_uuid = txt.split("<img_uid>")[1].split("<")[0];
    console.log("media_uuid", media_uuid);

    var json;

    do {
        console.log("Picture in progress. Waiting...");
        await new Promise(resolve => setTimeout(() => resolve(), 1000));

        response = await fetch("http://www.betafaceapi.com/api/v2/media?api_key=d45fd466-51e2-4701-8da8-04351c872236&media_uuid=" + media_uuid, {
            method: "GET"
        });
        json = await response.json();
    } while (json.error_code && json.error_code == 1);

    let face = json.faces[0];
    console.log("face_uuid", face.face_uuid);

    const image = nativeImage.createFromBuffer(new Buffer(data));

    const vPadding = face.width / 4;
    const hPadding = face.height / 4;
    let x = Math.max(face.x - face.width / 2 - vPadding, 0);
    let y = Math.max(face.y - face.height / 2 - hPadding, 0);
    let width = Math.min(image.getSize().width - x, face.width + vPadding * 2);
    let height = Math.min(image.getSize().height - y, face.height + hPadding * 2);

    if (height > width) {
        x -= (height - width) / 2;
        width = height;
    } else {
        y -= (width - height) / 2;
        height = width;
    }

    const newData = image.crop({
        x: Math.floor(x),
        y: Math.floor(y),
        width: Math.ceil(width),
        height: Math.ceil(height)
    }).toPNG();

    fs.writeFileSync("cropped.png", newData);

    return newData.toString("base64");
}

module.exports = crop;