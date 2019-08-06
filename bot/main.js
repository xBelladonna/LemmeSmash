const Discord = require("discord.js");
const config = require("../config.json");
const utils = require("./utils.js");
const fs = require("fs");
const proxy = require("./proxy.js")
const mongoose = require("mongoose");

console.warn("Starting LemmeSmash...\n");
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
    console.log(`Connected to database on ${config.db}\n`);
});

const schemas = require("./schemas.js"); // Load db schemas into memory
const guildSettings = mongoose.model("guildSettings", schemas.guildSettings); // Create guildSettings model

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
    console.log(`Connected to ${client.channels.size} ` + `${client.channels.size == 1 ? "channel" : "channels"}` + ` in ${client.guilds.size} ` + `${client.guilds.size == 1 ? "server" : "servers"}`);
    setPresence();
});

client.on("warn", info => console.warn(`\n${new Date().toString()}\n${info}`));
client.on("reconnecting", () =>
    console.warn(`\n${new Date().toString()}\nLost connection to the Discord gateway!\nAttempting to resume the websocket connection...`));
client.on("resume", () => console.log(`\n${new Date().toString()}\nSuccessfully resumed websocket connection!`));

client.on("guildCreate", () => {
    setPresence();
    console.log(`\n${new Date().toString()}\n${client.user.tag} has been added to a guild!\nNow connected to ${client.channels.size} ` + `${client.channels.size == 1 ? "channel" : "channels"}` + ` in ${client.guilds.size} ` + `${client.guilds.size == 1 ? "server" : "servers"}`);
});
client.on("guildDelete", () => {
    setPresence();
    console.log(`\n${new Date().toString()}\n${client.user.tag} has been removed from a guild :(\nNow connected to ${client.channels.size} ` + `${client.channels.size == 1 ? "channel" : "channels"}` + ` in ${client.guilds.size} ` + `${client.guilds.size == 1 ? "server" : "servers"}`);
});

// Handle reaction events
const reactions = require('./reactions.js');
reactions.execute(client);

// Respond to messages
client.on("message", async msg => {
    if (msg.author.bot) return; // Ignore messages from other bots
    if (!msg.content.startsWith(config.prefix) && !msg.content.startsWith(client.user))
        return proxy.execute(client, msg); // Proxy messages first, if applicable
    // Then execute any commands the user issued
    let args;

    // Detect pings and set args accordingly
    if (msg.isMentioned(client.user)) {
        args = msg.content.slice(`<@${client.user.id}> `.length).split(/ +/);
        if (args[0] == "") args[0] = "help"; // We set the first arg to "help" if there are no args (i.e. a ping on its own)
    } else args = msg.content.slice(config.prefix.length).split(/ +/); // Set args according to prefix if msg doesn't start with a ping

    // Check permissions (if not in DMs)
    if (msg.channel.type === "text" && !await utils.ensurePermissions(client, msg, config.permissions.commands))
        return;

    // Parse commands and arguments
    let commandName = args.shift();
    if (!commandName) commandName = args.shift();
    if (!commandName) return;
    commandName = commandName.toLowerCase();

    const command = await client.commands.get(commandName) || await client.commands.find(command => command.aliases && command.aliases.includes(commandName));
    // Notify the user if the command was invalid (if the notification is enabled for that guild)
    if (msg.channel.type === "text") {
        let unknownCommandMsg;
        await guildSettings.findById(msg.guild.id, async (err, doc) => {
            if (doc == null || doc.unknownCommandMsg === true) unknownCommandMsg = true;
            else if (doc.unknownCommandMsg === false) unknownCommandMsg = false;
        });
        if (!command && unknownCommandMsg === true)
            return msg.channel.send(utils.errorEmbed(`Unknown command \`${commandName}\`. For a list of commands, type \`${config.prefix}help\`, or just ping me!`));
        else if (!command && unknownCommandMsg === false) return;
    }
    else if (!msg.channel.type === "text") {
        if (!command) return msg.channel.send(utils.errorEmbed(`Unknown command \`${commandName}\`. For a list of commands, type \`${config.prefix}help\`, or just ping me!`));
    }

    // Execute command
    try {
        await command.execute(client, msg, args);
    } catch (err) { // Catch any errors
        console.error(err.stack); // Log error to console
        msg.channel.send(utils.errorEmbed("Encountered an error while trying to execute that command!")); // Notify the user
        utils.stackTrace(client, msg, err); // Then log the stack trace to the log channel if configured
    }
});

// Finally, login with the configured token
client.login(config.token);

// Graceful exit
process.on("SIGINT", gracefulExit)
process.on("SIGTERM", gracefulExit)



// Set bot user presence status
async function setPresence() {
    client.user.setActivity(client.guilds.size <= 1 ? `ks;help` : `ks;help | in ${client.guilds.size} servers`, { type: "PLAYING" });
}

// Log out of Discord and exit gracefully
function gracefulExit() {
    console.warn("\nGracefully shutting down...");
    client.destroy();
    console.warn("Goodbye!\n");
    process.exit();
}