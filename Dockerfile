FROM node:12.4.0-alpine
COPY . /sound-discord-bot
WORKDIR /sound-discord-bot
ARG token
ARG symbol="?"
ARG wsenabled="false"
ARG sslenabled="false"
ARG username="admin"
ARG password="soundbot"

RUN apk add --no-cache --quiet ffmpeg python build-base pwgen openssl git && git config --global core.compression 9

RUN export WS_PASSWORD=`pwgen -Bs1 12` && \
    export CERT_PASSWORD=`pwgen -Bs1 12` && \
    mkdir -p src/config && echo "{\"token\":\""$token"\",\"botSymbol\":\""$symbol"\",\"wsenabled\":"$wsenabled",\"sslenabled\":"$sslenabled",\"tokenkey\":\""${WS_PASSWORD}"\",\"certkey\": \""${CERT_PASSWORD}"\",\"wsusers\":[{\"username\": \""$username"\",\"password\": \""$password"\"}]}" > src/config/config.json && \
    openssl req -x509 -passout env:CERT_PASSWORD -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj "/C=ES/ST=./L=./O=./OU=./CN=."

RUN npm install && npm run build && npm prune --production && rm -rf /sound-discord-bot/src

CMD ["npm", "start"]