const Discord = require("discord.js");
const utils = require("../utils.js");
const config = require("../../config.json");
const defaultPrefix = config.prefix[0].toLowerCase();


module.exports = {
    name: "help",
    aliases: ["h", "info", "help me"],
    description: "Shows my help card to help you get started",
    execute: async (client, msg, args) => {
        const commands = msg.client.commands; // Load commands into memory
        const embed = utils.warnEmbed().setFooter(`Type \`${defaultPrefix}help [command name]\` to get info on a specific command!`); // Prepare our embed card

        let commandWasGiven = false;
        let command;

        // Parse arguments and look for valid commands to return help on
        await new Promise(async (resolve, reject) => {
            let i = 0;
            let candidate;

            for (let commandName of args) {
                commandName = commandName.toLowerCase();
                candidate = await commands.get(commandName) || commands.find(command => command.aliases && command.aliases.includes(commandName));
                i++
                if (candidate) break;
            }

            if (!candidate) return reject(true);
            args = args.slice(i);
            resolve(command = candidate);
        }).catch(reason => {
            if (reason === true) commandWasGiven = reason;
        });

        // If we found a valid command somewhere, show that command's specific help card
        if (command) {
            embed.addField("Command:", command.name);
            if (command.aliases) embed.addField("Aliases:", `${command.aliases.join(", ")}`);
            if (command.description) embed.addField("Description:", `${command.description}`);
            if (command.usage) {
                let usage = "";
                for (let i = 0; i < command.usage.length; i++) usage += `\n**${defaultPrefix}${command.name}**  ${command.usage[i]}`;
                //command.usage.forEach()
                embed.addField("Usage:", usage);
            }
            if (command.examples) {
                let example = "";
                command.examples.forEach(element => example += `\n${defaultPrefix}${command.name} ${element}`);
                embed.addField(command.examples.length > 1 ? "Examples:" : "Example:", example);
            }

            return msg.channel.send(embed);
        }

        // If the user gave parameters but none of them matched valid commands, we taunt them uh I mean help them out
        if (commandWasGiven) embed.setDescription("Having trouble? Don't worry I gotchu, here's everything to get you started:");

        // Otherwise just continue and yeet the generic help card at the user
        const serverUrl = "https://discord.gg/N5cBcp3";
        const githubUrl = "https://github.com/xBelladonna/LemmeSmash"; // GitHub repo
        const autosmashUrl = "https://nightshade.fun/keysmash/"; // Website that started it all

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
        footnotes = `• You can also find out who sent a proxied message by reacting to it with ❓\n• You can delete proxied messages you sent by reacting to them with ❌`;

        // Construct the embed to send
        let author = await client.user;
        let guildMember = msg.channel.type === "text" ? await msg.guild.fetchMember(author) : false;
        embed.setAuthor(guildMember ? `${guildMember.displayName} (${author.tag})` : author.tag, author.avatarURL)
            .addField("About Me!", infoMsg)
            .addField("Getting Started", gettingStarted)
            .addField("Commands", commandList)
            .addField("Other things", footnotes)
            .addField("Visit the website!", `This bot's keysmash features also come in [website form as well as a desktop app you can download](${autosmashUrl}) there! Beats me why you'd want to but it's free for all!`)
            .addField("Get help and support!", `[Click here to join the support server!](${serverUrl})`)
            .addField("See my code!", `[Click here to visit the GitHub repository!](${githubUrl})`);

        // Finally, yeet it into the channel
        return msg.channel.send(embed);
    }
}