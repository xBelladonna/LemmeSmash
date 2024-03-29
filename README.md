# LemmeSmash

LemmeSmash is a Discord bot that lets you put placeholder tags in your messages and replaces your message, swapping the tags out for randomly generated keysmashes. Why would anyone want this? Beats me, but it's been requested so [click here to invite it!](https://discordapp.com/oauth2/authorize?client_id=578591056866836490&scope=bot&permissions=536995904) There's also a [support server](https://discord.gg/N5cBcp3) should you have any other questions, have a suggestion, or have a bug to report.

The bot uses configurable keysmash tags and generates ISO Standard keysmashes using the characters `asdfghjkl` by default, or from a set of custom characters you choose.

The bot also helps you on your adventures by letting you make a different set of tags that transforms your message into OwOspeak (or just automatically, per-server, if you want that).

The bot has a lot of commands, but the big ones are:

- `ks;tags`
- `ks;autoproxy`
- `ks;charset`
- `ks;show`
- `ks;help`

The bot explains all of these commands once you invite it.
`ks;help` is the first command you're likely to use, on its own it shows the help menu and lists available commands, and when used with a command it brings up that command's information.
`ks;tags` is used to set your keysmash tags, both prefixes and suffixes are supported. The tags must be around the word `text`, i.e. `ks;tags $text` or `ks;tags [text]`.
`ks;autoproxy` just enables proxying of owospeak by default instead of having to set and use tags for it. Works per-server.

`ks;charset` is used to set your custom character set. The bot will remember this and use it each time you proxy a keysmash. Any letter, number or symbol is supported. Emoji are not supported as of yet.

`ks;show` simply shows your user info, your keysmash tags and your cuustom character set if you have one.

## Getting started!

1. Set a keysmash tag: `ks;tags #!text`
2. `[Optional]` Set a custom character set: `ks;charset asdfcvbn`
3. Post a message with your keysmash tags: `Here is a keysmash: #!`
Using a set of keysmash tags that you set, it will replace all instances of the tags with a randomly generated keysmash.
4. `[Bonus!]` You can also post a set of characters between your keysmash tags and the bot will use those to generate the keysmash instead: `Here is a one-time custom keysmash: #!sdjcbn`

----

## Running the bot yourself

The bot is written in JavaScript and uses a [MongoDB](https://www.mongodb.com/) database to store keysmash tags and custom character sets. It also takes a configuration file in JSON format that must be named `config.json`.

### With Docker

Running the bot is simple with Docker, this repository has a `docker-compose.yml` file ready to use:

1. Clone the repo: `git clone https://github.com/xBelladonna/LemmeSmash.git`
2. Create `config.json` in the same directory as `config.json.template` (see for the layout):
`cp config.json.template config.json`
3. Set bot token: `nano config.json # or vim, emacs, whatever you use`
4. Run the stack: `docker-compose up -d`

### Manually with Node.js

1. Clone the repo: `git clone https://github.com/xBelladonna/LemmeSmash.git`
2. Download and install dependencies: `npm install`
3. Create `config.json` in the same directory as `config.json.template` (see for the layout):
`cp config.json.template config.json`
1. Set bot token: `nano config.json`
2. Run a mongoDB database somewhere (i.e. localhost) and set the database URI in the config file (i.e. `mongodb://localhost`)
3. Run the bot: `npm start`

## Configuration

The bot uses a JSON file named `config.json` for configuration, the elements are explained below.

- `token` - Discord bot token from the [Discord Developer Portal](https://discordapp.com/developers/applications/)
- `db` - Database URI pointing to a mongoDB instance, formatted as `mongodb://ip:port/LemmeSmash`
- `defaultCharset` - The default set of characters the bot will use to generate keysmashes from
- `logChannel` - an optional element, the bot will post stack traces to this channel in case it encounters errors. Ensure this channel is private as Discord usernames and message contents are exposed here!
- `owner` - another optional element, takes a Discord Snowflake (user ID) as a string.
- `permissions` - this is an object containing all the permissions theh bot needs to work properly. You *can* remove some if you want but there's no guarantee the bot will work right. Uses standard discord.js flag notation, i.e. arrays as elements in on object.

----

### Enabling SSL encrypted communiation with the database

You can enable encrypted communication over SSL/TLS between mongoDB and this bot. This is completely optional and only recommended if you're going to expose the database's port on the host or otherwise make it accessible to others.

The code is ready, you just need to create a folder in this directory called `certificates` and put 3 files in there with these names:
  - Your server certificate - `mongodb.pem`
  - Your root CA certificate - `rootCA.pem`

In summary it should look like this:
  - `LemmeSmash`
    - `bot`
      - `commands`
    - `certificates`
      - `mongodb.pem`
      - `rootCA.pem`

After the folder structure is right, uncomment everything in `docker-compose.yml` and start the bot like normal.

If you're running the bot manually with your own mongo, you'll need to do the same thing as above except take those certificates and configure your mongo with them. I'm assuming you already know how to do this (or can learn how with Google) if you're reading this far down 😂

Take a look at the provided `mongod.conf`, it contains a configuration for TLS encryption at the top of the file.

----

## Dependencies

- `discord.js` >= 11.5.0
- `mongoose` >= 5.5.8

This project is under the Apache 2.0 Licence, found in `LICENCE`.
