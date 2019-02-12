import { Relation } from '../ilp-peer-controller/ccp-sender'

export type RequestHandler = (payload: any) => Promise<any>

export class Peer {

  private relation: Relation
  private requestHandler: RequestHandler | undefined

  constructor (relation: Relation) {
    this.relation = relation
  }

  setHandler (handler: RequestHandler) {
    this.requestHandler = handler
  }

  removeHandler () {
    this.requestHandler = undefined
  }

  handleRequest (payload: any) {
    if (this.requestHandler) {
      return this.requestHandler(payload)
    } else {
      throw new Error('No request handler defined for Peer')
    }
  }
}
