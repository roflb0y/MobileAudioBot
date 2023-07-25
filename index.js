import { ActivityType, Client, IntentsBitField, SlashCommandBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ButtonInteraction } from 'discord.js';
import request from 'request';
import fs from 'fs';
import { processVideo } from './processVideo.js';
import { updateVideosProcessed, insertProcessIdkLmaooo, getProcessCount } from './database.js';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { BOT_TOKEN, DEV_TOKEN } from './config.js';
import { deleteFiles, getLangFile } from "./utils.js"

const ALLOWED_EXTENSIONS = ["mp3", "wav", "flac", "ogg", "m4a"];

let processing_currently = [];

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

function updateRPC() {
    getProcessCount()
        .then((processCount) => {
            try {client.user.setPresence({activities: [{ name: `Processed ${processCount} files!`, type: ActivityType.Playing }], status: 'online'}) }
            catch { };
        });
}

process.on("unhandledRejection", error => {console.error("unhandled rejection aaaaa", error.toString())});
process.on("uncaughtException", error => {console.error("aaadfasddasdasfdsaf", error.toString())});

client.on('ready', (c) => {
    console.log(`Logged as ${client.user.tag}`);
    try {client.user.setPresence({activities: [{ name: `bot is verificating...`, type: ActivityType.Playing }], status: 'online'}) }
    catch { };

    const helpCommand = new SlashCommandBuilder()
        .setName("help")
        .setDescription("Bot help");

    client.application.commands.create(helpCommand.toJSON());
    //updateRPC();
    //setInterval(() => updateRPC(), 60000);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return false;
    if (message.content.includes("@here") || message.content.includes("@everyone") || message.type == "REPLY") return false;

    //console.log(message);
    if (message.mentions.has(client.user.id)) {
        if (message.reference) {
            message.fetchReference().then(
                async function(msg) {
                    if (processing_currently.includes(msg.id)) { 
                        await message.reply("These files are currently being processed");
                        return;
                    };

                    if (msg.attachments) {
                        let replyfiles = [];
                        let audioFiles = [];

                        new Promise((resolve, reject) => {
                            msg.attachments.forEach(item => {
                                let fileExt = item.name.split(".").pop();

                                if (ALLOWED_EXTENSIONS.includes(fileExt)) {
                                    if (!processing_currently.includes(msg.id)) { processing_currently.push(msg.id); };
                                    let saveFilename = `${item.id}.${fileExt}`;

                                    new Promise((resolve, reject) => {
                                        request.get(item.url)
                                            .pipe(fs.createWriteStream(saveFilename))
                                            .on('finish', resolve)
                                            .on('error', (error) => reject(new Error(error)))
                                    })
                                    .then(() => {
                                        let startTime = new Date()
                                        console.log(`downloaded ${item.name}`);

                                        getAudioDurationInSeconds(saveFilename).then((duration) => {
                                            if (duration >= 900) { fs.unlinkSync(saveFilename); return };
                                            if (duration < 3) { duration = 3 };

                                            audioFiles.push(saveFilename);

                                            processVideo(saveFilename, item.name, msg.author.username, duration)
                                                .then(() => {
                                                    console.log(`${item.name} video processed`);
                                                    replyfiles.push(`${saveFilename}.mp4`);

                                                    let processTime = new Date - startTime
                                                    processTime = processTime/1000
                                                    insertProcessIdkLmaooo(item.id, processTime);
                                                    updateVideosProcessed();

                                                    if (replyfiles.length === audioFiles.length) { //потому што джаваскрипт либо я хз как по другому скорее всего второе
                                                        resolve();
                                                    }
                                            })
                                        })
                                    });
                                    
                                };
                            });
                        }).then(() => {
                            console.log(`uploading to discord. ${new Date().toString()}\n`);
                            msg.reply({files: replyfiles, "allowedMentions": { "users" : []}})
                                .then(() => {
                                    deleteFiles(replyfiles);
                                    replyfiles = [];
                                    audioFiles = [];

                                    let index = processing_currently.indexOf(msg.id);
                                    if (index !== -1) {
                                        processing_currently.splice(index, 1);
                                    }
                                })
                                .catch(error => {
                                    console.log("Missing permissions. Deleting everything", error);
                                    msg.reply("Failed to upload files. Check channel and bot permissions.")
                                    .catch(error => { console.log("пхаха бля ктото запретил отправлять сообщения впринципе))") })
                                    .then(() => {
                                        deleteFiles(replyfiles);
                                        replyfiles = [];
                                        audioFiles = [];
    
                                        let index = processing_currently.indexOf(msg.id);
                                        if (index !== -1) {
                                            processing_currently.splice(index, 1);
                                        }
                                    });
                                });
                        })
                    };
                }
            );
        };
    };
});

client.on(Events.InteractionCreate, interaction => {
    console.log(interaction);
    if(!interaction.isChatInputCommand()) return;
    if(interaction.commandName === "help") {
        getLangFile("en").then((langFile) => {

            const replyEmbed = new EmbedBuilder()
                .setColor(0x7289da)
                .addFields({name: "Help", value: langFile["help"]})
                .setImage("https://i.imgur.com/sncs8FP.jpeg");
    
            const actionRow = new ActionRowBuilder({
                components: [
                    {
                        label: "Русский язык",
                        style: ButtonStyle.Primary,
                        type: ComponentType.Button,
                        custom_id: "helplang_ru"
                    }
                ]
            });
            
            interaction.reply(
                {
                    embeds: [replyEmbed],
                }
            )
                .catch("help reply pososal");
        });
        
    }
});

client.login(BOT_TOKEN);