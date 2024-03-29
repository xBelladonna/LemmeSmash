const config = require("../../config.json");
const utils = require("../utils.js");

module.exports = {
    name: "say",
    aliases: ["tell"],
    description: "Owner only fun times",
    hidden: true,
    usage: [
        "**<your message here>**\nThe bot will post the message you wrote",
        "**<channel ID> <your message here>**\n The bot will send the message you wrote to the channel with the ID you specified"
    ],
    examples: [
        "Hello World!",
        "549997949714152251 Hello mortals"
    ],
    execute: async (client, msg, args) => {
        const channel = args[0];

        // This method proxies messages as the bot so owners can "say" things through the bot.
        // You can also pass a channel Snowflake and it will send the message to that channel.
        if (msg.author.id == config.owner) {
            if (new RegExp("[0-9]+", "g").test(channel)) {
                // Useful for notifying users about edge-case errors and anything else
                if (channel.length !== 18) return msg.channel.send(utils.errorEmbed("That's not a valid Discord Snowflake!"));
                if (args.length < 2) return msg.channel.send(utils.errorEmbed("Cannot send an empty message!"));
                args.shift();
                const message = args.join(" ");
                try {
                    await client.channels.get(channel).send(message);
                    return msg.channel.send("Message sent successfully!");
                } catch (e) {
                    console.error(`\nUnable to send message to channel ID ${channel} due to lack of permissions:\n${e}`)
                    return msg.channel.send(utils.errorEmbed("I don't have access to that channel!"));
                }
            }
            if (args.length < 1) return msg.channel.send(utils.errorEmbed("Cannot send an empty message!"));
            const message = args.join(" ");
            await msg.channel.send(message);
            return msg.delete();
        }
    }
};