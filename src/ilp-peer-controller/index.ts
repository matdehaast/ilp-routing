import CcpReceiver from './ccp-receiver'
import CcpSender from './ccp-sender'

export interface PeerControllerOps {
  isSender?: boolean,
  isReceiver?: boolean
}

export class PeerController {

  private ccpSender?: CcpSender
  private ccpReceiver?: CcpReceiver

  constructor (options: PeerControllerOps) {

    // Setup sender
    // if (options.isSender) {
    //   this.ccpSender = new CcpSender()
    // }

    // Setup receiver
    // if (options.isReceiver) {
    //   this.ccpSender = new CcpReceiver()
    // }

  }
}
