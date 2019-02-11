import CcpReceiver from './ccp-receiver'
import CcpSender, { Relation } from './ccp-sender'
import { CcpRouteControlRequest, CcpRouteUpdateRequest } from 'ilp-protocol-ccp'
import ForwardingRoutingTable from '../ilp-router/forwarding-routing-table'

export interface PeerControllerOps {
  peerId: string,
  isSender?: boolean,
  isReceiver?: boolean,
  ccpRequestHandler: (ccpRequest: any) => Promise<any>,
  getPeerRelation: (peerId: string) => Relation
}

export class PeerController {

  private ccpSender?: CcpSender
  private ccpReceiver?: CcpReceiver
  private ccpRequestHandler: (ccpRequest: any) => Promise<any>

  constructor (options: PeerControllerOps) {

    this.ccpRequestHandler = options.ccpRequestHandler

    if (options.isSender) {
      this.ccpSender = new CcpSender({
        peerId: options.peerId,
        forwardingRoutingTable: new ForwardingRoutingTable(),
        getPeerRelation: options.getPeerRelation,
        routeBroadcastInterval: 30000,
        routeExpiry: 45000
      })
    }

    // Setup receiver
    if (options.isReceiver) {
      this.ccpReceiver = new CcpReceiver({
        handleData: () => 'test'
      })
    }
  }

  /**
   * Pass route control request to underlying ccp-sender
   * @param routeControl CCP Route Control Request
   */
  handleRouteControl (routeControl: CcpRouteControlRequest) {
    if (!this.ccpSender) {
      return
      // log.debug('received route control message from peer not authorized to receive routes from us (sendRoutes=false). sourceAccount=%s', sourceAccount)
      // throw new BadRequestError('rejecting route control message, we are configured not to send routes to you.')
    }

    this.ccpSender.handleRouteControl(routeControl)
  }

  /**
   * Pass route update request to underlying ccp-receiver
   * @param routeUpdate CCP Route Control Update
   */
  handleRouteUpdate (routeUpdate: CcpRouteUpdateRequest) {
    if (!this.ccpReceiver) {
      return
    }

    this.ccpReceiver.handleRouteUpdate(routeUpdate)
  }

  getSender () {
    return this.ccpSender
  }

  getReceiver () {
    return this.ccpReceiver
  }

}
