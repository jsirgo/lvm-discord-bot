# LVM Discord bot
**La Vida Moderna sounds Discord bot**

**_Using discord.js@12.0.0-dev version to solve an issue when playing sounds: https://github.com/discordjs/discord.js/issues/2546_**

[![Build Status](https://travis-ci.org/jsirgo/lvm-discord-bot.svg?branch=master)](https://travis-ci.org/jsirgo/lvm-discord-bot)

This bot joins to a voice channel and plays sounds extracted from La Vida Moderna.

This project is based on [dmcallejo/lavidamoderna_bot](https://github.com/dmcallejo/lavidamoderna_bot) and [Xatpy/SoundsTable](https://github.com/Xatpy/SoundsTable) and the sounds have been obtained from those projects.

This code is only intended to work in a private bot, it is not suitable to work for multiple discord servers with a single bot.

## Commands
* **?help** or **?h** - Shows the command list
* **?play {0}** or **?p {0}** - Search a sound by {0} word and plays it in the user voice channel, If no word is passed (Only ?play or ?p), plays a random sound
* **?playchannel {0},{1}** or **?pc {0},{1}** - Joins to voice channel {0} and plays {1} sound, if no sound passed (Only ?play {0} or ?p {0}) plays a random one
* **?trollOn {0},{1},{2},{3}** - Enables Troll Mode, bot will enter in a random moment in a random or given channel to play a random sound.
    - **{0}** minTime: Min time in minutes to the bot to check if it has to play a sound again
    - **{1}** maxTime: Max time to check if it has to to play a sound again
    - **{2}** hitChance: Number from 0 to 1 to set the probability play the sound
    - **{3}** channelMode: Could be 'all' to play the sound in all channels, 'random' to do it in a random channel or the name of a certain channel, only joins to a channel and plays the sound if the channel is not empty.

    Bot will generate a time in minutes randomly between minTime and maxTime in order to schedule the next moment to check to play the sound. The sound cand be played or not depending on the hitChance in the scheduled moment, and will continue scheduling executions until ?trollOff is called.
* **?trollOff** - Disable Troll Mode

## Requirements
* Node.js
* FFMPEG

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
