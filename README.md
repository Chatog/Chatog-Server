# Chatog-Server

Chatog server-side system.

## Quick Start

We recommend to build env referred to [Dockerfile](./Dockerfile).

Install dependencies and serve.

```
yarn
yarn dev --debug
```

## Deploy

Build dist (without node_modules).

```bash
yarn build
```

Launch server.

```bash
node ./build/src/index.js
```

If you are using Windows & Docker Desktop, you may need forward port like this (run in cmd):

```bash
netsh interface portproxy set v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=localhost
```
