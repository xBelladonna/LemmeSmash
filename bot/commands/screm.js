const utils = require("../utils.js");

module.exports = {
    name: "screm",
    aliases: ["scream", "yell"],
    description: "Generates a **screm**",
    usage: [
        "**[character] [length]**\nProxies a scream of length specified (or a random length between 5 and 70 characters if one isn't given) with the character given or the letter `A` if not given.\nMaximum screm length of 70 characters to avoid excessive spam."
    ],
    examples: ["", "E", "70", "h 20"],
    execute: async (client, msg, args) => {
        let char;
        let length;
        let screm;

        if (args.length === 0) {
            char = "A";
            length = utils.randomValueBetween(5, 70);
        }

        else if (args.length === 1) {
            const _length = parseInt(args[0]);

            if (!isNaN(_length)) {
                char = "A";
                length = _length;
            }
            else {
                char = args[0];
                length = utils.randomValueBetween(5, 70);
            }
        }

        else {
            char = args[0];
            length = parseInt(args[1]);
        }

        if (char.length > 1) return await msg.channel.send(utils.errorEmbed("You have to give me one (1) character to screm *only*."));
        if (length === 0) return await msg.channel.send(utils.errorEmbed("Seriously? A zero-length screm?"));
        if (length <= 0) return await msg.channel.send(utils.errorEmbed("Seriously? A negative-length screm?"));
        if (length > 70) return await msg.channel.send(utils.errorEmbed("I'm not gonna screm more than 70 characters in a row."));

        console.log("char: ", char)
        console.log("length: ", length)

        screm = await generateScrem(char, length);
        console.log("screm: ", screm)
        await msg.channel.send(screm);
        await msg.delete(250);
    }
}


async function generateScrem(char, length) {
    if (char.length > 1) return utils.errorEmbed("You have to give me one (1) character to screm *only*.");
    if (length === 0) return utils.errorEmbed("Seriously? A zero-length screm?");
    if (length <= 0) return utils.errorEmbed("Seriously? A negative-length screm?");
    if (length > 70) return utils.errorEmbed("I'm not gonna screm more than 70 characters in a row.");

    return char.repeat(length);
}