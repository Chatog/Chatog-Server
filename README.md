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

## Issues

If you want to launch server in local Windows system, you may encounter below issues:

### Request ${LAN IP}:8080 refused

Solution: forward LAN IP to localhost.

```bash
netsh interface portproxy set v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=localhost
```

### Cannot establish ICE connection with ${LAN_IP} in mobile

Solution: not use ${LAN_IP} but use `localhost`.

In this way, you also have to use usb to connect mobile and computer, then forward mobile request to computer, such as:

```bash
adb reverse tcp:20000 tcp:20000
```
