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
    export TOKEN=$token && \
    export SYMBOL=$symbol && \
    export WSENABLED=$wsenabled && \
    export SSLENABLED=$sslenabled && \
    export USERNAME=$username && \
    export PASSWORD=$password && \
    chmod 700 ./dockerSetUpScript.sh && \
    ./dockerSetUpScript.sh

RUN npm install && npm run build && npm prune --production && rm -rf /sound-discord-bot/src

CMD ["npm", "start"]