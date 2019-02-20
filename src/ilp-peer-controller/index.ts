import CcpSender from './ccp-sender'
import { CcpRouteControlRequest, CcpRouteUpdateRequest } from 'ilp-protocol-ccp'
import ForwardingRoutingTable from '../ilp-router/forwarding-routing-table'
import { IlpPacket, IlpPrepare, IlpReply } from 'ilp-packet'
import PrefixMap from '../lib/prefix-map'
import { IncomingRoute } from '../types/routing'
import { Relation } from '../types/relation'

export interface PeerOpts {
  peerId: string,
  relation: Relation
}

export class Peer {

  private peerId: string
  private relation: Relation
  private routes: PrefixMap<IncomingRoute>

  constructor (options: PeerOpts) {
    this.peerId = options.peerId
    this.relation = options.relation

    // TODO: Possibly inefficient instantiating this if not a ccp-receiver? Though the code is quite clean without needing to pass the data to here
    this.routes = new PrefixMap()
  }

}
