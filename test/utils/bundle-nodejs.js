'use strict'

const TCP = require('libp2p-tcp')
const MulticastDNS = require('libp2p-mdns')
const WS = require('libp2p-websockets')
const Bootstrap = require('libp2p-railing')
const SPDY = require('libp2p-spdy')
const KadDHT = require('libp2p-kad-dht')
const MPLEX = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const defaultsDeep = require('lodash.defaultsdeep')
const libp2p = require('../..')

function mapMuxers (list) {
  return list.map((pref) => {
    if (typeof pref !== 'string') {
      return pref
    }
    switch (pref.trim().toLowerCase()) {
      case 'spdy': return SPDY
      case 'mplex': return MPLEX
      default:
        throw new Error(pref + ' muxer not available')
    }
  })
}

function getMuxers (muxers) {
  const muxerPrefs = process.env.LIBP2P_MUXER
  if (muxerPrefs && !muxers) {
    return mapMuxers(muxerPrefs.split(','))
  } else if (muxers) {
    return mapMuxers(muxers)
  } else {
    return [MPLEX, SPDY]
  }
}

class Node extends libp2p {
  constructor (_options) {
    const options = {
      modules: {
        transport: [
          TCP,
          WS
        ],
        streamMuxer: getMuxers(_options.muxer),
        connEncryption: [
          SECIO
        ],
        peerDiscovery: [
          MulticastDNS,
          Bootstrap
        ],
        peerRouting: [],
        contentRouting: [],
        DHT: KadDHT
      },
      config: {
        peerDiscovery: {
          mdns: {
            interval: 10000,
            enabled: false
          },
          bootstrap: {
            interval: 10000,
            enabled: false,
            list: _options.bootstrapList
          }
        },
        peerRouting: {},
        contentRouting: {},
        dht: {
          kBucketSize: 20
        }
      },
      EXPERIMENTAL: {
        dht: false,
        pubsub: false
      }
    }

    defaultsDeep(options, _options)

    super(options)
  }
}

module.exports = Node
