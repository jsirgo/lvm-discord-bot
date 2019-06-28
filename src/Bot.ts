import Discord, { Message, VoiceChannel } from "discord.js";
import Config from './config/config.json';
import { VoiceChannelService } from "./service/VoiceChannelService";
import { TrollService } from "./service/TrollService";
import { SoundService } from "./service/SoundService";

export class Bot {

    private readonly PERMISSION_ADMINISTRATOR = "ADMINISTRATOR";

    private client:Discord.Client;
    private voiceChannelService:VoiceChannelService;
    private trollService:TrollService;
    private soundService:SoundService;

    constructor () {
        this.client = new Discord.Client();

        this.client.on("ready", () => console.log("Connected"));

        this.client.on("message", (message: Message) => this.onMessage(message));

        this.client.on("error", (error) => console.log("Error: "+error));

        this.soundService = new SoundService()
        this.voiceChannelService = new VoiceChannelService(this.client);
        this.trollService = new TrollService(this.client, this.voiceChannelService, this.soundService);
        
    }

    /**
     * Starts bot
     */
    public start() {
        console.log("Login...");
        this.client.login(Config.token);
    }

    private onMessage(message: Message) {
        if (message.content.charAt(0) === "?") {
            if(this.voiceChannelService.isNotBussy()){
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
                            this.trollOn(args, message);
                            break;
                        case "trollOff":
                            this.trollOff(message);
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
            let sound = soundName != null && soundName.length > 0 ? this.soundService.getSound(soundName) :  this.soundService.getRandomSound();
            if(sound != null) {
                this.voiceChannelService.joinVoiceChannelAndPlaySound(sound, message.member.voice.channel);
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
                let voiceChannel = this.voiceChannelService.getVoiceChannel(params[0]);
                if(voiceChannel == null) {
                    message.channel.send("Channel not found");
                    return;
                }
                let soundUrl = params[1] != null && params[1].length > 0 ? this.soundService.getSound(params[1]) : this.soundService.getRandomSound();
                if(soundUrl != null) {
                    this.voiceChannelService.joinVoiceChannelAndPlaySound(soundUrl, voiceChannel);    
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

    private trollOn(args:string, message:Message) {
        if(args != null && message.member.hasPermission(this.PERMISSION_ADMINISTRATOR)) {
            let params = args.split(",");
            if(params.length == 4 && !isNaN(Number(params[0])) && !isNaN(Number(params[1])) && !isNaN(Number(params[2]))) {
                this.trollService.start(Number(params[0]), Number(params[1]), Number(params[2]), params[3]);
            }else{
                this.sendHelpMessage(message);
            }
        }else{
            this.sendHelpMessage(message);
        }   
    }

    private trollOff(message:Message) {
        if(message.member.hasPermission(this.PERMISSION_ADMINISTRATOR)){
            this.trollService.stop();
        }
    }

}