import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router, PeerController } from '../src';
import { Peer } from '../src/ilp-router/peer';
import { AssertionError } from 'assert';
Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

describe('ilp-router', function () {

  describe('peer', function () {

    it('can add a peer', function () {
      const router = new Router()

      router.addPeer('harry', 'peer')

      const peer = router.getPeer('harry')
      
      assert.instanceOf(peer, Peer)
    })

    it('can remove a peer', function () {
      const router = new Router()
      router.addPeer('harry', 'peer')

      router.removePeer('harry')

      const peer = router.removePeer('harry')
      
      assert.notInstanceOf(peer, Peer)
    })
  })

  describe('routes', function() {

    let router: Router

    beforeEach( function() {
      router = new Router()
      router.addPeer('harry', 'peer')
    })

    it('can add a route for a peer', function() {
      router.addRoute('harry', {
          prefix: 'g.harry',
          path: [],
      })

      const table = router.getRoutingTable()

      assert.isTrue(table.keys().includes('g.harry'))
      assert.deepEqual(table.resolve('g.harry.sally'), {
        nextHop: 'harry',
        path: []
      })
    })

    it('can remove a route for a peer', function() {
      router.addRoute('harry', {
        prefix: 'g.harry',
        path: [],
      })

      router.removeRoute('g.harry')

      const table = router.getRoutingTable()
      assert.isFalse(table.keys().includes('g.harry'))
      assert.isUndefined(table.resolve('g.harry.sally'))
    })

    it('throws an error if trying to add a route for a peer that does not exist', function () {

    })
  })

  describe('nextHop', function() {
    let router: Router

    beforeEach( function() {
      router = new Router()
      router.addPeer('harry', 'peer')
      router.addRoute('harry', {
        prefix: 'g.harry',
        path: [],
      })
    })

    it('returns peerId if nextHop called for route to a peer', function() {
      const nextHop = router.nextHop('g.harry.met.sally')
      assert.equal(nextHop, 'harry')
    })

    it('throws an error if can\'t route request', function() {
      assert.throws(() => router.nextHop('g.sally'))
    })
  })

  describe('weighting', function() {

  })
})