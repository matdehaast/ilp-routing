import CcpReceiver from './ccp-receiver'
import CcpSender, { Relation } from './ccp-sender'
import { CcpRouteControlRequest, CcpRouteUpdateRequest } from 'ilp-protocol-ccp'
import ForwardingRoutingTable from '../ilp-router/forwarding-routing-table'
import { IlpPacket, IlpPrepare, IlpReply } from 'ilp-packet'

export interface PeerControllerOps {
  peerId: string,
  isSender?: boolean,
  isReceiver?: boolean,
  ccpRequestHandler: (ccpRequest: any) => Promise<any>,
  sendData: (packet: IlpPrepare) => Promise<IlpReply>,
  getPeerRelation: (peerId: string) => Relation,
  forwardingRoutingTable: ForwardingRoutingTable
}

export class PeerController {

  private ccpSender?: CcpSender
  private ccpReceiver?: CcpReceiver
  private ccpRequestHandler: (ccpRequest: any) => Promise<any>
  sendData: (packet: IlpPrepare) => Promise<IlpReply>

  constructor (options: PeerControllerOps) {

    // TODO: Not currently using this piece of code. Need to see why I needed it.
    this.ccpRequestHandler = options.ccpRequestHandler

    this.sendData = options.sendData

    if (options.isSender) {
      this.ccpSender = new CcpSender({
        peerId: options.peerId,
        forwardingRoutingTable: options.forwardingRoutingTable,
        getPeerRelation: options.getPeerRelation,
        routeBroadcastInterval: 30000,
        routeExpiry: 45000,
        sendData: this.sendData
      })
    }

    // Setup receiver
    if (options.isReceiver) {
      this.ccpReceiver = new CcpReceiver({
        sendData: this.sendData,
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
