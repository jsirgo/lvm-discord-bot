import Discord, { Message, VoiceChannel } from "discord.js";
import Config from './config/config.json';
import Data from './config/data.json';

export class Bot {

    private readonly SOUNDS_PATH:string = "resources/sounds/";

    private client:Discord.Client;

    constructor () {
        this.client = new Discord.Client();

        this.client.on("ready", () => console.log("Connected"));

        this.client.on("message", (message: Message) => this.onMessage(message));

    }

    public start() {
        console.log("Login...");
        this.client.login(Config.token);
    }

    private onMessage(message: Message) {
        if (message.content.charAt(0) === "?") {
            let regex = new RegExp(/^\?(\w*) (.*)/)
            let match = regex.exec(message.content);
            let cmd = match.length > 1 ? match[1] : null;
            if(cmd != null){
                let args = match.length > 2 ? match[2] : null;
                switch(cmd) {
                    case "help":
                        this.sendHelpMessage(message);
                        break;
                    case "send":
                        if(args == null) break;
                        this.send(args, message);
                        break;
                    case "random":
                        if(args == null) break;
                        this.sendRandom(args, message);
                        break;
                    default:
                        this.sendHelpMessage(message);
                        break;
                }
            }
        }
    }

    private sendHelpMessage(message:Message) {
        message.channel.send("Help:\n?send - Search a sound by {0} word, joins to {1} voice channel and plays the sound\n?random - Joins to {0} voice channel and plays a random sound");
    }

    private async send(args:string, message:Message) {
        if(args != null){
            let params = args.split(",");
            if(params.length == 2){
                let soundUrl = this.getSound(params[0]);
                if(soundUrl == null) {
                    message.channel.send("Sound not found");
                    return;
                }
                let voiceChannel = this.getChannel(params[1]);
                if(voiceChannel == null) {
                    message.channel.send("Channel not found");
                    return;
                }
                this.joinChannelAndPlaySound(soundUrl, voiceChannel);                  
            }
        }
    }

    private async sendRandom(channelName:string, message:Message) {
        let soundUrl = this.getRandomSound();
        if(soundUrl == null) {
            message.channel.send("Sound not found");
            return;
        }
        let voiceChannel = this.getChannel(channelName);
        if(voiceChannel == null) {
            message.channel.send("Channel not found");
            return;
        }
        this.joinChannelAndPlaySound(soundUrl, voiceChannel);
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
        console.log(this.SOUNDS_PATH + sound.filename);
        return this.SOUNDS_PATH + sound.filename;
    }

    private joinChannelAndPlaySound(soundUrl:string, voiceChannel:VoiceChannel) {
        voiceChannel.join().then(connection => {
            connection.play(soundUrl , {
                volume: 1, 
                passes: 3
            }).on('end', () => {
                console.log("Finished")
                    connection.disconnect();
            }).on('error', (error) => {
                console.log("Error: "+error)
            });
        });
    }

}