import { Sound } from "../interface";
import { Guild } from "./Guild";
import { Channel } from "./Channel";

export class BotData {
    guild: Guild;
    voiceChannels: Channel[];
    sounds: Sound[];
}