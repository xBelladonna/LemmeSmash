const Discord = require("discord.js");
const utils = require("../utils.js");
const config = require("../../config.json");
const defaultPrefix = config.prefix[0].toLowerCase();


module.exports = {
    name: "help",
    aliases: ["h", "info", "invite"],
    description: "Shows my help card to help you get started",
    execute: async (client, msg, args) => {
        const commands = msg.client.commands; // Load commands into memory
        if (!args.length) { // If the command is issued on its own
            const flags = config.permissions.proxy.concat(config.permissions.commands); // Compile permission flags into a single array

            const inviteUrl = await client.generateInvite(flags); // Generate invite URL with proper permissions
            const serverUrl = "https://discord.gg/N5cBcp3";
            const githubUrl = "https://github.com/xBelladonna/LemmeSmash"; // GitHub repo

            // Basic info about the bot
            const infoMsg = `LemmeSmash is a Discord bot that lets you put placeholder tags in your messages and replaces your message, swapping the tags out for randomly generated keysmashes. Why would anyone want this? Beats me, but you'll be surprised how fun it can be.\nThe bot uses configurable keysmash tags and generates ISO Standard keysmashes using the characters \`${config.defaultCharset}\` by default, or from a set of custom characters you choose.\n\nThe bot also helps you on your adventures by letting you make a different set of tags that transforms your message into OwOspeak (or just automatically, per-server, if you want that).`;

            // Construct command list and filter hidden commands >:3c
            const commandList = `The bot has the following commands available. Type \`${defaultPrefix}help [command name]\` to get info on a specific command.
            ${client.commands.filter(command => !command.hidden).map(command => `\`${defaultPrefix}${command.name}\` - ${command.description}`).join("\n")}`;

            // Quick how-to guide
            gettingStarted = `
            **1.** Set a keysmash tag: \`ks;tags $text\`
            **2.** \`[Optional]\` Set a custom character set: \`ks; charset asdfcvbn\`
            **3.** Post a message with your keysmash tags: \`Here is a keysmash $ isn't that neat?\`
            Using a set of keysmash tags that you set, it will replace all instances of the tags with a randomly generated keysmash.
            **4.** \`[Bonus!]\` You can also post a set of characters between your keysmash tags and the bot will use those to generate the keysmash instead: \`Here is a one-time custom keysmash: $sdjcbn\``;

            // Extra tips and tricks
            footnotes = "• You can also find out who sent a proxied message by reacting to it with ❓\n• You can delete proxied messages you sent by reacting to them with ❌";

            // Construct the embed to send
            let author = await client.user;
            let guildMember = msg.channel.type === "text" ? await msg.guild.fetchMember(author) : undefined;
            embed = utils.successEmbed()
                .setColor("#ffaa00")
                .setAuthor(guildMember != undefined ? `${guildMember.displayName} (${author.tag})` : author.tag, author.avatarURL, "https://nightshade.fun/keysmash/")
                .addField("About Me!", infoMsg)
                .addField("Getting Started:", gettingStarted)
                .addField("Commands", commandList)
                .addField("Other things", footnotes)
                .addField("Add me!", `[Click here to invite the the bot to your server!](${inviteUrl})`)
                .addField("Get help and support!", `[Click here to join the support server!](${serverUrl})`)
                .addField("See my code!", `[Click here to visit the GitHub repository!](${githubUrl})`)
                .setFooter(`Type \`${defaultPrefix}help [command name]\` to get info on a specific command!`);

            // Finally, yeet it into the channel
            return msg.channel.send(embed);
        }

        // Do the rest of the stuff if there are any arguments
        const data = [];
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(command => command.aliases && command.aliases.includes(name));

        if (!command) return msg.channel.send(utils.errorEmbed(`Unknown command \`${name}\`. For a list of commands, type \`${defaultPrefix} help\`, or just ping me!`));

        data.push(`**Name:** ${command.name}`);

        embed = utils.warnEmbed()
            .setFooter(`Type \`${defaultPrefix}help [command name]\` to get info on a specific command!`);
        embed.addField("Command:", command.name);
        if (command.aliases) embed.addField(`Aliases:`, `${command.aliases.join(', ')}`);
        if (command.description) embed.addField(`Description:`, `${command.description}`);
        if (command.usage) {
            usage = "";
            for (var i = 0; i < command.usage.length; i++) {
                if (i < command.usage.length && usage.length + `\n**${defaultPrefix}${command.name}  ${command.usage[i]}`.length > 1024) {
                    embed.addField("Usage:", usage);
                    usage = "";
                }
                usage += `\n**${defaultPrefix}${command.name}  ${command.usage[i]}`;
            }
            embed.addField("Usage:", usage);
        }
        if (command.example) embed.addField(`Example:`, `${defaultPrefix}${command.name} ${command.example}`);

        return msg.channel.send(embed);
    }
}