FROM node:alpine

WORKDIR /app

ADD . /app

RUN npm install && npm install -g pm2