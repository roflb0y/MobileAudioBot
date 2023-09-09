import { SlashCommandBuilder } from "discord.js";

export const configCommand = new SlashCommandBuilder()
		.setName('config')
		.setDescription('Lets you to change bot config on this server')
        .addStringOption(option => 
            option.setName("language")
                .setDescription("Bot language")
                .setRequired(false)
                .addChoices(
                    { "name": "Русский", "value": "ru" },
                    { "name": "English", "value": "en" }
                )
            )
        .addBooleanOption(option => 
            option
                .setName("autoconversion")
                .setDescription("Automatic conversion of all audio files sent to this channel")
)
        
export const helpCommand = new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows how to use the bot as long with some info")
