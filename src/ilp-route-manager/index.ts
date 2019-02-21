import { Relation } from '../types/relation'
import { IlpReply, IlpPrepare } from 'ilp-packet'
import { Router } from '../ilp-router'
import { Peer } from './peer'
import { CcpRouteUpdateRequest, CcpRouteControlRequest } from 'ilp-protocol-ccp'
import { IncomingRoute } from '../types/routing'

export class RouteManager {

  private peers: Map<string, Peer> = new Map()
  private router: Router

  constructor (router: Router) {
    this.router = router
  }

  // Possibly also allow a route to be added defaulted?
  addPeer (peerId: string, relation: Relation) {
    const peer = new Peer({ peerId: peerId, relation: relation })
    this.peers.set(peerId, peer)
  }

  getPeer (peerId: string) {
    return this.peers.get(peerId)
  }

  removePeer (peerId: string) {
    this.peers.delete(peerId)
  }

  // Do a check if the peerId exists as a peer and then also add the route to the routing table
  addRoute (peerId: string, route: IncomingRoute) {
    if (this.getPeer(peerId)) {
      this.router.addRoute(peerId, route)
    } else {
      console.log('no peer found to add route for')
    }
  }

}
