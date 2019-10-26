import { Sound } from '../interface';
import { Guild } from './Guild';
import { Channel } from './Channel';

export class BotData {
    guild: Guild;
    serverName: string;
    voiceChannels: Channel[];
    sounds: Sound[];
}