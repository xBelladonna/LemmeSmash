const Discord = require("discord.js");
const config = require("../config.json");
const utils = require("./utils.js");
const fs = require("fs");
const proxy = require("./proxy.js")
const mongoose = require("mongoose");

// Load array of required bot permission flags into memory
const permissions = {
    "commands": [
        "VIEW_CHANNEL",
        "READ_MESSAGE_HISTORY",
        "SEND_MESSAGES",
        "ADD_REACTIONS"
    ],
    "proxy": [
        "MANAGE_WEBHOOKS",
        "MANAGE_MESSAGES"
    ]
};

console.warn("Starting LemmeSmash...");
console.warn("Connecting to database...");

// Connect to the db
mongoose.connect(config.db, {
    useNewUrlParser: true,
    reconnectTries: 20, // Attempt to reconnect 20 times
    reconnectInterval: 3000 // Wait 3 seconds before retrying, for a total reconnection time limit of 60 seconds
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection error:"));
db.once("open", () => {
    console.log(`Connected to database on ${config.db}`);
});

const schemas = require("./schemas.js"); // Load db schemas into memory
const user = mongoose.model("user", schemas.user); // Create user model

// Instantiate Discord client
const client = new Discord.Client();
client.commands = new Discord.Collection(); // Create a Collection
// Set commands in the Collection
new Promise(resolve => {
    const files = fs.readdirSync("./bot/commands").filter(file => file.endsWith(".js"));
    for (const file of files) {
        const command = require(`./commands/${file}`);
        // Set the command with the "name" key as the command name and the value as the entire module export
        client.commands.set(command.name, command)
    }
    resolve();
});

// Respond to various Discord events
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag} (ID: ${client.user.id})`);
    console.log(`Connected to ${client.channels.size} channels in ${client.guilds.size} servers`);
    setPresence();
});

client.on("reconnecting", () => console.warn("Lost connection to the Discord gateway!\nAttempting to resume the websocket connection..."));

client.on("guildCreate", setPresence);
client.on("guildDelete", setPresence);

// Respond to messages
client.on("message", async msg => {
    if (msg.author.bot) return; // Ignore messages from other bots
    if (!msg.content.startsWith(config.prefix)) return proxy.execute(client, msg); // Proxy messages first, if applicable
    // Then execute any commands the user issued
    if (!(msg.content.startsWith(config.prefix) || msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}>`))) return; // Do nothing if the message doesn't start with the prefix or a ping

    // Get command arguments from message contents
    let args;
    // Detect pings and set args accordingly
    if (msg.content.startsWith(`<@${client.user.id}>`)) {
        args = msg.content.slice(`<@${client.user.id}> `.length).split(/ +/);
        if (args[0] == null) args[0] = "help"; // We set the first arg to "help" if there are no args (i.e. a ping on its own)
    }
    // This section is because discord prefixes user IDs in pings with "!" if the user is nicknamed
    else if (msg.content.startsWith(`<@!${client.user.id}>`)) {
        args = msg.content.slice(`<@!${client.user.id}> `.length).split(/ +/);
        if (args[0] == null) args[0] = "help";
    }
    // Set args according to prefix if msg doesn't start with a ping
    else args = msg.content.slice(config.prefix.length).split(/ +/);

    // Check permissions and notify if we don't have the ones we need
    let currentPerms = await msg.channel.permissionsFor(client.user);
    let missing = [];
    permissions.commands.forEach(flag => {
        if (!currentPerms.has(flag)) missing.push(flag)
    });
    if (missing.length > 0) {
        let owner = await client.fetchUser(msg.guild.owner);
        // Notify the user if there's missing permissions
        if (!missing.includes("SEND_MESSAGES")) return msg.channel.send(`I'm missing the following permissions: \n${missing.join("\n")}`)
        // Failing that, DM the server owner
        else return owner.send(`I'm missing the following permissions in **${msg.guild.name}**:\n${missing.join("\n")}`)
            .catch(err => { // Failing *that*, log it as a "stack trace" in the log channel of the instance owner
                return utils.stackTrace(client, msg, new Error("Unable to notify a server owner of missing permissions!\n") + new Error(`Missing permissions in ${msg.guild.name} (${msg.guild.id}):\n${missing.join("\n")}\n\nServer owner: ${owner.tag} (${owner.id})`))
            });
    }

    // Parse commands and arguments
    let commandName = args.shift();
    if (!commandName) commandName = args.shift();
    if (!commandName) return;
    commandName = commandName.toLowerCase();

    const command = await client.commands.get(commandName) || await client.commands.find(command => command.aliases && command.aliases.includes(commandName));
    // Notify the user if the command was invalid
    if (!command) return msg.channel.send(utils.errorEmbed(`Unknown command \`${commandName}\`. For a list of commands, type \`${config.prefix} help\`, or just ping me!`))

    // Execute command
    try {
        await command.execute(client, msg, args);
    } catch (err) { // Catch any errors
        console.error(err.stack); // Log error to console
        msg.channel.send(utils.errorEmbed("Encountered an error while trying to execute that command!")); // Notify the user
        utils.stackTrace(client, msg, err); // Then log the stack trace to the log channel if configured
    }
});

// Handle reactions
// TODO: Create db schema to store message IDs so we can delete and query messages
/*
client.on("messageReactionAdd", async (react, user) => {
    switch (react.emoji.name) {
        case "❌":
            return deleteMessage(react, user, client);

        default:
            break;
    }
});
*/


// Finally, login with the configured token
client.login(config.token);

// Graceful exit
process.on("SIGINT", gracefulExit)
process.on("SIGTERM", gracefulExit)



// Set bot user presence status
async function setPresence() {
    if (client.guilds.size < 2) {
        client.user.setActivity(`Mention me for help!`, { type: "PLAYING" });
    }
    else {
        client.user.setActivity(`Annoy Bella for help! | in ${client.guilds.size} servers`, { type: "PLAYING" });
    }
}

// Log out of Discord and exit gracefully
function gracefulExit() {
    console.warn("\nGracefully shutting down...");
    client.destroy();
    console.warn("Goodbye!");
    process.exit();
}