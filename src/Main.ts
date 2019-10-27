import { Bot } from './Bot';
import config from './config/config.json'
import { ExpressApp } from './ExpressApp';
import { Config } from './interface';

var bot: Bot = new Bot();
var expressApp: ExpressApp;

bot.start().then((val) => {
    if((<Config>config).wsenabled != null && (<Config>config).wsenabled){
        console.log("WS enabled, starting express app");
        expressApp = new ExpressApp(bot);
        expressApp.start();
    }
});
