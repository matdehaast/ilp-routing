import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router } from '../src';
import { RouteManager } from '../src/ilp-route-manager'
import { CcpRouteUpdateRequest, CcpRoute } from 'ilp-protocol-ccp';
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

  // describe('CCP Updates', function () {
  //   let routeManager: RouteManager

  //   beforeEach(function() {
  //     routeManager = new RouteManager(router)
  //     routeManager.addPeer('harry', 'peer')
  //   })

  //   it('incoming route update adds route to peer routing table', function() {
  //     const newRoute = {
  //       prefix: 'g.new.route',
  //       path: [],
  //       auth: Buffer.from(''),
  //       props: []
  //     } as CcpRoute

  //     const ccpUpdateRequest = {
  //       speaker: 'string',
  //       routingTableId: '3b069822-a754-4e44-8a60-0f9f7084144d',
  //       currentEpochIndex: 5,
  //       fromEpochIndex: 0,
  //       toEpochIndex: 5,
  //       holdDownTime: 45000,
  //       newRoutes: [newRoute],
  //       withdrawnRoutes: new Array<string>(),
  //     } as CcpRouteUpdateRequest

  //     routeManager.handleCCPRouteUpdate('harry', ccpUpdateRequest)

  //     const peer = routeManager.getPeer('harry')
  //     if(peer) {
  //       assert.deepEqual(peer.getPrefix('g.new.route'), {
  //         prefix: 'g.new.route',
  //         path: []
  //       })
  //       return
  //     }
  //     throw Error('Peer not found')
  //   })

  //   it('incoming route update with withdrawn routes removes route in peer routing table', function() {
  //     const peer = routeManager.getPeer('harry')
  //     if(peer) {
  //       peer.insertRoute({
  //         prefix: 'g.new.route',
  //         path: [],
  //       })
  //       assert.isDefined(peer.getPrefix('g.new.route'))

  //       const ccpUpdateRequest = {
  //         speaker: 'string',
  //         routingTableId: '3b069822-a754-4e44-8a60-0f9f7084144d',
  //         currentEpochIndex: 5,
  //         fromEpochIndex: 0,
  //         toEpochIndex: 5,
  //         holdDownTime: 45000,
  //         newRoutes: [],
  //         withdrawnRoutes: ['g.new.route'],
  //       } as CcpRouteUpdateRequest
  
  //       routeManager.handleCCPRouteUpdate('harry', ccpUpdateRequest)
  //       assert.isUndefined(peer.getPrefix('g.new.route'))
  //       return
  //     }
  //     throw Error('Peer not found')
  //   })
  // })
})