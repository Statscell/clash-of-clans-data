FROM node:20-alpine

RUN apk add --no-cache --virtual .build-deps alpine-sdk python3

WORKDIR /

COPY . .

RUN npm i

RUN apk del .build-deps

ENTRYPOINT ["node", "src/index.js", "--decompress"]