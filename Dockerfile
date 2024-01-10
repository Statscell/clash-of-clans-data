FROM node:20-alpine

WORKDIR /

COPY . .

RUN npm i

ENTRYPOINT ["node", "src/index.js", "--decompress"]