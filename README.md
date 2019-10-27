# Sound Discord bot

[![Build Status](https://travis-ci.org/jsirgo/sound-discord-bot.svg?branch=develop)](https://travis-ci.org/jsirgo/sound-discord-bot)

**_Using discord.js@12.0.0-dev version to solve an issue when playing sounds: https://github.com/discordjs/discord.js/issues/2546_**

This project is based on [Xatpy/SoundsTable](https://github.com/Xatpy/SoundsTable) and [dmcallejo/lavidamoderna_bot](https://github.com/dmcallejo/lavidamoderna_bot). Sounds and data.json files of the last one are compatible with this bot, see below how to configure this bot.

This code is only intended to work in a private bot, it is not suitable to work for multiple discord servers with a single bot.

## Commands
* **?help** or **?h** - Shows the command list.
* **?play {0}** or **?p {0}** - Search a sound by {0} word and plays it in the user voice channel, If no word is passed (Only ?play or ?p), plays a random sound.
* **?playchannel {0},{1}** or **?pc {0},{1}** - Joins to voice channel {0} and plays {1} sound, if no sound passed (Only ?play {0} or ?p {0}) plays a random one.
* **?list** or **?l** - Lists available sounds.
* **?trollOn {0},{1},{2},{3}** - (Only admins) Enables Troll Mode, bot will enter in a random moment in a random or given channel to play a random sound.
    - **{0}** minTime: Min time in minutes to the bot to check if it has to play a sound again
    - **{1}** maxTime: Max time to check if it has to to play a sound again
    - **{2}** hitChance: Number from 0 to 1 to set the probability play the sound
    - **{3}** channelMode: Could be 'all' to play the sound in all channels, 'random' to do it in a random channel or the name of a certain channel, only joins to a channel and plays the sound if the channel is not empty.

    Bot will generate a time in minutes randomly between minTime and maxTime in order to schedule the next moment to check to play the sound. The sound cand be played or not depending on the hitChance in the scheduled moment, and will continue scheduling executions until ?trollOff is called.
* **?trollOff** - (Only admins) Disable Troll Mode.
* **?refresh** - (Only admins) Reloads sounds configuration.
* **?add** - (Only admins) Starts a dialog to add a new sound, type 'cancel' in any of the steps to stop the process.

## Bot set up and needed steps
Needed steps for both running with or without Docker
* Include sounds in resources/sounds and create data.json in resources with the data of the sound files. [More details here](resources/README.md)

## Install and run using Node
### Requirements
* Node.js
* FFMPEG installed in the system

### Set up Discord bot token
Create a config.json in src/config/ with the following content:
```json
{
    "token": "BOT_TOKEN"
}
```
Replace BOT_TOKEN with the one you get from the Discord Developer Portal.

### Set up Discord bot command symbol (Optional)
Bot command symbol can be customized setting a new property "botSymbol" in the json file (In the following example it will set as symbol % instead of ?):
```json
{
    ...
    "botSymbol": "%"
    ...
}
```

### Enable bot webservices (Optional)
If you want to enable bot webservice to be able to interact with the bot from other applications, add the following new properties in the config json file:
```json
{
    ...
    "wsenabled": true,
    "tokenkey": "your-secret-key-for-auth-token",
    "wsusers": [
        {
            "username": "user",
            "password": "pass"
        }
    ]
    ...
}
```
Where wsusers will be the users able to access to the webservices
#### Enable https webservices (Optional)
To enable the access to the webservices through https you should also add the following properties:
```json
{
    ...
    "sslenabled": true,
    "certkey": "your-cert-key"
    ...
}
```
And have placed your cert.pem and key.pem files in the project root path.

### Install node dependencies
Install dependencies:
```shell
npm install
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
Before building the image is needed to do the steps described in **"Bot set up and needed steps"**

### Run docker container
To build the image (Replace BOT_TOKEN with the one you get from the Discord Developer Portal):
```shell
docker build --build-arg token=BOT_TOKEN -t sound-discord-bot .
```
Bot command symbol can be customized passing symbol build arg (In the following example it will set as symbol % instead of ?):
```shell
docker build --build-arg token=BOT_TOKEN --build-arg symbol=% -t sound-discord-bot .
```
To run the docker container:
```shell
docker run -d sound-discord-bot
```
Append *-p 53134:53134* to *docker run* if running the webservices.
#### Other build args accepted
* wsenabled="true" in order to enable the bot webservices (Default false)
* sslenabled="true" in order to enable https access to the bot webservices (Default false)
* username="admin" to change the webservices username (Default admin)
* password="soundbot" to change the webservices password (Default soundbot)

### Add bot to discord server
Replace the {CLIENT_ID} in the url with the application client id from the Discord Developer Portal and open the url:
https://discordapp.com/oauth2/authorize?client_id={CLIENT_ID}&scope=bot&permissions=6144
