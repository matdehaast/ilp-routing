import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router } from '../src';
import { RouteManager } from '../src/ilp-route-manager'
import { CcpRouteUpdateRequest, CcpRoute } from 'ilp-protocol-ccp';
import { Peer } from '../src/ilp-route-manager/peer';
Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

describe('ilp-route-manager', function () {
  let router: Router

  beforeEach(function () {
    router = new Router()
  })

  describe('instantiation', function () {

    it('can be instantiated', function () {
      let routeManager = new RouteManager(router)

      assert.instanceOf(routeManager, RouteManager)
    })
  })

  describe('peer', function () {
    it('can add a peer', function () {
      let routeManager = new RouteManager(router)

      routeManager.addPeer('harry', 'peer')

      const peer = routeManager.getPeer('harry')
      assert.isDefined(routeManager.getPeer('harry'))
      assert.instanceOf(peer, Peer)
    })

    it('can remove a peer', function () {
      let routeManager = new RouteManager(router)

      routeManager.removePeer('harry')

      assert.isUndefined(routeManager.getPeer('harry'))
    })
  })

  describe('route', function () {
    let routeManager: RouteManager
    let peer: Peer | undefined

    beforeEach(function () {
      routeManager = new RouteManager(router)
      routeManager.addPeer('harry', 'peer')
      peer = routeManager.getPeer('harry')
    })

    it('adding a route adds it to peer routing table', function () {
      routeManager.addRoute({
        peer: 'harry',
        prefix: 'g.harry',
        path: []
      })

      const route = peer!.getPrefix('g.harry')

      assert.deepEqual(route, {
        peer: 'harry',
        prefix: 'g.harry',
        path: []
      })
    })

    it('removing a route removes from peer routing table', function () {
      routeManager.addRoute({
        peer: 'harry',
        prefix: 'g.harry',
        path: []
      })

      routeManager.removeRoute('harry', 'g.harry')

      const route = peer!.getPrefix('g.harry')
      assert.isUndefined(route)
    })

    it('does not add a route for a peer that does not exist', function () {
      let routeManager = new RouteManager(router)

      routeManager.addRoute({
        peer: 'harry',
        prefix: 'g.harry',
        path: []
      })

      let nextHop = router.getRoutingTable().get('g.harry')
      assert.isUndefined(nextHop)
    })
  })
})