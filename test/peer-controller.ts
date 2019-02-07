import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router, PeerController } from '../src';
import { Peer } from '../src/ilp-router/peer';
Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

const dummyHandler = ()  => Promise.resolve('Test')

describe('ilp-peer-controller', function () {

  it('constructor', function () {
    const peerController = new PeerController({})
    assert.isTrue(true)
  })

})