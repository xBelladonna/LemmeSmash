const Discord = require("discord.js");
const config = require("../config.json");

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

    // Webhook getter
    getWebhook: async (client, channel) => {
        return new Promise(async resolve => {
            let webhooks = await channel.guild.fetchWebhooks();
            let hook;
            webhooks = webhooks.filter(hook => hook.channelID === channel.id);
            if (webhooks.find(hook => hook.owner.id === client.user.id) == null)
                hook = await channel.createWebhook("LemmeSmash");
            else hook = await webhooks.find(hook => hook.owner.id === client.user.id);
            return resolve(hook);
        }).catch(err => { throw err });
    },

    // Add escape character ("\") before any special characters that need escaping (using regex)
    escapeCharacters: string => {
        if (string == null) throw new TypeError("Empty input to escapeCharacters function!");
        return string.replace(/[.*_~`(> )-^$+?\/|()[\]{}\\]/gm, '\\$&'); // $& means the whole matched string
    },
    // Async function that waits for the given number of ms
    sleep: time => {
        return new Promise(resolve => {
            setTimeout(() => resolve(), time);
        });
    },

    attach: attachments => {
        if (attachments.size == 0) return undefined;
        let objectArray = []
        attachments.tap(attachment => {
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
            await msg.channel.send(`❌ I can't do that because I'm missing the following permissions:\n\`• ${missing.join("\n• ")}\``).catch(async () => {
                // Failing that, DM the server owner
                await owner.send(`I'm missing the following permissions in **${msg.guild.name}**:\n\`• ${missing.join("\n• ")}\``).catch(async () => {
                    // Failing *that*, log it as a "stack trace" in the log channel of the instance owner
                    const err = new Error("**DiscordPermissionsError:**\n") + new Error(`Unable to notify a server owner of missing permissions!\n\nMissing permissions in **${msg.guild.name}** (${msg.guild.id}):\n\`• ${missing.join("\n• ")}\`\n\nServer owner: ${owner.tag} (${owner.id})`);

                    const logChannel = await client.channels.get(config.logChannel)
                    console.log(err);
                    return logChannel.send(err);
                });
            });
            return false; // We're inside the if block, so return false
        }
        return true; // If nothing was missing (outside the if block), return true
    },

    // Traceback logging
    stackTrace: async (client, msg, err) => {
        try {
            if (config.logChannel) {
                const logChannel = await client.channels.get(config.logChannel);
                var embed = new Discord.RichEmbed().setColor("#ff2200");
                if (msg) {
                    var user = await client.fetchUser(msg.author.id)
                    if (msg.content.length > 256) {
                        embed.setTitle(msg.content.substring(0, 256 - 3) + "...")
                    } else embed.setTitle(msg.content)
                    embed.setFooter(`Sender: ${user.tag} (${user.id}) | Guild: ${msg.guild.id} | Channel: ${msg.channel.id}`)
                }
                embed.description = "```js\n" + err.stack + "```"
                logChannel.send(embed);
            }
            return
        } catch (e) {
            console.warn("Something went wrong, we couldn't log this error to the log channel because of the following error:\n" + e.stack)
        }
    }
}