import * as Chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import { Router, PeerController } from '../src';
import { Peer } from '../src/ilp-router/peer';
import { CcpRouteUpdateRequest, CcpRoute, CcpRouteControlRequest, Mode } from 'ilp-protocol-ccp'
import CcpSender, { Relation } from '../src/ilp-peer-controller/ccp-sender';
import ForwardingRoutingTable, { RouteUpdate } from '../src/ilp-router/forwarding-routing-table'
import { filter } from 'minimatch';
import { IlpPrepare, IlpReply, IlpReject } from 'ilp-packet';
Chai.use(chaiAsPromised)
const assert = Object.assign(Chai.assert, sinon.assert)

const dummyHandler = ()  => Promise.resolve('Test')
const dummyPeerResolver = (peerId: string) => 'parent' as Relation
const dummySendData = (packet: IlpPrepare) => Promise.resolve({data: Buffer.from(''), fulfillment: Buffer.from('')} as IlpReply)
const forwardingRoutingTable = new ForwardingRoutingTable;
describe('ilp-peer-controller', function () {

  describe('instantiation', function () {

    it('creates sender if sender set to true', function (){
      const peerController = new PeerController({
        peerId: 'harry',
        ccpRequestHandler: dummyHandler, 
        isSender: true,
        getPeerRelation: dummyPeerResolver,
        sendData: dummySendData,
        forwardingRoutingTable: forwardingRoutingTable
      })

      assert.isDefined(peerController.getSender())
      assert.isUndefined(peerController.getReceiver())
    })

    it('creates receiver if receiver set to true', function (){
      const peerController = new PeerController({
        peerId: 'harry',
        ccpRequestHandler: dummyHandler, 
        isReceiver: true,
        getPeerRelation: dummyPeerResolver,
        sendData: dummySendData,
        forwardingRoutingTable: forwardingRoutingTable
      })

      assert.isDefined(peerController.getReceiver())
      assert.isUndefined(peerController.getSender())
    })
  })

  describe('receiving', function() {
    let peerController: PeerController

    beforeEach(function() {
      peerController = new PeerController({
        peerId: 'harry',
        ccpRequestHandler: dummyHandler, 
        isReceiver: true,
        getPeerRelation: dummyPeerResolver,
        sendData: dummySendData,
        forwardingRoutingTable: forwardingRoutingTable
      })
    })

    it('can receive a routeUpdate from a sender', function () {
      const ccpUpdateRequest = {
        speaker: 'string',
        routingTableId: '3b069822-a754-4e44-8a60-0f9f7084144d',
        currentEpochIndex: 5,
        fromEpochIndex: 0,
        toEpochIndex: 5,
        holdDownTime: 45000,
        newRoutes: new Array<CcpRoute>(),
        withdrawnRoutes: new Array<string>(),
      } as CcpRouteUpdateRequest

      peerController.handleRouteUpdate(ccpUpdateRequest)

      const receiver = peerController.getReceiver()
      if(receiver) {
        assert.equal(receiver.getRoutingTableId(), ccpUpdateRequest.routingTableId)
      } else {
        assert.fail()
      }
    })

    it('receiving a new route adds a route to the routing table', function () {
      const receiver = peerController.getReceiver()
      const newRoute = {
        prefix: 'g.new.route',
        path: [],
        auth: Buffer.from(''),
        props: []
      } as CcpRoute

      const ccpUpdateRequest = {
        speaker: 'string',
        routingTableId: '3b069822-a754-4e44-8a60-0f9f7084144d',
        currentEpochIndex: 5,
        fromEpochIndex: 0,
        toEpochIndex: 5,
        holdDownTime: 45000,
        newRoutes: [newRoute],
        withdrawnRoutes: new Array<string>(),
      } as CcpRouteUpdateRequest
      if(receiver) {
        assert.isFalse(receiver.getPrefixes().includes('g.new.route'))
      }

      peerController.handleRouteUpdate(ccpUpdateRequest)

      if(receiver) {
        assert.isTrue(receiver.getPrefixes().includes('g.new.route'))
      } else {
        assert.fail()
      }
    })

    it('receiving a withdrawn route removes it from the routing table', function () {
      const receiver = peerController.getReceiver()
      const newRoute = {
        prefix: 'g.new.route',
        path: [],
        auth: Buffer.from(''),
        props: []
      } as CcpRoute
      const ccpUpdateRequest = {
        speaker: 'string',
        routingTableId: '3b069822-a754-4e44-8a60-0f9f7084144d',
        currentEpochIndex: 1,
        fromEpochIndex: 0,
        toEpochIndex: 1,
        holdDownTime: 45000,
        newRoutes: [newRoute],
        withdrawnRoutes: new Array<string>(),
      } as CcpRouteUpdateRequest
      peerController.handleRouteUpdate(ccpUpdateRequest)
      if(receiver) {
        assert.isTrue(receiver.getPrefixes().includes('g.new.route'))
      }

      const ccpUpdateRequestWithdrawn = {
        ...ccpUpdateRequest, 
        currentEpochIndex: 2, 
        fromEpochIndex: 1, 
        toEpochIndex: 2,
        newRoutes: new Array<CcpRoute>(),
        withdrawnRoutes: ['g.new.route']
      }

      peerController.handleRouteUpdate(ccpUpdateRequestWithdrawn)

      if(receiver) {
        assert.isFalse(receiver.getPrefixes().includes('g.new.route'))
      } else {
        assert.fail()
      }
    })

    //TODO: Test the epoch stuff.

    //TODO: Test the routeControlSend functionality
    describe('send route control', function() {
      
    
      it('calls sendData method passed into Peer Controller', async function(done) {
        peerController = new PeerController({
          peerId: 'harry',
          ccpRequestHandler: dummyHandler, 
          isReceiver: true,
          getPeerRelation: dummyPeerResolver,
          sendData: (packet: IlpPrepare) => {
            return new Promise((resolve, reject) => {
              done()
            })
          },
          forwardingRoutingTable: forwardingRoutingTable
        })
        const receiver = peerController.getReceiver()
        if(receiver) {
          receiver.sendRouteControl()
        }
      })

      it('resolve correctly for IlpFulfill reply to sendData', function() {
        peerController = new PeerController({
          peerId: 'harry',
          ccpRequestHandler: dummyHandler, 
          isReceiver: true,
          getPeerRelation: dummyPeerResolver,
          sendData: (packet: IlpPrepare) => {
            return new Promise((resolve, reject) => {
              resolve({data: Buffer.from(''), fulfillment: Buffer.from('')} as IlpReply)
            })
          },
          forwardingRoutingTable: forwardingRoutingTable
        })
        const receiver = peerController.getReceiver()
        if(receiver) {
          receiver.sendRouteControl()
        }
      })
    })
      // TODO: add test to ensure IlpReject, unknown packet and sendData error cause a new sendRouteControl to be sent in future.
  })

  describe('sender', function() {
    let peerController: PeerController
    let sender: CcpSender

    beforeEach(function() {
      peerController = new PeerController({
        peerId: 'harry',
        ccpRequestHandler: dummyHandler, 
        isSender: true,
        getPeerRelation: dummyPeerResolver,
        sendData: dummySendData,
        forwardingRoutingTable: forwardingRoutingTable
      })
      sender = peerController.getSender() as CcpSender
    })

    it('can send a routeControlUpdate', function () {
      const sender = peerController.getSender()
    })

    describe('handle route control messages', function () {

      it('sets syncing mode based on control message', function () {
          const routeControlUpdate = {
            mode: Mode.MODE_SYNC,
            lastKnownRoutingTableId: '1',
            lastKnownEpoch: 0,
            features: []
          } as CcpRouteControlRequest
          assert.equal(sender.getMode(), Mode.MODE_IDLE)

          peerController.handleRouteControl(routeControlUpdate)
  
          assert.equal(sender.getMode(), Mode.MODE_SYNC)
      })

      it('reset epoch if routing table id changes', function () {
        const routeControlUpdate = {
          mode: Mode.MODE_SYNC,
          lastKnownRoutingTableId: sender.getRoutingTableId(),
          lastKnownEpoch: 12,
          features: []
        } as CcpRouteControlRequest
        peerController.handleRouteControl(routeControlUpdate)
        assert.equal(sender.getLastKnownEpoch(), routeControlUpdate.lastKnownEpoch)

        peerController.handleRouteControl({...routeControlUpdate, lastKnownEpoch: 0, lastKnownRoutingTableId: '123'} as CcpRouteControlRequest)

        assert.equal(sender.getLastKnownEpoch(), 0)
      })

      it('schedules update if sync mode is SYNC', function ( ) {
        const spy = sinon.spy(sender, 'scheduleRouteUpdate')
        const routeControlUpdate = {
          mode: Mode.MODE_SYNC,
          lastKnownRoutingTableId: sender.getRoutingTableId(),
          lastKnownEpoch: 12,
          features: []
        } as CcpRouteControlRequest
        peerController.handleRouteControl(routeControlUpdate)

        assert.isTrue(spy.calledOnce)
      })

      it('does not schedule update if sync mode is IDLE', function ( ) {
        const spy = sinon.spy(sender, 'scheduleRouteUpdate')
        const routeControlUpdate = {
          mode: Mode.MODE_IDLE,
          lastKnownRoutingTableId: sender.getRoutingTableId(),
          lastKnownEpoch: 12,
          features: []
        } as CcpRouteControlRequest
        peerController.handleRouteControl(routeControlUpdate)

        assert.isTrue(spy.notCalled)
      })

    })


    describe('schedule route update', function () {
      it('schedules according to interval if epoch are in sync', function () {

      })

      it('schedules immediately if epoch is out of sync', function () {

      })
    })

    describe('sendSingleRouteUpdate', function() {

      it.skip('updates last sent at time', async function() {
        assert.equal(sender.getLastUpdate(), 0)

        await sender['sendSingleRouteUpdate']()
        console.log(sender.getLastUpdate());
        assert.isAbove(sender.getLastUpdate(), 0)
      })

      describe('filters routes before sending updates', function() {
        let peerController: PeerController
        let sender: CcpSender

        beforeEach(function() {
          const peerRelations = {
            'harry': 'parent',
            'harry2': 'parent',
            'sally': 'peer',
            'ira': 'peer',
            'helen': 'child',
          }

          peerController = new PeerController({
            peerId: 'harry',
            ccpRequestHandler: dummyHandler, 
            isSender: true,
            getPeerRelation: (peerId: string) => peerRelations[peerId],
            sendData: dummySendData,
            forwardingRoutingTable: forwardingRoutingTable
          })
          sender = peerController.getSender() as CcpSender
        })

        it('filters out none route updates', function() {
          const routeUpdates: (RouteUpdate | null)[] = [
            null
          ]
          assert.equal(routeUpdates.length, 1)

          const filteredUpdates = sender['filterRoutes'](routeUpdates)

          assert.equal(filteredUpdates.length, 0)
        })

        it('does not filter out updates with a null route', function() {
          const routeUpdate: RouteUpdate = {
            epoch: 1,
            prefix: 'g.route.test'
          }
          const routeUpdates: (RouteUpdate | null)[] = [
            routeUpdate
          ]
          assert.equal(routeUpdates.length, 1)

          const filteredUpdates = sender['filterRoutes'](routeUpdates)

          assert.equal(filteredUpdates.length, 1)
          assert.deepEqual(filteredUpdates[0],routeUpdate)
        })

        it('filters out route where peer is next hop', function() {
          const routeUpdate: RouteUpdate = {
            epoch: 1,
            prefix: 'g.route.test',
            route: {
              nextHop: 'harry',
              path: []
            }
          }
          const routeUpdates: (RouteUpdate | null)[] = [
            routeUpdate
          ]
          assert.equal(routeUpdates.length, 1)

          const filteredUpdates = sender['filterRoutes'](routeUpdates)

          assert.equal(filteredUpdates.length, 1)
          assert.deepEqual(filteredUpdates[0], {...routeUpdate, route: undefined})
        })

        it('does not filter out other updates', function() {
          const routeUpdate: RouteUpdate = {
            epoch: 1,
            prefix: 'g.route.test',
            route: {
              nextHop: 'helen',
              path: []
            }
          }
          const routeUpdates: (RouteUpdate | null)[] = [
            routeUpdate
          ]
          assert.equal(routeUpdates.length, 1)

          const filteredUpdates = sender['filterRoutes'](routeUpdates)

          assert.equal(filteredUpdates.length, 1)
          assert.deepEqual(filteredUpdates[0], {...routeUpdate})
        })

        it('filters out peer routes sent to parent', function() {
          const routeUpdate: RouteUpdate = {
            epoch: 1,
            prefix: 'g.route.test',
            route: {
              nextHop: 'sally',
              path: []
            }
          }
          const routeUpdates: (RouteUpdate | null)[] = [
            routeUpdate
          ]
          assert.equal(routeUpdates.length, 1)

          const filteredUpdates = sender['filterRoutes'](routeUpdates)

          assert.equal(filteredUpdates.length, 1)
          assert.deepEqual(filteredUpdates[0], {...routeUpdate, route: undefined})
        })

        it('filters out other parent routes sent to parent', function() {
          const routeUpdate: RouteUpdate = {
            epoch: 1,
            prefix: 'g.route.test',
            route: {
              nextHop: 'harry2',
              path: []
            }
          }
          const routeUpdates: (RouteUpdate | null)[] = [
            routeUpdate
          ]
          assert.equal(routeUpdates.length, 1)

          const filteredUpdates = sender['filterRoutes'](routeUpdates)

          assert.equal(filteredUpdates.length, 1)
          assert.deepEqual(filteredUpdates[0], {...routeUpdate, route: undefined})
        })

      })
    })

  })
})