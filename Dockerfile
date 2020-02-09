FROM node:10-alpine

ENV NODE_ENV=production
RUN mkdir /app/
WORKDIR /app/

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY .babelrc ./
COPY src ./src

ENV PORT 8090
EXPOSE $PORT

RUN yarn build
CMD node dist/bin/web.js

ARG APP_VERSION=0.1.0-snapshot
ENV APP_VERSION=$APP_VERSION
