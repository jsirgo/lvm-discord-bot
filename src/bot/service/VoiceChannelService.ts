import { ActivityType, Client, StreamDispatcher, VoiceChannel } from "discord.js";
import { Sound } from "../interface";
import { ClientUtils } from "../util";

export class VoiceChannelService {

    private client:Client;
    private isBussy = false;

    constructor(client:Client){
        this.client = client;
    }

    public playSoundInMultipleVoiceChannels(sound:Sound, channels:VoiceChannel[]): void{
        if(channels != null && channels.length > 0){
            const channel:VoiceChannel = channels.pop();
            this.joinVoiceChannelAndPlaySound(sound, channel).then((dispatcher) => {
                dispatcher.on("speaking", (speaking) => {
                    if(!speaking){
                        this.playSoundInMultipleVoiceChannels(sound, channels);
                    }
                });
            });
        }
    }

    public async joinVoiceChannelAndPlaySound(sound:Sound, voiceChannel:VoiceChannel): Promise<StreamDispatcher>{
        return voiceChannel.join().then(connection => {
            this.isBussy = true;
            const previousStatus = this.client.user.presence.status;
            const previousActivityName = this.client.user.presence.activities[0] != null ? this.client.user.presence.activities[0].name : null;
            const PreviousActivityType = this.client.user.presence.activities[0] != null ? this.client.user.presence.activities[0].type : null;
            ClientUtils.setPresence(this.client, ClientUtils.CLIENT_STATUS_IDLE, sound.text + " in " + voiceChannel.name, <ActivityType>ClientUtils.CLIENT_ACTIVITY_TYPE_STREAMING);
            return connection.play(sound.location)
            .on("speaking", (speaking) => {
                if(!speaking){
                    this.isBussy = false;
                    ClientUtils.setPresence(this.client, previousStatus, previousActivityName, PreviousActivityType);
                    connection.disconnect();
                }
            }).on("error", (error) => {
                console.error("Error: "+error);
                this.isBussy = false;
                ClientUtils.setPresence(this.client, previousStatus, previousActivityName, PreviousActivityType);
            });
        });
    }

    public isNotBussy():boolean{
        return !this.isBussy;
    }

    public getVoiceChannel(channelName:string):VoiceChannel {
        const channels = this.client.channels.cache.filter(channel => channel instanceof VoiceChannel && channel.name.toLowerCase().includes(channelName.toLowerCase()));
        if(channels.size === 1){
            return <VoiceChannel>channels.first();
        }else{
            return null;
        }
    }
}