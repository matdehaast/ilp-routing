import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Peer } from '../src/ilp-route-manager/peer';
import { IncomingRoute } from '../src/types/routing';
Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

describe('ilp-peer', function () {
  let peer: Peer

  beforeEach(function() {
    peer = new Peer({
      peerId: 'harry',
      relation: 'peer'
    })
  })

  it('can insert a route', function () {
    const incomingRoute: IncomingRoute = {
      prefix: 'g.harry',
      path: []
    }
    assert.isUndefined(peer.getPrefix('g.harry'))

    peer.insertRoute(incomingRoute)

    assert.deepEqual(peer.getPrefix('g.harry'), incomingRoute)
  })

  it('can delete a route', function () {
    const incomingRoute: IncomingRoute = {
      prefix: 'g.harry',
      path: []
    }
    peer.insertRoute(incomingRoute)
    assert.isDefined(peer.getPrefix('g.harry'))

    peer.deleteRoute('g.harry')

    assert.isUndefined(peer.getPrefix('g.harry'))
  })

  it('can get a route', function () {
    peer.insertRoute({
      prefix: 'g.harry',
      path: []
    })
    peer.insertRoute({
      prefix: 'g.sally',
      path: []
    })

    assert.deepEqual(peer.getPrefix('g.harry'), {
      prefix: 'g.harry',
      path: []
    })
    assert.deepEqual(peer.getPrefix('g.sally'), {
      prefix: 'g.sally',
      path: []
    })
  })
})