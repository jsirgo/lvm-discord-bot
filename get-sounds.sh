#!/bin/sh
# Download sound files and sound data json from dmcallejo/lavidamoderna_bot project https://github.com/dmcallejo/lavidamoderna_bot
git clone https://github.com/dmcallejo/lavidamoderna_bot.git
cp -r  lavidamoderna_bot/LaVidaModerna/ resources/sounds/
cp lavidamoderna_bot/app/data.json src/config/data.json
rm -rf lavidamoderna_bot