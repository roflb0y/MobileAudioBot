import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { getFontsize } from './utils.js';

export async function processVideo(
    audioFilename,
    originalFilename,
    authorUsername,
    duration
) {
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input("color=size=320x120:rate=1:color=0x000000")
            .inputOptions(["-f lavfi"])
            .addInput(audioFilename)
            //.videoFilter(`drawtext=fontfile=helvetica_regular.ttf:text='сукаааа':fontsize=14:fontcolor='white'`)
            .videoFilters({
                filter: 'drawtext',
                options: {
                    fontfile: "HelveticaRegular.ttf",
                    text : originalFilename,
                    fontsize: getFontsize(originalFilename),
                    fontcolor: 'white',
                    x: '(w-text_w)/2:y=(h-text_h)/2'
                }
            })
            .videoCodec("libx264")
            .videoBitrate(1)
            .audioCodec("aac")
            .audioBitrate("192k")
            .outputOptions([`-t ${duration.toString()}`, '-preset ultrafast'])
            .save(`${audioFilename}.mp4`)

            .on('error', function(err, stdout, stderr) {
                console.log('error: ' + err.message);
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
            })
            .on('end', () => {
                fs.unlinkSync(audioFilename);
                resolve(`${audioFilename}.mp4`);
            })
    });
}