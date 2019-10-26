import { Bot } from './Bot';
import config from './config/config.json'
import { ExpressApp } from './ExpressApp';
import { Config } from './interface';

const bot: Bot = new Bot();
bot.start();

if((<Config>config).wsenabled != null && (<Config>config).wsenabled){
    console.log("WS enabled");
    const expressApp: ExpressApp = new ExpressApp(bot);
    expressApp.start();
}
