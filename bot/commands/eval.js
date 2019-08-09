const config = require("../../config.json");
const utils = require("../utils.js");

module.exports = {
    name: "eval",
    aliases: ["execute", "exec", "command", "cmd", "run"],
    description: "Executes raw JavaScript code. **Be extremely careful with this!**",
    hidden: true,
    usage: ["<JavaScript code here>**\nExecutes the message as is, and throws any errors/responses into the channel"],
    example: "msg.channel.send(\"Hello World!\");",
    execute: async (msg, args) => {
        /*
        ** WARNING: THIS METHOD EVALUATES MESSAGE CONTENT AS RAW JAVASCRIPT CODE!
        ** This means that, since node.js has access to your computer's hard drive, this
        ** command can be used to do anything that someone with physical access to your
        ** computer can do. You can accidentally wipe entire hard drives with this, and
        ** I ("the creator") am not responsible for anything that may go wrong from accidental
        ** or intentional misuse of this command.
        **
        ** With that said, this command is meant strictly for debugging problems without suffering downtime.
        ** Use it wisely and DO NOT do anything that would break the Discord Terms of Service.
        */

        const client = msg.client;

        if (msg.author.id == config.owner) {
            if (args.length === 0) return utils.errorEmbed(msg.channel.send("You need to provide code to evaluate!"));

            const code = args.join(" ");

            try {
                let evaled = await eval(code);

                if (typeof evaled !== "string")
                    evaled = await require("util").inspect(evaled); // turn objects into strings
                let response = sanitize(evaled); // Sanitize mentions from response

                if (response.length > 1024) { // Half the time the response is too big
                    // Log oversized responses o console
                    console.warn(`\nResult of eval at ${new Date().toString()}:\n${evaled}`);
                    // Then truncate response and notify the user
                    const notification = `Response is longer than 1024 characters! See console for full response.\n\n`;
                    response = notification + response.slice(0, 1024 - notification.length - 10); // We remove 10 extra chars to cover the codeblock markdown
                }
                msg.channel.send(utils.successEmbed()
                    .setTitle("Success!")
                    .addField("Input", `\`\`\`js\n${sanitize(code)}\n\`\`\``)
                    .addField("Response", `\`\`\`js\n${response}\n\`\`\``)
                );
            } catch (err) {
                err = sanitize(err);
                msg.channel.send(utils.errorEmbed()
                    .setTitle("Error!")
                    .addField("Input", `\`\`\`js\n${sanitize(code)}\n\`\`\``)
                    .addField("Response", `\`\`\`x1\n${err}\n\`\`\``)
                );
            }
        }
    }
};


// Sanitize mentions and code block markdown
function sanitize(string) {
    if (typeof string === "string")
        return string.replace(/`/g, "`\u200b").replace(/@/g, "@\u200b");
    else return string;
}