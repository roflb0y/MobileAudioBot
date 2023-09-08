import fs from "fs";

const ALLOWED_EXTENSIONS = ["mp3", "wav", "flac", "ogg", "m4a"];

const DEFAULT_FONTSIZE = 20;
const LENGTH_THRESHOLD = 25;

export function getFontsize(str) {
    let fontsize = DEFAULT_FONTSIZE;
    if (str.length <= LENGTH_THRESHOLD) { return fontsize };

    let charOverflow = str.length - LENGTH_THRESHOLD;
    fontsize -= Math.floor(charOverflow/3); //400 iq calculations
    return fontsize;
};

export function deleteFiles(files) {
    files.forEach((item) => { 
        try { fs.unlinkSync(item) }
        catch { }
        }
    );
};

export function getLangFile(lang) {
    return new Promise((resolve, reject) => {
        fs.readFile(`./langs/${lang}.json`, 'utf-8', (err, data) => {
            try { resolve(JSON.parse(data)) } //js is hard
            catch { reject() }
        })
    });
};

export async function getAudioFiles(files) {
    let f  = [];
    files.forEach(item => {
        let fileExt = item.name.split(".").pop();
        if (ALLOWED_EXTENSIONS.includes(fileExt)) { f.push(item) };
    })
    return f;
};