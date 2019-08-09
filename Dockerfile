FROM node:alpine

WORKDIR /app

ADD package.json /app
ADD package-lock.json /app
ADD bot /app/bot

RUN npm install
RUN npm install -g pm2