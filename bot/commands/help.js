const Discord = require("discord.js");
const utils = require("../utils.js");
const config = require("../../config.json");


module.exports = {
    name: "help",
    aliases: ["h", "info", "invite"],
    description: "Shows my help card to help you get started",
    execute: async (client, msg, args) => {
        const commands = msg.client.commands; // Load commands into memory
        if (!args.length) { // If the command is issued on its own
            const flags = config.permissions.proxy.concat(config.permissions.commands); // Compile permission flags into a single array

            const inviteUrl = await client.generateInvite(flags); // Generate invite URL with proper permissions
            const githubUrl = "https://github.com/xBelladonna/LemmeSmash"; // GitHub repo

            // Basic info about the bot
            const infoMsg = `LemmeSmash is a Discord bot that lets you put placeholder tags in your messages and replaces your message, swapping the tags out for randomly generated keysmashes. Why would anyone want this? Beats me, but you'll be surprised how fun it can be.\nThe bot uses configurable keysmash tags and generates ISO Standard keysmashes using the characters \`${config.defaultCharset}\` by default, or from a set of custom characters you choose.`;

            const commandList = `The bot has the following commands available. Type \`${config.prefix}help [command name]\` to get info on a specific command.
            ${client.commands.map(command => `\`${config.prefix}${command.name}\` - ${command.description}`).join("\n")}`;

            // Quick how-to guide
            gettingStarted = `
            **1.** Set a keysmash tag: \`ks;tags $smash\`
            **2.** \`[Optional]\` Set a custom character set: \`ks; charset asdfcvbn\`
            **3.** Post a message with your keysmash tags: \`Here is a keysmash: $\`
            Using a set of keysmash tags that you set, it will replace all instances of the tags with a randomly generated keysmash.
            **4.** \`[Bonus!]\` You can also post a set of characters between your keysmash tags and the bot will use those to generate the keysmash instead: \`Here is a one-time custom keysmash: $sdjcbn\``;

            // Extra tips and tricks
            footnotes = "• **[Coming soon!]** You can also find out who sent a proxied message by reacting to it with ❓\n• **[Coming soon!]** You can delete proxied messages you sent by reacting to them with ❌";

            // Construct the embed to send
            let author = await client.user;
            let guildMember = await msg.guild.fetchMember(author);
            embed = utils.successEmbed()
                .setColor("#ffaa00")
                .setAuthor(guildMember != undefined ? `${guildMember.displayName} (${author.tag})` : author.tag, author.avatarURL, "https://nightshade.fun/keysmash/")
                .addField("About Me!", infoMsg)
                .addField("Getting Started:", gettingStarted)
                .addField("Commands", commandList)
                .addField("Other things", footnotes)
                .addField("Add me!", `[Click here to invite the the bot to your server!](${inviteUrl})`)
                .addField("See my code!", `[Click here to visit the GitHub repository!](${githubUrl})`)
                .setFooter(`Type \`${config.prefix}help [command name]\` to get info on a specific command!`);

            // Finally, yeet it into the channel
            return msg.channel.send(embed);
        }

        // Do the rest of the stuff if there are any arguments
        const data = [];
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(command => command.aliases && command.aliases.includes(name));

        if (!command) return msg.channel.send(utils.errorEmbed(`Unknown command \`${name}\`. For a list of commands, type \`${config.prefix} help\`, or just ping me!`));

        data.push(`**Name:** ${command.name}`);

        embed = utils.warnEmbed()
            .setFooter(`Type \`${config.prefix}help [command name]\` to get info on a specific command!`);
        embed.addField("Command:", command.name);
        if (command.aliases) embed.addField(`Aliases:`, `${command.aliases.join(', ')}`);
        if (command.description) embed.addField(`Description:`, `${command.description}`);
        if (command.usage) {
            usage = "";
            for (var i = 0; i < command.usage.length; i++) {
                if (i < command.usage.length && usage.length + `\n**${config.prefix}${command.name}  ${command.usage[i]}`.length > 1024) {
                    embed.addField("Usage:", usage);
                    usage = "";
                }
                usage += `\n**${config.prefix}${command.name}  ${command.usage[i]}`;
            }
            embed.addField("Usage:", usage);
        }
        if (command.example) embed.addField(`Example:`, `${config.prefix}${command.name} ${command.example}`);

        return msg.channel.send(embed);
    }
}