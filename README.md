# LVM Discord bot
**La Vida Moderna sounds Discord bot**

**_Using discord.js@12.0.0-dev version to solve an issue when playing sounds: https://github.com/discordjs/discord.js/issues/2546_**

[![Build Status](https://travis-ci.org/jsirgo/lvm-discord-bot.svg?branch=master)](https://travis-ci.org/jsirgo/lvm-discord-bot)

This bot joins to a voice channel and plays sounds extracted from La Vida Moderna.

This project is based on [dmcallejo/lavidamoderna_bot](https://github.com/dmcallejo/lavidamoderna_bot) and [Xatpy/SoundsTable](https://github.com/Xatpy/SoundsTable) and the sounds have been obtained from those projects.

This code is only intended to work in a private bot, it is not suitable to work for multiple discord servers with a single bot.

## Commands
* **?help** - Shows the command list
* **?play {0}** - Search a sound by {0} word and plays it in the user voice channel
* **?send {0},{1}** - Search a sound by {0} word, joins to {1} voice channel and plays the sound
* **?random {0}** - Joins to {0} voice channel and plays a random sound

## Requirements
Node.js
FFMPEG

### Install node dependencies
Install dependencies:
```shell
npm install
```

### Set up bot configuration
1. Create a config.json in src/config/ with the following content:
```json
{
    "token": "BOT_TOKEN"
}
```
Replace BOT_TOKEN with the one you get from the Discord Developer Portal.

### Set up bot configuration
To get sounds from [dmcallejo/lavidamoderna_bot](https://github.com/dmcallejo/lavidamoderna_bot) execute get-sounds.sh:
```shell
./get-sounds.sh
```

### Build and run
Build the code:
```shell
npm run build
```
Run the bot:
```shell
npm start
```

## Docker
### Run docker container
To build the image (Replace BOT_TOKEN with the one you get from the Discord Developer Portal):
```shell
docker build --build-arg token=BOT_TOKEN -t lvm-discord-bot .
```
To run the docker container:
```shell
docker run -d lvm-discord-bot
```

### Add bot to discord server
Replace the {CLIENT_ID} in the url with the application client id from the Discord Developer Portal and open the url:
https://discordapp.com/oauth2/authorize?client_id={CLIENT_ID}&scope=bot&permissions=6144
