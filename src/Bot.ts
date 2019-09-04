import Discord, { Message, TextChannel } from "discord.js";
import Config from './config/config.json';
import { VoiceChannelService } from "./service/VoiceChannelService";
import { TrollService } from "./service/TrollService";
import { SoundService } from "./service/SoundService";

export class Bot {

    private readonly PERMISSION_ADMINISTRATOR = "ADMINISTRATOR";
    private readonly FILE_NAME_PATTERN:RegExp = /^[aA-zZ-]*\.ogg$/
    
    private botSymbol = Config.botSymbol != null && Config.botSymbol.length > 0 ? Config.botSymbol : "?";

    private client:Discord.Client;
    private voiceChannelService:VoiceChannelService;
    private trollService:TrollService;
    private soundService:SoundService;

    private addingSoundStep:number = 0;
    private userAddingSound:string;
    private tempAttachmentUrl:string;
    private tempText:string;
    private tempTags:string;

    constructor () {
        this.client = new Discord.Client();

        this.client.on("ready", () => console.log("Connected"));

        this.client.on("message", (message: Message) => this.onMessage(message));

        this.client.on("error", (error) => console.log("Error: "+error));

        this.client.on('disconnect', function () {
            clearTimeout(this.client.ws.connection.ratelimit.resetTimer);
        });

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
        if (message.content.charAt(0) === this.botSymbol) {
            if(this.addingSoundStep > 0){
                this.stopWaitingForSound(message);
            }
            if(this.voiceChannelService.isNotBussy()){
                let regexp = new RegExp("^\\"+this.botSymbol+"(?<command>\\w*)( (?<params>.*))?");
                let match = message.content.match(regexp);
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
                        case "refresh":
                            this.refresh(message);
                            break;
                        case "add":
                            this.addSoundStep0(message);
                            break;
                        case "list":
                        case "l":
                            this.listSounds(message);
                            break;
                        default:
                            this.sendHelpMessage(message);
                            break;
                    }
                }
            }else{
                message.channel.send("Wait and retry later, now I´m bussy");
            }
        }else if (this.addingSoundStep > 0){
            switch(this.addingSoundStep) {
                case 1:
                    this.addSoundStep1(message);
                    break;
                case 2:
                    this.addSoundStep2(message);
                    break;
                case 3:
                    this.addSoundStep3(message);
                    break;
                default:
                    this.stopWaitingForSound(message);
                    break;
            }
            
        }
    }

    private sendHelpMessage(message:Message) {
        message.channel.send("Help:"
            +"\n**"+this.botSymbol+"play {0}** - Search a sound by {0} word and plays it in the user voice channel, If no word is passed (Only "+this.botSymbol+"play or "+this.botSymbol+"p), plays a random sound. Shortening: **"+this.botSymbol+"p {0}**"
            +"\n**"+this.botSymbol+"playchannel {0},{1}** - Joins to voice channel {0} and plays {1} sound, if no sound passed (Only "+this.botSymbol+"play {0} or "+this.botSymbol+"p {0}) plays a random one. Shortening: **"+this.botSymbol+"pc {0},{1}**");
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
                this.trollService.start(Number(params[0]), Number(params[1]), Number(params[2]), params[3], <TextChannel>message.channel);
            }else{
                this.sendHelpMessage(message);
            }
        }else{
            this.sendHelpMessage(message);
        }   
    }

    private trollOff(message:Message) {
        if(message.member.hasPermission(this.PERMISSION_ADMINISTRATOR)){
            this.trollService.stop(<TextChannel>message.channel);
        }
    }

    private refresh(message:Message){
        if(message.member.hasPermission(this.PERMISSION_ADMINISTRATOR)){
            this.soundService.loadSounds();
        }
    }

    private listSounds(message:Message){
        if(message.member.hasPermission(this.PERMISSION_ADMINISTRATOR)){
            let sounds = this.soundService.getSoundTextList();
            let messageString:string = "";
            sounds.forEach(sound =>  {
                messageString = messageString + "\n" + sound.filename;
                messageString = messageString + "\n\t Text: " + sound.text;
                messageString = messageString + "\n\t Tags: " + sound.tags;
            });
            message.channel.send(messageString);
        }
    }

    private addSoundStep0(message:Message){
        if(message.member.hasPermission(this.PERMISSION_ADMINISTRATOR)){
            this.userAddingSound = message.member.id;
            this.addingSoundStep = 1;
            message.channel.send("Ok, adding a new sound send it here:");
        }
    }

    private addSoundStep1(message:Message){
        if(message.member.id == this.userAddingSound){
            if(message.attachments != null && message.attachments.size > 0){
                let attachment = message.attachments.first();
                let tempName = attachment.url.split("/");
                let fileName = tempName[tempName.length-1]
                if(this.FILE_NAME_PATTERN.test(fileName)){
                    this.tempAttachmentUrl = attachment.url;
                    this.addingSoundStep = 2;
                    message.channel.send("Write what is played in the sound:");
                }else{
                    message.channel.send("File should be an ogg and name should be composed by letters or/and hyphens.\nSound import proccess stopped.");
                    this.clearAddSoundProccess();
                }
            }else{
                this.stopWaitingForSound(message);
            }
        }
    }

    private addSoundStep2(message:Message){
        if(message.member.id == this.userAddingSound){
            if(message.content != null && message.content.length >= 5 && message.content.length <= 200){
                this.tempText = message.content;
                this.addingSoundStep = 3;
                message.channel.send("Write some tags that describes the sound separated by blank space:");
            }else{
                message.channel.send("Text should be at least 5 characters long and not greater than 200, try to write it again:");
            }
        }
    }

    private addSoundStep3(message:Message){
        if(message.member.id == this.userAddingSound){
            if(message.content != null && message.content.length >= 3 && message.content.length <= 100){
                this.tempTags = message.content;
                this.soundService.addNewSound(this.tempAttachmentUrl, this.tempText, this.tempTags).then((success) => {
                    if(success){
                        this.clearAddSoundProccess();
                        message.channel.send("Sound imported successfuly");
                    }else{
                        this.clearAddSoundProccess();
                        message.channel.send("Oups, Wild ERROR appeared!\nSound import proccess stopped.");
                    }
                });
            }else{
                message.channel.send("Total tags length should be at least 3 characters long and not greater than 100, try to write it again:");
            }
        }
    }

    private stopWaitingForSound(message:Message){
        this.clearAddSoundProccess();
        message.channel.send("No sound, no party.\nSound import proccess stopped.");
    }

    private clearAddSoundProccess(){
        this.addingSoundStep = 0;
        this.userAddingSound = null;
        this.tempAttachmentUrl = null;
        this.tempText = null;
        this.tempTags = null;
    }

}