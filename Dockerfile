FROM ubuntu:18.04

WORKDIR /home

# install dependencies
RUN apt-get update && apt-get -y install wget git build-essential python3-pip

# install node
ARG NODE_VER=v16.14.0
ARG NODE_REPO=https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}-linux-x64.tar.xz

RUN wget ${NODE_REPO} && tar xf node-${NODE_VER}-linux-x64.tar.xz && cp node-*/* /usr/local -rf && rm -rf node-*