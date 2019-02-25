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

  getPrefix (prefix: string): IncomingRoute | undefined {
    return this.routes.get(prefix)
  }

  insertRoute (route: IncomingRoute) {
    this.routes.insert(route.prefix, route)

    // TODO Check if actually changed
    return true
  }

  deleteRoute (prefix: string) {
    this.routes.delete(prefix)

    // TODO Check if actually changed
    return true
  }

  getPrefixes () {
    return this.routes.keys()
  }

  getRelation (): Relation {
    return this.relation
  }
}
