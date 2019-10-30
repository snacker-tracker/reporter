FROM node:10-alpine
RUN mkdir /app/
WORKDIR /app/
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY .babelrc ./
COPY src ./src
ENV NODE_ENV=production

ENV PORT 8090
EXPOSE $PORT

RUN yarn build
CMD yarn start

ARG APP_VERSION=0.1.0-snapshot
ENV APP_VERSION=$APP_VERSION