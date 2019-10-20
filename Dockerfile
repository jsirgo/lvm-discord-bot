FROM node:12.4.0-alpine
COPY . /sound-discord-bot
WORKDIR /sound-discord-bot
ARG token
ARG symbol="?"
RUN apk add --no-cache --quiet ffmpeg python build-base git && git config --global core.compression 9
RUN mkdir -p src/config && echo "{\"token\":\""$token"\",\"botSymbol\":\""$symbol"\"}" > src/config/config.json
RUN npm install && npm run build && npm prune --production && rm -rf /sound-discord-bot/src
CMD ["npm", "start"]