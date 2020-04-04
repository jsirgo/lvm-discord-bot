#!/bin/sh

if [ ! -f "./src/config/config.json" ]
then
    echo "Create config file"
    mkdir -p src/config && echo "{\"token\":\""$2"\",\"botSymbol\":\""$1"\",\"apienabled\":"$3",\"sslenabled\":"$7",\"tokenkey\":\""$4"\",\"mantaineremail\": \""$8"\"}" > src/config/config.json
fi

if [ ! -f "./src/config/apiusers.json" ]
then
    echo "Create users file"
    mkdir -p src/config && echo "{\"users\": [{\"username\": \""$5"\",\"password\": \""$6"\"}]}" > src/config/apiusers.json
fi

if [ ! -f "./greenlock.d/config.json" ]
then
    echo "Create greenlock config file"
    mkdir -p greenlock.d && echo "{\"sites\": [{\"subject\": \""$9"\", \"altnames\": [\""$9"\"]}]}" > greenlock.d/config.json
fi