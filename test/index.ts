import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router, PeerController } from '../src';
import { Peer } from '../src/ilp-router/peer';
Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

const dummyHandler = ()  => Promise.resolve('Test')

describe('ilp-router', function () {

  describe('peer', function () {
    it('can add a peer', function () {
      const router = new Router()

      router.addPeer('harry', 'peer', dummyHandler)

      const peer = router.getPeer('harry')
      
      assert.instanceOf(peer, Peer)
    })

    it('can remove a peer', function () {
      const router = new Router()
      router.addPeer('harry', 'peer', dummyHandler)

      router.removePeer('harry')

      const peer = router.removePeer('harry')
      
      assert.notInstanceOf(peer, Peer)
    })
  })

  describe('routes', function() {

    let router: Router

    beforeEach( function() {
      router = new Router()
      router.addPeer('harry', 'peer', dummyHandler)
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

  describe('request', function() {
    let router: Router

    beforeEach( function() {
      router = new Router()
      router.addPeer('harry', 'peer', (payload) => Promise.resolve(payload))
      router.addRoute('harry', {
        prefix: 'g.harry',
        path: [],
      })
    })

    it('calls peers handler if request called for route to a peer', async function() {
      const payload = {
        test: 123
      }

      const response = await router.request('g.harry.met.sally', payload)
      assert.deepEqual(response, payload)
    })

    it('throws an error if can\'t route request', async function() {
      const payload = {
        test: 123
      }

      return Chai.expect( router.request('g.sally', payload)).to.be.rejected
    })
  })

  describe('weighting', function() {

  })
})