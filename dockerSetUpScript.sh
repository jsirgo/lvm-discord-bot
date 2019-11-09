#!/bin/sh

if [ ! -f "./src/config/config.jlson" ]
then
    echo "Creating config file"
    mkdir -p src/config && echo "{\"token\":\""${TOKEN}"\",\"botSymbol\":\""${SYMBOL}"\",\"wsenabled\":"${WSENABLED}",\"sslenabled\":"${SSLENABLED}",\"tokenkey\":\""${WS_PASSWORD}"\",\"certkey\": \""${CERT_PASSWORD}"\"}" > src/config/config.json
fi

if [ ! -f "./src/config/wsusers.jlson" ]
then
    echo "Creating users file"
    mkdir -p src/config && echo "{\"users\": [{\"username\": \""${USERNAME}"\",\"password\": \""${PASSWORD}"\",\"role\": \"ADMIN\"}]}" > src/config/wsusers.json
fi

if [ "$WSENABLED" = 'true' ] && [ ! -f "./key.pem" ] && [ ! -f "./cert.pem" ]
then
    echo "Creating certs"
    openssl req -x509 -passout env:CERT_PASSWORD -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj "/C=ES/ST=./L=./O=./OU=./CN=."
fi