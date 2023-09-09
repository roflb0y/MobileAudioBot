import request from 'request';
import fs from 'fs';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import * as log from "./logger.js";

//process.on("unhandledRejection", error => {console.log("jopa", error.toString())});
//process.on("uncaughtException", error => {console.log("ponos", error.toString())});

export async function downloadFiles(files) {
    return new Promise((resolve) => {
        let workers = [];

        files.forEach(item => {
            const fileExt = item.name.split(".").pop();
            const saveFilename = `${item.id}.${fileExt}`;

            const worker = new Promise((resolve, reject) => {
                request.get(item.url)
                    .pipe(fs.createWriteStream(saveFilename))
                    .on('finish', async () => { 
                        log.process(`${item.name} downloaded`); 
                        const duration = await getAudioDurationInSeconds(saveFilename);
                        resolve({"filename": saveFilename, "title": item.name, "duration": duration})
                    })
                    .on('error', (error) => console.log(error))
            });
            workers.push(worker);
        })

        Promise.all(workers).then((filenames) => { resolve(filenames) });
    })
}