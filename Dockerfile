FROM node:14-alpine3.12
ARG BUILD_MODE
WORKDIR /usr/src/app
RUN apk add --update --no-cache python3 build-base
COPY package*.json ./
RUN npm ci
COPY . ./
RUN if [ "$BUILD_MODE" == "production" ]; \
    then { \
    npx tsc -p . \
    npm prune --production; \
    } \
    fi
USER node
CMD ["npx", "ts-node-dev", "--transpile-only", "--poll", "src/main/App.ts"]