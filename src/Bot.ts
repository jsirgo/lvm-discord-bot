import Discord, { Message, VoiceChannel } from "discord.js";
import Config from './config/config.json';
import Data from './config/data.json';
import Schedule, { Job } from 'node-schedule';

export class Bot {

    private readonly SOUNDS_PATH:string = "resources/sounds/";
    private readonly TROLL_MODE_ALL:string = "all"
    private readonly TROLL_MODE_RANDOM:string = "random"

    private client:Discord.Client;
    private isBussy:boolean = false;
    private isTrollModeOn:boolean = false;

    private scheduledTrollExecution:Job;

    constructor () {
        this.client = new Discord.Client();

        this.client.on("ready", () => console.log("Connected"));

        this.client.on("message", (message: Message) => this.onMessage(message));

        this.client.on("error", (error) => console.log("Error: "+error));
    }

    public start() {
        console.log("Login...");
        this.client.login(Config.token);
    }

    private onMessage(message: Message) {
        if (message.content.charAt(0) === "?") {
            if(!this.isBussy){
                let match = message.content.match(/^\?(?<command>\w*)( (?<params>.*))?/)
                let cmd = match.groups['command'];
                if(cmd != null){
                    let args = match.groups['params'];
                    switch(cmd) {
                        case "help":
                        case "h":
                            this.sendHelpMessage(message);
                            break;
                        case "play":
                        case "p":
                            this.play(args, message);
                            break;
                        case "playchannel":
                        case "pc":
                            this.playChannel(args, message);
                            break;
                        case "trollOn":
                            this.trollMode(args, message);
                            break;
                        case "trollOff":
                            this.trollModeOff();
                            break;
                        default:
                            this.sendHelpMessage(message);
                            break;
                    }
                }
            }else{
                message.channel.send("Wait and retry later, now I´m bussy");
            }
        }
    }

    private sendHelpMessage(message:Message) {
        message.channel.send("Help:"
            +"\n**?play {0}** - Search a sound by {0} word and plays it in the user voice channel, If no word is passed (Only ?play or ?p), plays a random sound. Shortening: **?p {0}**"
            +"\n**?playchannel {0},{1}** - Joins to voice channel {0} and plays {1} sound, if no sound passed (Only ?play {0} or ?p {0}) plays a random one. Shortening: **?pc {0},{1}**");
    }

    private async play(soundName:string, message:Message) {
        if(message.member.voice != null && message.member.voice.channel != null) {
            let soundUrl = soundName != null && soundName.length > 0 ? this.getSound(soundName) : this.getRandomSound();
            if(soundUrl != null) {
                this.joinChannelAndPlaySound(soundUrl, message.member.voice.channel);
            }else{
                message.channel.send("Sound not found");
            }
        }else{
            message.channel.send("You are not connected to a voice channel");
        }
    }

    private async playChannel(args:string, message:Message) {
        if(args != null) {
            let params = args.split(",");
            if(params[0] != null && params[0].length > 0) {
                let voiceChannel = this.getChannel(params[0]);
                if(voiceChannel == null) {
                    message.channel.send("Channel not found");
                    return;
                }
                let soundUrl = params[1] != null && params[1].length > 0 ? this.getSound(params[1]) : this.getRandomSound();
                if(soundUrl != null) {
                    this.joinChannelAndPlaySound(soundUrl, voiceChannel);    
                }else{
                    message.channel.send("Sound not found");
                }
            }else{
                this.sendHelpMessage(message);
            }
        }else{
            this.sendHelpMessage(message);
        }
    }

    private getChannel(channelName:string):VoiceChannel {
        let channels = this.client.channels.filter(channel => channel instanceof VoiceChannel && channel.name.toLowerCase().includes(channelName.toLowerCase()));
        if(channels.size === 1){
            return <VoiceChannel>channels.first();
        }else{
            return null;
        }
    }

    private getSound(soundName:string) {
        let matchSounds = Data.sounds.filter(sound => sound.tags.toLowerCase().includes(soundName.toLowerCase()));
        if(matchSounds != null && matchSounds.length > 0){
            if(matchSounds.length == 1){
                let sound = matchSounds[0];
                return this.SOUNDS_PATH + sound.filename;
            }else{
                let size = matchSounds.length;
                let randomIndex = Math.floor(Math.random() * size)
                let sound = matchSounds[randomIndex];
                return this.SOUNDS_PATH + sound.filename;
            }
        }
        return null;
    }

    private getRandomSound() {
        let size = Data.sounds.length;
        let randomIndex = Math.floor(Math.random() * size)
        let sound = Data.sounds[randomIndex];
        return this.SOUNDS_PATH + sound.filename;
    }

    private joinChannelAndPlaySound(soundUrl:string, voiceChannel:VoiceChannel) {
        voiceChannel.join().then(connection => {
            this.isBussy = true;
            connection.play(soundUrl , {
                volume: 1, 
                passes: 3
            }).on('end', () => {
                this.isBussy = false;
                connection.disconnect();
            }).on('error', (error) => {
                this.isBussy = false;
                console.log("Error: "+error);
            });
        });
    }

    private trollMode(args:string, message:Message) {
        if(args != null) {
            let params = args.split(",");
            if(params.length == 4 && !isNaN(Number(params[0])) && !isNaN(Number(params[1])) && !isNaN(Number(params[2]))) {
                console.log("Troll mode on: "+params[0]+", "+params[1]+", "+params[2]+", "+params[3]+" by "+message.author.username);
                this.isTrollModeOn = true;
                this.doTroll(Number(params[0]), Number(params[1]), Number(params[2]), params[3]);
            }else{
                this.sendHelpMessage(message);
            }
        }else{
            this.sendHelpMessage(message);
        }   
    }

    private trollModeOff() {
        this.isTrollModeOn = false;
        this.scheduledTrollExecution.cancel();
        console.log("Troll mode off");
    }

    private doTroll(minTime:number, maxTime:number, hitChance:number, channelMode:string) {
        if(this.isTrollModeOn) {
            if(Math.random() <= hitChance){
                let channels = this.getTrollChannels(channelMode);
                channels.forEach((channel) => {
                    console.log("Playing sound in: " + channel.name);
                    this.joinChannelAndPlaySound(this.getRandomSound(), channel);
                })
            }
            // Calculate next troll
            let minutes = Math.floor(Math.random()*(maxTime-minTime+1)+minTime);
            let nextDate = new Date();
            nextDate.setMinutes( nextDate.getMinutes() + minutes );
            console.log("Next troll play: " + nextDate);
            // Program next troll execution
            this.scheduledTrollExecution = Schedule.scheduleJob(nextDate, () => this.doTroll(minTime, maxTime, hitChance, channelMode));
        }
    }

    private getTrollChannels(channelMode:string):VoiceChannel[]{
        if(channelMode == this.TROLL_MODE_ALL){
            return this.client.channels.filter(channel => channel instanceof VoiceChannel && channel.members.size > 0).map(channel => <VoiceChannel>channel);
        }else if(channelMode == this.TROLL_MODE_RANDOM){
            let channels = this.client.channels.filter(channel => channel instanceof VoiceChannel && channel.members.size > 0);
            if(channels != null && channels.size > 0){
                return [<VoiceChannel>channels.random()];
            }
        }else{
            let channels = this.client.channels.filter(channel => channel instanceof VoiceChannel && channel.name.toLowerCase().includes(channelMode.toLowerCase()) && channel.members.size > 0);
            return channels.map(channel => <VoiceChannel>channel);
        }
        return null;
    }
}