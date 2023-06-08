FROM node:18 AS builder

RUN mkdir /app/
WORKDIR /app/

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY tsconfig.json ./
COPY src ./src/
RUN yarn build
COPY src/swagger.yml dist/swagger.yml

FROM node:18 AS runner

WORKDIR /app

ENV NODE_ENV=production
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production

COPY --from=builder /app/dist /app/

ENV PORT 8090
EXPOSE $PORT

CMD node /app/bin/web.js

ARG APP_VERSION=0.1.0-snapshot
ENV APP_VERSION=$APP_VERSION
