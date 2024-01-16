import { ActivityType, Client, IntentsBitField, Events, EmbedBuilder, PermissionsBitField } from 'discord.js';
import * as converter from './processVideo.js';
import { downloadFiles } from './downloadFiles.js';
import * as db from './database.js';
import * as config from './config.js';
import * as utils from "./utils.js";
import * as log from "./logger.js";

import * as commands from "./commands.js";

process.on("unhandledRejection", error => {log.error(`Unhandled rejection. ${error.toString()}`)});
process.on("uncaughtException", error => {log.error(`Uncaught exception. ${error.toString()}`)});

let processing_currently = [];

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

function updateRPC() {
    db.getProcessCount()
        .then((processCount) => {
            try {
                let presence = `Processed ${processCount} files!`;
                client.user.setPresence({activities: [{ name: presence, type: ActivityType.Playing }], status: 'online'});
                log.info(`Presence set to: ${presence}`);
            }
            catch (error) {
                log.error(`Failed to update presence. ${error}`);
            };
        });
}

client.on('ready', (c) => {
    log.info(`Logged as ${client.user.tag}`);

    client.application.commands.create(commands.configCommand.toJSON());
    client.application.commands.create(commands.helpCommand.toJSON());
    log.info("Registered commands");

    updateRPC();
    setInterval(() => updateRPC(), 300000);
});

client.on('messageCreate', async (message) => {
    await db.addServer(message.guild.id);
    await db.addChannel(message.channel.id);

    if (message.author.bot) return false;
    if (message.content.includes("@here") || message.content.includes("@everyone") || message.type == "REPLY") return false;
    if(!message.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)) return false;

    const autoconvertEnabled = await db.isAutoconversionEnabled(message.channel.id);

    //console.log(message);
    if ((message.mentions.has(client.user.id) && message.reference) || (autoconvertEnabled && message.attachments.size > 0)) {
        const lang = await db.getLang(message.guild.id);

        if(!message.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.AttachFiles)) {
            await message.reply(lang.cant_upload);
            return false;
        }

        let msg;
        let msgReference;
        let isAutoconversion = autoconvertEnabled;

        if (message.reference) msgReference = await message.fetchReference();

        if (autoconvertEnabled && message.attachments.size > 0) msg = message;
        else if (autoconvertEnabled && msgReference && msgReference.attachments.size > 0) { msg = msgReference; isAutoconversion = false }

        console.log(msg);

        if (processing_currently.includes(msg.id)) { 
            await message.reply(lang.currently_processing);
            return;
        };
        processing_currently.push(msg.id);

        if (msg.attachments) {
            const audioFiles = await utils.getAudioFiles(msg.attachments);
            const files = await downloadFiles(audioFiles);
            let filteredFiles = files.filter((item) => item.duration < 900);

            if (filteredFiles.length < files.length) {
                try {
                    await msg.reply(`${lang.long_files[0]} ${filteredFiles.length > 0 ? lang.long_files[1] : ""}`);
                } catch { }
            }

            if (filteredFiles.length === 0) {
                log.info(`All files are longer than 15 minutes or unsopported format so deleting: ${Array.from(msg.attachments, (item) => item[1].name).join(" | ")}\n`);
                let index = processing_currently.indexOf(msg.id);
                if (index !== -1) {
                    processing_currently.splice(index, 1);
                }
                utils.deleteFiles(files.map((item) => item.filename));
                if (!isAutoconversion) {
                    await msg.reply(lang.unsupported_files);
                }
                return;
            }
            
            const videoFilenames = await converter.processVideos(filteredFiles);
            
            try {
                await msg.reply({files: videoFilenames, "allowedMentions": { "users" : []}});
                log.info(`Uploaded to discord.\n`);
            }
            catch (error) {
                try {
                    log.error("Missing permissions.", error);
                    await msg.reply(lang.upload_failed);
                } catch {
                    log.error("пхаха бля ктото запретил отправлять сообщения впринципе))");
                }
            }

            utils.deleteFiles(videoFilenames);
            utils.deleteFiles(files.map((item) => item.filename));

            let index = processing_currently.indexOf(msg.id);
            if (index !== -1) {
                processing_currently.splice(index, 1);
            }
        };
    };
});

client.on(Events.InteractionCreate, async interaction => {
    await db.addServer(interaction.guild.id);
    await db.addChannel(interaction.channel.id);

    if(!interaction.isChatInputCommand()) return;

    const lang = await db.getLang(interaction.guild.id);
    if(interaction.commandName === "help") {
        const replyEmbed = new EmbedBuilder()
            .setColor(0x7289da)
            .addFields({name: "Help", value: lang.help})
            .setImage("https://i.imgur.com/sncs8FP.jpeg");
            
        interaction.reply(
            {
                embeds: [replyEmbed],
            }
        )
            .catch(() => { });
    }

    if(interaction.commandName === "config") {
        if(!interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({content: lang.no_permission, ephemeral: true});
            return;
        }

        const languageOption = interaction.options.get("language");
        const autoconversionOption = interaction.options.get("autoconversion");

        let result = "New settings:";

        if (languageOption) { 
            db.setLanguage(interaction.guild.id, languageOption.value);
            result += `\nLanguage: ${languageOption.value}`;
        };
        if (autoconversionOption) {
            db.setAutoconversion(interaction.channel.id, autoconversionOption.value);
            result += `\nAutoconversion: ${autoconversionOption.value}`;
        };

        await interaction.reply(result);
    }
});

client.login(config.BOT_TOKEN);
