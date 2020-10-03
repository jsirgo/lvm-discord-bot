import { ActivityType, Client, PresenceStatusData } from "discord.js";

export class ClientUtils {

    public static CLIENT_STATUS_ONLINE = "online";
    public static CLIENT_STATUS_IDLE = "idle";
    public static CLIENT_STATUS_DND = "dnd";
    public static CLIENT_ACTIVITY_TYPE_PLAYING = "PLAYING";
    public static CLIENT_ACTIVITY_TYPE_STREAMING = "STREAMING";
    public static CLIENT_ACTIVITY_TYPE_LISTENING = "LISTENING";
    public static CLIENT_ACTIVITY_TYPE_WATCHING = "WATCHING";
    
    public static setPresence(client:Client, status:string, activityName:string, activityType: ActivityType): void{
        if(activityName != null && activityType != null){
            client.user.setPresence({ activity: { name: activityName, type: activityType}, status: <PresenceStatusData>status });
        }else{
            client.user.setPresence({ activity: null, status: <PresenceStatusData>status });
            client.user.setPresence({});
        }
        
    }

    public static setActivity(client:Client, activityName:string, activityType: ActivityType): void{
        if(activityName != null && activityType != null){
            client.user.setActivity({ name: activityName, type: activityType});
        }else{
            client.user.setPresence({ activity: null });
        }
        
    }

    public static setStatus(client:Client, status:string): void{
        client.user.setStatus(<PresenceStatusData>status);
    }

}