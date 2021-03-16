FROM node:lts-alpine

WORKDIR /app
COPY package.json /app
COPY yarn.lock /app

RUN yarn install

COPY . /app

RUN yarn compile

CMD yarn run db:create; node server.js
