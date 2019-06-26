
import Data from '../config/data.json';
import { SoundData } from '../data/SoundData.js';
export class SoundUtils {

    public static getRandomSound(): SoundData {
        let randomIndex = Math.floor(Math.random() * Data.sounds.length);
        return new SoundData(Data.sounds[randomIndex]);
    }

    public static getSound(soundName: string): SoundData {
        let matchSounds = Data.sounds.filter(sound => sound.tags.toLowerCase().includes(soundName.toLowerCase()));
        if (matchSounds != null && matchSounds.length > 0) {
            if (matchSounds.length == 1) {
                return new SoundData(matchSounds[0]);
            }
            else {
                let randomIndex = Math.floor(Math.random() * matchSounds.length);
                return new SoundData(matchSounds[randomIndex]);
            }
        }
        return null;
    }
}
