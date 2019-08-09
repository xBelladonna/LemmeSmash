const config = require("../../config.json");
const utils = require("../utils.js");

module.exports = {
    name: "say",
    aliases: ["tell"],
    description: "Owner only fun times",
    hidden: true,
    usage: [],
    example: [],
    execute: async (msg, args) => {
        const channel = args[0];

        // This method proxies messages as the bot so owners can "say" things through the bot.
        // You can also pass a channel Snowflake and it will send the message to that channel.
        if (msg.author.id == config.owner) {
            if (new RegExp("[0-9]+", "g").test(channel)) {
                // Useful for notifying users about edge-case errors and anything else
                if (channel.length !== 18) return msg.channel.send("That's not a valid Discord Snowflake!");
                args.shift();
                const message = args.join(" ");
                try {
                    await msg.client.channels.get(channel).send(message);
                    return msg.channel.send("Message sent successfully!");
                } catch (err) {
                    console.error(`Unable to send message to ${channel} due to lack of permissions:\n${err}`)
                    return msg.channel.send("I don't have access to that channel!");
                }
            }
            const message = args.join(" ");
            await msg.channel.send(message);
            return msg.delete();
        }
    }
};