FROM linuxserver/ffmpeg:latest

ENV APP_HOME=/app
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

RUN set -x \
    && apt-get update \
    && apt-get install -y git tree \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && export NODE_JS_VERSION=v20.16.0 \
    && export NODE_JS_FULL_NAME=node-$NODE_JS_VERSION-linux-x64 \
    && export NODE_JS_FILE_NAME=$NODE_JS_FULL_NAME.tar.gz \
    && export NODE_JS_BIN_DIR_NAME=$NODE_JS_FULL_NAME/bin \
    && curl -o $NODE_JS_FILE_NAME https://nodejs.org/download/release/$NODE_JS_VERSION/$NODE_JS_FILE_NAME \
    && tar -xzf $NODE_JS_FILE_NAME \
    && rm -rf $NODE_JS_FILE_NAME \
    && ln -s $APP_HOME/$NODE_JS_BIN_DIR_NAME/node /usr/local/bin/node \
    && ln -s $APP_HOME/$NODE_JS_BIN_DIR_NAME/npm /usr/local/bin/npm \
    && npm i -g pnpm \
    && ln -s $APP_HOME/$NODE_JS_BIN_DIR_NAME/pnpm /usr/local/bin/pnpm

ENTRYPOINT ["sleep", "infinity"]
