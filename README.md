# LemmeSmash

LemmeSmash is a Discord bot that lets you put placeholder tags in your messages and replaces your message, swapping the tags out for randomly generated keysmashes. Why would anyone want this? Beats me, but it's been requested so [click here to invite it!](https://discordapp.com/oauth2/authorize?client_id=578591056866836490&scope=bot&permissions=536995904)

The bot uses configurable keysmash tags and generates ISO Standard keysmashes using the characters `asdfghjkl` by default, or from a set of custom characters you choose.

The bot has two commands:
  - `ks;tags`
  - `ks;charset`

`ks;tags` is used to set your keysmash tags, both prefixes and suffixes are supported. The tags must be around the word `smash`, i.e. `ks;tags $smash` or `ks;tags [smash]`.

`ks;charset` is used to set your custom character set. The bot will remember this and use it each time you proxy a keysmash. Any letter, number or symbol is supported. Emoji are not supported as of yet.

Setup is simple:
1. Set a keysmash tag: `ks;tags #!smash`
2. `[Optional]` Set a custom character set: `ks;charset asdfcvbn`
3. Post a message with your keysmash tags: `Here is a keysmash: #!`
Using a set of keysmash tags that you set, it will replace all instances of the tags with a randomly generated keysmash.
4. `[Bonus!]` You can also post a set of characters between your keysmash tags and the bot will use those to generate the keysmash instead: `Here is a one-time custom keysmash: #!sdjcbn`

## Running the bot yourself
The bot is written in JavaScript and uses a [mongoDB] database to store keysmash tags and custom character sets. It also takes a configuration file in JSON format that must be named `config.json`.

### With Docker
Running the bot is simple with Docker, this repository has a `docker-compose.yml` file ready to use:
1. Clone the repo: `git clone https://github.com/xBelladonna/LemmeSmash.git`
2. Create `config.json` in the same directory as `config-template.json` (see for the layout), and set bot token:
`cp config-template.json config.json`
3. Run the stack: `docker-compose up -d`

### Manually with Node.js
1. Clone the repo: `git clone https://github.com/xBelladonna/LemmeSmash.git`
2. Download and install dependencies: `npm install`
3. Create `config.json` in the same directory as `config-template.json` (see for the layout), and set bot token:
`cp config-template.json config.json`
4. Run a mongo database somewhere (i.e. localhost) and set the database URI in the config file (i.e. `mongodb://localhost`)
5. Run the bot: `npm start`

## Configuration
The bot uses a JSON file named `config.json` for configuration, the elements are explained below.
  - `token` - Discord bot token from the [Discord Developer Portal](https://discordapp.com/developers/applications/)
  - `db` - Database URI pointing to a mongoDB instance, formatted as `mongodb://ip:port/LemmeSmash`
  - `defaultCharset` - The default set of characters the bot will use to generate keysmashes from
  - `logChannel` - an optional element, the bot will post stack traces to this channel in case it encounters errors. Ensure this channel is private as Discord usernames and message contents are exposed here!

# Dependencies
  - `discord.js` >= 11.5.0
  - `mongoose` >= 5.5.8

This project is under the Apache 2.0 Licence, found in `LICENCE`.