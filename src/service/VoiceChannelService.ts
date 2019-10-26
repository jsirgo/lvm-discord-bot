import { Client, VoiceChannel } from "discord.js";
import { Sound } from "../interface";
import { ClientUtils } from "../util";

export class VoiceChannelService {

    private client:Client;
    private isBussy:boolean = false;

    constructor(client:Client){
        this.client = client;
    }

    public playSoundInMultipleVoiceChannels(sound:Sound, channels:VoiceChannel[]){
        if(channels != null && channels.length > 0){
            let channel:VoiceChannel = channels.pop();
            this.joinVoiceChannelAndPlaySound(sound, channel).then((dispatcher) => {
                dispatcher.on('end', () => {
                    this.playSoundInMultipleVoiceChannels(sound, channels);
                });
            })
        }
    }

    public async joinVoiceChannelAndPlaySound(sound:Sound, voiceChannel:VoiceChannel) {
        return voiceChannel.join().then(connection => {
            this.isBussy = true;
            let previousStatus = this.client.user.presence.status;
            let previousActivityName = this.client.user.presence.activity != null ? this.client.user.presence.activity.name : null;
            let PreviousActivityType = this.client.user.presence.activity != null ? this.client.user.presence.activity.type : null;
            ClientUtils.setPresence(this.client, ClientUtils.CLIENT_STATUS_IDLE, sound.text + " in " + voiceChannel.name, ClientUtils.CLIENT_ACTIVITY_TYPE_STREAMING);
            return connection.play(sound.location).on('end', () => {
                this.isBussy = false;
                ClientUtils.setPresence(this.client, previousStatus, previousActivityName, PreviousActivityType);
                connection.disconnect();
            }).on('error', (error) => {
                this.isBussy = false;
                ClientUtils.setPresence(this.client, previousStatus, previousActivityName, PreviousActivityType);
                console.log("Error: "+error);
            });
        });
    }

    public isNotBussy():boolean{
        return !this.isBussy;
    }

    public getVoiceChannel(channelName:string):VoiceChannel {
        let channels = this.client.channels.filter(channel => channel instanceof VoiceChannel && channel.name.toLowerCase().includes(channelName.toLowerCase()));
        if(channels.size === 1){
            return <VoiceChannel>channels.first();
        }else{
            return null;
        }
    }
}