import { ActivityType, Client, IntentsBitField, SlashCommandBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonStyle, ComponentType, ButtonInteraction } from 'discord.js';
import * as converter from './processVideo.js';
import { downloadFiles } from './downloadFiles.js';
import { getProcessCount } from './database.js';
import { BOT_TOKEN, DEV_TOKEN } from './config.js';
import * as utils from "./utils.js"

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

//process.on("unhandledRejection", error => {console.log("unhandled rejection aaaaa", error.toString())});
//process.on("uncaughtException", error => {console.log("aaadfasddasdasfdsaf", error.toString())});

client.on('ready', (c) => {
    console.log(`Logged as ${client.user.tag}`);

    const helpCommand = new SlashCommandBuilder()
        .setName("help")
        .setDescription("Bot help");

    client.application.commands.create(helpCommand.toJSON());
    updateRPC();
    setInterval(() => updateRPC(), 60000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return false;
    if (message.content.includes("@here") || message.content.includes("@everyone") || message.type == "REPLY") return false;

    //console.log(message);
    if (message.mentions.has(client.user.id) && message.reference) {
        const msg = await message.fetchReference();
        if (processing_currently.includes(msg.id)) { 
            await message.reply("These files are currently being processed");
            return;
        };
        processing_currently.push(msg.id);

        if (msg.attachments) {
            const audioFiles = await utils.getAudioFiles(msg.attachments);
            const files = await downloadFiles(audioFiles);
            let filteredFiles = files.filter((item) => item.duration < 900);

            if (filteredFiles.length < files.length) {
                await msg.reply(`Only files up to 15 minutes long are supported. ${filteredFiles.length > 0 ? "Not all files will be converted." : ""}`);
            }

            if (filteredFiles.length === 0) {
                console.log("All files are longer than 15 minutes so deleting");
                utils.deleteFiles(files.map((item) => item.filename));
                return;
            }
            
            const videoFilenames = await converter.processVideos(filteredFiles);

            console.log(`uploading to discord. ${new Date().toString()}\n`);
            try {
                await msg.reply({files: videoFilenames, "allowedMentions": { "users" : []}});
            }
            catch (error) {
                try {
                    console.log("Missing permissions.", error);
                    await msg.reply("Failed to upload files. Check channel and bot permissions.")
                } catch {
                    console.log("пхаха бля ктото запретил отправлять сообщения впринципе))")
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

client.on(Events.InteractionCreate, interaction => {
    if(!interaction.isChatInputCommand()) return;
    if(interaction.commandName === "help") {
        utils.getLangFile("en").then((langFile) => {

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

client.login(DEV_TOKEN);
