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
