import * as mediasoup from 'mediasoup';
import {
  Worker,
  Router,
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
  ProducerOptions
} from 'mediasoup/node/lib/types';
import config from './media-config';
import { fail, ResCode, success } from '../controllers';
import { Server, Socket } from 'socket.io';

/**
 * types
 */
const EventPrefix = 'MediaManager.';
export enum SignalingEvent {
  joinRouter = 'joinRouter',
  getRouterCapabilities = 'getRouterCapabilities',
  createTransport = 'createTransport',
  connectTransport = 'connectTransport',
  createProducer = 'createProducer',
  createConsumer = 'createConsumer',
  resumeConsumer = 'resumeConsumer',
  closeProducer = 'closeProducer',
  closeConsumer = 'closeConsumer'
}

export type OnProducerCallback = (
  // temporarily use socket.data only
  socket: {
    data: any;
  },
  producer: Producer
) => void;
export type ProduceAuthGuard = (
  socket: Socket,
  producerOptions: ProducerOptions
) => boolean;

/**
 * class
 */
export class MediaManagerServer {
  private _debug: boolean;
  private _onProducer?: OnProducerCallback;
  private _onProducerClose?: OnProducerCallback;
  private _canProduce?: ProduceAuthGuard;

  private _worker?: Worker;
  private _routers: Map<string, Router> = new Map();
  private _transports: Map<string, Transport> = new Map();
  private _producers: Map<string, Producer> = new Map();
  private _consumers: Map<string, Consumer> = new Map();

  private _socketMedias: Map<
    string,
    {
      routerId: string;
      device: string;
      rtpCapabilities: RtpCapabilities;
      sendTransport?: string;
      recvTransport?: string;
      producers: Set<string>;
      consumers: Set<string>;
    }
  > = new Map();

  constructor(debug = true) {
    this._debug = debug;
  }

  private initSignaling(server: Server) {
    server.on('connection', (socket) => {
      // clean media when signaling disconnect
      socket.on('disconnect', () => {
        console.log(`[media-manager] socket[${socket.id}] clean media`);

        const socketMedia = this._socketMedias.get(socket.id);
        if (!socketMedia) return;
        // clean producers
        socketMedia.producers.forEach((id, _) => {
          try {
            this.closeProducer(socket, id);
          } catch (e) {}
        });
        // clean consumers
        socketMedia.consumers.forEach((id, _) => {
          this._consumers.get(id)?.close();
          this._consumers.delete(id);
        });
        // clean transport
        socketMedia.sendTransport &&
          this._transports.delete(socketMedia.sendTransport);
        socketMedia.recvTransport &&
          this._transports.delete(socketMedia.recvTransport);
        // clean socketMedia
        this._socketMedias.delete(socket.id);
      });
      /**
       * init client request handlers
       */
      // getRouterCapabilities
      socket.on(
        EventPrefix + SignalingEvent.getRouterCapabilities,
        (routerId: string, callback) => {
          const router = this._routers.get(routerId);
          if (!router) {
            callback(fail(new Error(`router[${routerId}] not exists`)));
            return;
          }
          callback(success(router.rtpCapabilities));
        }
      );
      // joinRouter
      socket.on(
        EventPrefix + SignalingEvent.joinRouter,
        (
          payload: {
            routerId: string;
            device: string;
            rtpCapabilities: RtpCapabilities;
          },
          callback
        ) => {
          this._socketMedias.set(socket.id, {
            ...payload,
            producers: new Set(),
            consumers: new Set()
          });
          callback(success());
        }
      );
      // createTransport
      socket.on(
        EventPrefix + SignalingEvent.createTransport,
        async (options: { type: string }, callback) => {
          // get router
          const socketMedia = this._socketMedias.get(socket.id);
          if (!socketMedia) {
            callback(new Error(`socketMedia[${socket.id}] not exists`));
            return;
          }
          const router = this._routers.get(socketMedia.routerId);
          if (!router) {
            callback(new Error(`router[${socketMedia.routerId}] not exists`));
            return;
          }
          const transport = await router?.createWebRtcTransport({
            listenIps: [
              {
                ip: '0.0.0.0',
                announcedIp: '127.0.0.1'
              }
            ],
            enableTcp: true,
            enableUdp: true,
            preferUdp: true,
            appData: {
              type: options.type
            }
          });
          this._transports.set(transport.id, transport);
          // save info
          if (options.type === 'send') {
            socketMedia.sendTransport = transport.id;
          } else if (options.type === 'recv') {
            socketMedia.recvTransport = transport.id;
          }
          callback(
            success({
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
              sctpParameters: transport.sctpParameters
            })
          );
        }
      );
      // connectTransport
      socket.on(
        EventPrefix + SignalingEvent.connectTransport,
        async (payload, callback) => {
          const { transportId, dtlsParameters } = payload;
          // get transport
          const transport = this._transports.get(transportId);
          if (!transport) {
            callback(fail(new Error(`transport[${transportId}] not exists`)));
            return;
          }
          await transport.connect({ dtlsParameters });
          callback(success());
        }
      );
      // createProducer
      socket.on(
        EventPrefix + SignalingEvent.createProducer,
        async (payload, callback) => {
          // check produce auth
          if (this._canProduce && !this._canProduce(socket, payload)) {
            // not an error
            callback({
              code: ResCode.ERROR_MSG,
              msg: 'you are not allowed to pub this media',
              data: null
            });
            return;
          }

          const { transportId, kind, rtpParameters } = payload;
          let { appData } = payload;
          // get transport
          const transport = this._transports.get(transportId);
          if (!transport) {
            callback(fail(new Error(`transport[${transportId}] not exists`)));
            return;
          }
          // create producer
          appData = { ...appData, from: socket.id };
          const producer = await transport.produce({
            kind,
            rtpParameters,
            appData
          });

          this._producers.set(producer.id, producer);
          this._socketMedias.get(socket.id)!.producers.add(producer.id);

          callback(success(producer.id));

          if (this._onProducer) {
            this._onProducer(socket, producer);
          }
        }
      );
      // createConsumer
      socket.on(
        EventPrefix + SignalingEvent.createConsumer,
        async (options, callback) => {
          const { producerId } = options;
          // wether can cansume
          const socketMedia = this._socketMedias.get(socket.id);
          if (!socketMedia) {
            callback(fail(new Error(`socketMedia[${socket.id}] not exists`)));
            return;
          }
          const router = this._routers.get(socketMedia.routerId);
          if (!router) {
            callback(
              fail(new Error(`router[${socketMedia.routerId}] not exists`))
            );
            return;
          }
          const rtpCapabilities = socketMedia.rtpCapabilities;
          if (
            !router.canConsume({
              producerId,
              rtpCapabilities
            })
          ) {
            callback(fail(new Error(`cannot consume`)));
            return;
          }
          // get transport
          if (!socketMedia.recvTransport) {
            callback(
              fail(
                new Error(`socketMedia[${socket.id}].recvTransport not exists`)
              )
            );
            return;
          }
          const transport = this._transports.get(socketMedia.recvTransport);
          if (!transport) {
            callback(
              fail(
                new Error(`transport[${socketMedia.recvTransport}] not exists`)
              )
            );
            return;
          }
          // create consumer
          const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true
          });

          consumer.on('producerclose', () => {
            consumer.close();
            this._consumers.delete(consumer.id);
          });

          this._consumers.set(consumer.id, consumer);
          this._socketMedias.get(socket.id)!.consumers.add(consumer.id);
          callback(
            success({
              id: consumer.id,
              producerId: options.producerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
              appData: consumer.appData
            })
          );
        }
      );
      // resumeConsumer
      socket.on(
        EventPrefix + SignalingEvent.resumeConsumer,
        async (consumerId, callback) => {
          // get consumer
          const consumer = this._consumers.get(consumerId);
          if (!consumer) {
            callback(fail(new Error(`consumer[${consumerId}] not exists`)));
            return;
          }
          // resume consumer
          await consumer.resume();
          callback(success());
        }
      );
      // closeProducer
      socket.on(
        EventPrefix + SignalingEvent.closeProducer,
        async (producerId, callback) => {
          try {
            const producer = this.closeProducer(socket, producerId);
            callback(success());
          } catch (e) {
            callback(fail(e));
          }
        }
      );
      // closeConsumer
      socket.on(
        EventPrefix + SignalingEvent.closeConsumer,
        async (consumerId, callback) => {
          const consumer = this._consumers.get(consumerId);
          if (!consumer) {
            callback(fail(new Error(`consumer[${consumerId}] not exists`)));
            return;
          }
          consumer.close();
          this._consumers.delete(consumer.id);
          this._socketMedias.get(socket.id)!.consumers.delete(consumer.id);

          callback(success());
        }
      );
    });
    console.log('[media-manager] socket ready');
  }

  async init(
    signalingServer: Server,
    onProducer?: OnProducerCallback,
    onProducerClose?: OnProducerCallback,
    canProduce?: ProduceAuthGuard
  ) {
    this._onProducer = onProducer;
    this._onProducerClose = onProducerClose;
    this._canProduce = canProduce;

    this.initSignaling(signalingServer);

    const worker = await mediasoup.createWorker({
      rtcMinPort: 20000,
      rtcMaxPort: 20005
    });
    this._worker = worker;
    console.log('[media-manager] worker ready');
  }

  async createRouter(routerId: string) {
    if (!this._routers.has(routerId)) {
      if (!this._worker) throw new Error('[media-manager] worker not ready');
      const router = await this._worker.createRouter(config.router);
      this._routers.set(routerId, router);
    }
  }

  closeProducer(
    socket: {
      data: any;
    },
    producerId: string
  ) {
    const producer = this._producers.get(producerId);
    if (!producer) {
      throw new Error(`producer[${producerId}] not exists`);
    }
    producer.close();
    this._producers.delete(producer.id);

    if (this._onProducerClose) {
      this._onProducerClose(socket, producer);
    }
  }
}
