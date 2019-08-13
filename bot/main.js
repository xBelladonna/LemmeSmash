const Discord = require("discord.js");
const config = require("../config.json");
const utils = require("./utils.js");
const reactions = require('./reactions.js');
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
const files = fs.readdirSync("./bot/commands").filter(file => file.endsWith(".js"));
for (const file of files) {
    const command = require(`./commands/${file}`);
    // Set the command with the "name" key as the command name and the value as the entire module export
    client.commands.set(command.name, command)
}

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
reactions.execute(client);

// Respond to messages
client.on("message", async msg => {
    if (msg.author.bot) return; // Ignore messages from other bots
    const mention = new RegExp(`^\s*<@[!&]?${client.user.id}>\s*`);
    if (!msg.content.startsWith(config.prefix) && !mention.test(msg.content)) {
        try {
            return await proxy.execute(client, msg); // Proxy messages first, if applicable
        } catch (e) { // Catch any errors
            msg.channel.send(utils.errorEmbed("Encountered an error while trying to proxy that message!")); // Notify the user
            return utils.stackTrace(client, msg, e); // Then log the stack trace to the console and log channel if configured
        }
    }

    // Then execute any commands the user issued
    let args;

    // Detect pings and set args accordingly
    if (mention.test(msg.content)) {
        args = msg.content.replace(mention, "").split(/ +/);
        if (args.length === 1 && args[0] === "") args[0] = "help"; // We set the first arg to "help" if there are no args (i.e. a ping on its own)
    }
    else if (msg.content.startsWith(config.prefix))
        args = msg.content.slice(config.prefix.length).split(/ +/); // Set args according to prefix if msg doesn't start with a ping
    else return; // Just do nothing if the message doesn't start with ping or prefix

    // Check permissions (if not in DMs)
    if (msg.channel.type === "text" && !await utils.ensurePermissions(client, msg, config.permissions.commands))
        return;

    // Parse commands and arguments
    let commandName;
    do {
        commandName = args.shift();
    } while (!commandName && args.length > 0);
    if (!commandName) return;
    commandName = commandName.toLowerCase();

    try {
        const command = await client.commands.get(commandName) || await client.commands.find(command => command.aliases && command.aliases.includes(commandName));
        // Notify the user if the command was invalid
        if (!command) {
            let notification = `Unknown command \`${commandName}\`. For a list of commands, type \`${config.prefix}help\`, or just ping me!`;
            if (notification.length > 2048) notification = utils.warnEmbed("That's not funny.");
            else notification = utils.errorEmbed(notification);

            if (msg.channel.type === "text") { // In guilds
                let unknownCommandMsg = true;

                await guildSettings.findById(msg.guild.id).then(doc => { // Get guild settings
                    if (doc != null && doc.unknownCommandMsg === false) unknownCommandMsg = false;
                });

                if (unknownCommandMsg === true) return msg.channel.send(notification);
            }
            else if (msg.channel.type !== "text") return msg.channel.send(notification);
        }

        // Execute command if it exists
        await command.execute(client, msg, args);
    } catch (e) {
        msg.channel.send(utils.errorEmbed("Encountered an error while trying to execute that command!")); // Notify the user
        utils.stackTrace(client, msg, e); // Then log the stack trace to the console and log channel if configured
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