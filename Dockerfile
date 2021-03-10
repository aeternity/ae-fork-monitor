FROM node:lts-alpine

WORKDIR /app
COPY package.json /app
COPY yarn.lock /app

RUN yarn install

COPY . /app

CMD yarn run db:create; node index.js
