import { Router, PeerController } from '../src'
import { IlpPrepare, IlpFulfill } from 'ilp-packet'
import { Relation } from '../src/ilp-peer-controller/ccp-sender'
import { IncomingRoute } from '../src/types/routing';

const router = new Router()

// sally data handler
const sallyHandler = (data: any) => new Promise((resolve, reject) => {
  console.log(data)
  resolve('data')
})

router.addPeer('sally', 'peer', sallyHandler)

router.addRoute('sally', { prefix: 'g.sally', path: [] })

const peer = new PeerController({
  peerId: 'sally',
  isSender: false,
  isReceiver: true,
  ccpRequestHandler: (data: any) => Promise.resolve(''),
  forwardingRoutingTable: router.getForwardingRoutingTable(),
  sendData: (packet: IlpPrepare) => Promise.resolve({ data: Buffer.from(''), fulfillment: Buffer.from('') } as IlpFulfill),
  getPeerRelation: (value: string) => 'peer'
})

const receiver = peer.getReceiver()

if (receiver) {
  const prefixes = receiver.handleRouteUpdate({
    speaker: 'sally',
    routingTableId: '21231231-12312',
    fromEpochIndex: 0,
    toEpochIndex: 2,
    holdDownTime: 2000,
    currentEpochIndex: 2,
    newRoutes: [{
      prefix: 'g.irene',
      path: ['g.sally'],
      auth: Buffer.from(''),
      props: []
    }],
    withdrawnRoutes: []
  })

  console.log(prefixes)

  prefixes.map(prefix => {
    console.log('adding route for prefix ' + prefix)
    router.addRoute('sally', { prefix: prefix, path: [] } as IncomingRoute)
  })
}

console.log(router.getRoutingTable())

const func = async () => {
  const reply = await router.request('g.sally', { mat: 'isHere' })
  const reply1 = await router.request('g.harry', { mat: 'isHere' }).catch(err => console.log(err))
  console.log(reply, reply1)
}

func()