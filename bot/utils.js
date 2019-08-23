const Discord = require("discord.js");
const config = require("../config.json");
const defaultPrefix = config.prefix[0].toLowerCase();
const mongoose = require("mongoose");
const schemas = require("./schemas.js");
const guildSettings = mongoose.model("guildSettings", schemas.guildSettings);
const webhooks = mongoose.model("webhooks", schemas.webhooks);

module.exports = {
    successEmbed: content => {
        return new Discord.RichEmbed()
            .setColor("#43b581")
            .setDescription(content || "");
    },
    warnEmbed: content => {
        return new Discord.RichEmbed()
            .setColor("#ffaa00")
            .setDescription(content || "");
    },
    errorEmbed: content => {
        return new Discord.RichEmbed()
            .setColor("#ff2200")
            .setDescription(content || "");
    },

    setPresence: client => {
        client.user.setActivity(client.guilds.size <= 1 ? `${defaultPrefix}help` : `${defaultPrefix}help | in ${client.guilds.size} servers`, { type: "PLAYING" });
    },

    gracefulExit: async client => {
        await new Promise(async resolve => {
            console.warn("\nGracefully shutting down...");
            await client.destroy();
            resolve(console.warn("Goodbye!\n"));
        });
        process.exit();
    },

    // Webhook getter
    getWebhook: async (client, channel) => {
        let hook;
        try {
            return await webhooks.findOne({ channel: channel.id }).then(async doc => {
                if (doc == null) {
                    hook = await channel.createWebhook("LemmeSmash");
                    await new webhooks({
                        id: hook.id,
                        channel: channel.id
                    }).save();
                }
                else hook = await client.fetchWebhook(doc.id).catch(async e => {
                    if (e.code === 10015) {
                        hook = await channel.createWebhook("LemmeSmash");
                        await webhooks.findOne({ channel: channel.id }).then(async doc => {
                            doc.id = hook.id;
                            doc.channel = channel.id;
                            await doc.save();
                        });
                    }
                    else throw e;
                    return hook;
                });
                return hook;
            });
        } catch (e) {
            return e;
        }
    },

    // Add escape character ("\") before any special characters that need escaping (using regex)
    escapeCharacters: string => {
        if (string == null) throw new TypeError("Empty input to escapeCharacters function!");
        return string.replace(/[.*_~`(> )-^$+?\/|()[\]{}\\]/gm, '\\$&'); // $& means the whole matched string
    },

    // Returns true if the input string is a URL and false if not
    validateUrl(url) {
        pattern = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/igm);
        return pattern.test(url);
    },

    // Adds an invisible char if input string is < 2 chars or truncates if > 80 chars
    truncateOrPadUsername(string) {
        string = string.padEnd(2, "\u17b5"); // Invisible unicode char U+17B5
        if (string.length > 80) return string.slice(0, 79) + "…"; // Truncate ending with single Unicode char U+2026
        return string;
    },

    // Async function that waits for the given number of ms
    sleep: time => {
        return new Promise(resolve => {
            setTimeout(() => resolve(), time);
        });
    },

    attach: async attachments => {
        if (attachments.size == 0) return undefined;
        let objectArray = []
        await attachments.tap(attachment => {
            objectArray.push({
                attachment: attachment.url,
                name: attachment.filename
            });
        });
        return objectArray;
    },

    // Check permissions and notify if we don't have the ones we need
    ensurePermissions: async (client, msg, flags) => {
        let currentPerms = await msg.channel.permissionsFor(client.user);
        let missing = [];
        flags.forEach(flag => {
            if (!currentPerms.has(flag)) missing.push(flag)
        });

        if (missing.length > 0) {
            let owner = await client.fetchUser(msg.guild.ownerID);
            // Notify the user if there's missing permissions
            await msg.channel.send(new Discord.RichEmbed()
                .setColor("#ff2200")
                .setDescription(`❌ I can't do that because I'm missing the following permissions:\n\`• ${missing.join("\n• ")}\``)).catch(async () => {
                    // Failing that, DM the server owner (if they haven't disabled that)
                    const logChannel = await client.channels.get(config.logChannel) || undefined; // Prepare error log channel
                    await guildSettings.findById(msg.guild.id, async (e, doc) => {
                        if (e) {
                            console.error(e);
                            if (logChannel) logChannel.send(e);
                            return false;
                        }
                        if (doc == null) {
                            doc = await new guildSettings({
                                _id: msg.guild.id,
                                unknownCommandMsg: true,
                                dmOwner: true
                            });
                            await doc.save(e => {
                                if (e) {
                                    console.error(e);
                                    if (logChannel) logChannel.send(e);
                                }
                            });
                        }
                        if (doc.dmOwner === true) {
                            await owner.send(new Discord.RichEmbed()
                                .setColor("#ff2200")
                                .setDescription(`I'm missing the following permissions in **${msg.guild.name}**:\n\`• ${missing.join("\n• ")}\``)
                                .setFooter(`You can enable/disable these notifications by typing \`${defaultPrefix}set DMOwner\``)).catch(async () => {
                                    // Failing *that*, log it as a "stack trace" in the log channel of the instance owner
                                    const e = new Error("**DiscordPermissionsError:**\n") + new Error(`Unable to notify a server owner of missing permissions!\n\nMissing permissions in **${msg.guild.name}** (${msg.guild.id}):\n\`• ${missing.join("\n• ")}\`\n\nServer owner: ${owner.tag} (${owner.id})`);

                                    console.log(e);
                                    if (logChannel) logChannel.send(e);
                                });
                        } else {
                            // After all that, if the server owner has disabled DMing them for permissions errors, log the error in our log channel
                            const e = new Error("**DiscordPermissionsError:**\n") + new Error(`The server owner has disabled DMing them about missing permissions!\n\nMissing permissions in **${msg.guild.name}** (${msg.guild.id}):\n\`• ${missing.join("\n• ")}\`\n\nServer owner: ${owner.tag} (${owner.id})`);

                            console.log(e);
                            if (logChannel) logChannel.send(e);
                        }
                    });
                });
            return false; // We're inside the if block, so return false
        }
        else return true; // If nothing was missing (outside the if block), return true
    },

    // Traceback logging
    stackTrace: async (client, msg, e) => {
        const footer = `Sender: ${msg.author.tag} (${msg.author.id}) | ` + (msg.channel.type == "text" ? `Guild: ${msg.guild.id} | Channel: ${msg.channel.id}` : `DM with ${msg.author.tag} (${msg.author.id})`);

        console.error(`\n${new Date().toString()}\nAn error has occurred!\n${footer} | Message: ${msg.content}` + `\n${e.stack}`);
        try {
            if (config.logChannel) {
                const logChannel = await client.channels.get(config.logChannel);
                var embed = new Discord.RichEmbed().setColor("#ff2200");
                if (msg) {
                    if (msg.content.length > 256) {
                        embed.setTitle(msg.content.substring(0, 256 - 1) + "…");
                    }
                    else embed.setTitle(msg.content);
                    embed.setFooter(footer)
                }
                embed.description = "```js\n" + e.stack + "```"
                logChannel.send(embed);
            }
            return
        } catch (e) {
            console.error("Something went wrong and we couldn't log that error to the log channel because of the following error:\n" + e.stack)
        }
    }
}