import { Client, PresenceStatusData, PresenceData, Presence } from "discord.js";

export class ClientUtils {

    public static CLIENT_STATUS_ONLINE:string = 'online';
    public static CLIENT_STATUS_IDLE:string = 'idle';
    public static CLIENT_STATUS_DND:string = 'dnd';
    public static CLIENT_ACTIVITY_TYPE_PLAYING:string = 'PLAYING';
    public static CLIENT_ACTIVITY_TYPE_STREAMING:string = 'STREAMING';
    public static CLIENT_ACTIVITY_TYPE_LISTENING:string = 'LISTENING';
    public static CLIENT_ACTIVITY_TYPE_WATCHING:string = 'WATCHING';
    
    public static setPresence(client:Client, status:string, activityName:string, activityType:any) {
        if(activityName != null && activityType != null){
            client.user.setPresence({ activity: { name: activityName, type: activityType}, status: <PresenceStatusData>status });
        }else{
            client.user.setPresence({ activity: null, status: <PresenceStatusData>status });
            client.user.setPresence({});
        }
        
    }

    public static setActivity(client:Client, activityName:string, activityType:any) {
        if(activityName != null && activityType != null){
            client.user.setActivity({ name: activityName, type: activityType});
        }else{
            client.user.setPresence({ activity: null });
        }
        
    }

    public static setStatus(client:Client, status:string) {
        client.user.setStatus(<PresenceStatusData>status);
    }

}