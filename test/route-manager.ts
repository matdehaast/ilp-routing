import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router, PeerController } from '../src';
import { Peer } from '../src/ilp-router/peer';
import { CcpRouteUpdateRequest, CcpRoute, CcpRouteControlRequest, Mode } from 'ilp-protocol-ccp'
import CcpSender, { Relation } from '../src/ilp-peer-controller/ccp-sender';
import ForwardingRoutingTable, { RouteUpdate } from '../src/ilp-router/forwarding-routing-table'
import { IlpPrepare, IlpReply, IlpReject } from 'ilp-packet';

import { RouteManager } from '../src/ilp-route-manager'

Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

const dummyHandler = ()  => Promise.resolve('Test')
const dummyPeerResolver = (peerId: string) => 'parent' as Relation
const dummySendData = (packet: IlpPrepare) => Promise.resolve({data: Buffer.from(''), fulfillment: Buffer.from('')} as IlpReply)

describe('ilp-route-manager', function () {
  let router: Router

  beforeEach(function () {
    router = new Router()
  })

  describe('instantiation', function () {

    it('can be instantiated', function () {
      let routeManager = new RouteManager(router)
    })
  })

  describe('peer', function () {
    it('can add a peer', function () {
      let routeManager = new RouteManager(router)

      routeManager.addPeer('harry', 'peer')

      assert.isDefined(routeManager.getPeer('harry'))
    })

    it('can remove a peer', function () {
      let routeManager = new RouteManager(router)

      routeManager.removePeer('harry')

      assert.isUndefined(routeManager.getPeer('harry'))
    })
  })

  describe('route', function () {
    it('can add a route', function () {
      let routeManager = new RouteManager(router)

      routeManager.addPeer('harry', 'peer')
      routeManager.addRoute('harry', {
        prefix: 'g.harry',
        path: []
      })

      let nextHop = router.getRoutingTable().get('g.harry')
      assert.deepEqual(nextHop, {
        nextHop: 'harry',
        path: []
      })
    })

    it('does not add a route for a peer that does not exist', function () {
      let routeManager = new RouteManager(router)

      routeManager.addRoute('harry', {
        prefix: 'g.harry',
        path: []
      })

      let nextHop = router.getRoutingTable().get('g.harry')
      assert.isUndefined(nextHop)
    })
  })
})