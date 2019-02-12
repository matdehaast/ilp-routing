import { Peer, RequestHandler } from './peer'
import RoutingTable from './routing-table'
import { Route, IncomingRoute } from '../types/routing'
import ForwardingRoutingTable, { RouteUpdate } from './forwarding-routing-table'
import { canDragonFilter } from '../lib/dragon'

/**
 * Terminology definitions
 * @param prefix equivalent to ILP address.
 */

export class Router {

  private peers: Map<string, Peer>
  private ownAddress: string
  private routingTable: RoutingTable
  private forwardingRoutingTable: ForwardingRoutingTable

  constructor () {
    this.routingTable = new RoutingTable()
    this.forwardingRoutingTable = new ForwardingRoutingTable()
    this.peers = new Map()
  }

  addPeer (name: string, handler: RequestHandler) {
    const peer = new Peer()
    peer.setHandler(handler)
    this.peers.set(name, peer)
  }

  removePeer (name: string) {
    this.peers.delete(name)
  }

  getPeer (name: string) {
    return this.peers.get(name)
  }

  setOwnAddress (address: string) {
    this.ownAddress = address
  }

  getOwnAddress () {
    return this.ownAddress
  }

  addRoute (peer: string, route: IncomingRoute) {
    this.updateLocalRoute(route.prefix, {
      nextHop: peer,
      path: route.path
    })
  }

  removeRoute (prefix: string) {
    this.updateLocalRoute(prefix)
  }

  getRoutingTable (): RoutingTable {
    return this.routingTable
  }

  request (prefix: string, payload: any): Promise<any> {
    return new Promise((resolve,reject) => {
      const route = this.routingTable.resolve(prefix)
      const nextHop = route && route.nextHop
      if (nextHop) {
        const peer = this.peers.get(nextHop)
        if (peer) {
          resolve(peer.handleRequest(payload))
        }
      } else {
        reject("Can't route the request due to no route found for given prefix")
      }
    })
  }

  /**
   * SECTIONAL BLOCK FOR ROUTING LOGIC. TODO: refactor and move to an appropriate space
   */

  /**
   * get best peer for prefix and updateLocalRoute based on the new route
   * @param prefix prefix
   */
  updatePrefix (prefix: string) {
    const newBest = this.getBestPeerForPrefix(prefix)

    // return this.updateLocalRoute(prefix, newBest)
  }

  /**
   * Find the best peer for the prefix routing to
   * 1. Ideal to use configure routes
   * 2. Else look in localRoutes as built before to find exact route
   * 3. If not exact route need to find 'bestRoute' based on peers
   * @param prefix prefix
   */
  getBestPeerForPrefix (prefix: string): Route | undefined | void {
    // TODO: Do we need statically configured routes?
    // configured routes have highest priority
    // const configuredRoute = find(this.config.routes, { targetPrefix: prefix })
    // if (configuredRoute) {
    //   if (this.accounts.exists(configuredRoute.peerId)) {
    //     return {
    //       nextHop: configuredRoute.peerId,
    //       path: [],
    //       auth: hmac(this.routingSecret, prefix)
    //     }
    //   } else {
    //     log.warn('ignoring configured route, account does not exist. prefix=%s accountId=%s', configuredRoute.targetPrefix, configuredRoute.peerId)
    //   }
    // }

    // TODO: statically configured routes
    // const localRoute = this.localRoutes.get(prefix)
    // if (localRoute) {
    //   return localRoute
    // }

    // TODO: Weighting based on relationship. Should a peer have a relationship?
    // const weight = (route: IncomingRoute) => {
    //   const relation = this.getAccountRelation(route.peer)
    //   return getRelationPriority(relation)
    // }

    // Loop through all the peers and there
    // const bestRoute = Array.from(this.peers.values())
    //   .map(peer => peer.getReceiver())
    //   .map(receiver => receiver && receiver.getPrefix(prefix))
    //   .filter((a): a is IncomingRoute => !!a)
    //   .sort((a?: IncomingRoute, b?: IncomingRoute) => {
    //     if (!a && !b) {
    //       return 0
    //     } else if (!a) {
    //       return 1
    //     } else if (!b) {
    //       return -1
    //     }

    //     // First sort by peer weight
    //     const weightA = weight(a)
    //     const weightB = weight(b)

    //     if (weightA !== weightB) {
    //       return weightB - weightA
    //     }

    //     // Then sort by path length
    //     const pathA = a.path.length
    //     const pathB = b.path.length

    //     if (pathA !== pathB) {
    //       return pathA - pathB
    //     }

    //     // Finally, tie-break by accountId
    //     if (a.peer > b.peer) {
    //       return 1
    //     } else if (b.peer > a.peer) {
    //       return -1
    //     } else {
    //       return 0
    //     }
    //   })[0]

    // return bestRoute && {
    //   nextHop: bestRoute.peer,
    //   path: bestRoute.path,
    //   auth: bestRoute.auth
    // }
  }

  /**
   * Get currentBest from localRoutingTable
   * check if newNextHop has changed. If it has, update localRoutingTable and  forwardingRouteTable
   * @param prefix prefix
   * @param route route
   */
  private updateLocalRoute (prefix: string, route?: Route) {
    const currentBest = this.routingTable.get(prefix)
    const currentNextHop = currentBest && currentBest.nextHop
    const newNextHop = route && route.nextHop

    if (newNextHop !== currentNextHop) {
      if (route) {
        // log.trace('new best route for prefix. prefix=%s oldBest=%s newBest=%s', prefix, currentNextHop, newNextHop)
        this.routingTable.insert(prefix, route)
      } else {
        // log.trace('no more route available for prefix. prefix=%s', prefix)
        this.routingTable.delete(prefix)
      }

      this.updateForwardingRoute(prefix, route)

      return true
    }

    return false
  }

  // TODO: Temp
  private getGlobalPrefix () {
    return 'g'
  }

  /**
   * updating forwarding routing table
   * 1. If route is defined.
   * 2.   Update path and auth on route
   * 3.   If various checks on route set route to undefined
   * 4. Get Current best from forwarding Routing Table
   * 5. if newNextHop
   * 6.   Update the forwarding routing table
   * 7.   Check to apply dragon filtering based on the update on other prefixes.
   * 8. Else do nothing
   * @param prefix prefix
   * @param route route
   */
  private updateForwardingRoute (prefix: string, route?: Route) {
    if (route) {
      route = {
        ...route,
        path: [this.getOwnAddress(), ...route.path]
      }

      if (
        // Routes must start with the global prefix
        !prefix.startsWith(this.getGlobalPrefix()) ||

        // Don't publish the default route
        prefix === this.getGlobalPrefix() ||

        // Don't advertise local customer routes that we originated. Packets for
        // these destinations should still reach us because we are advertising our
        // own address as a prefix.
        (
          prefix.startsWith(this.getOwnAddress() + '.') &&
          route.path.length === 1
        ) // ||

        // canDragonFilter(
        //   this.forwardingRoutingTable,
        //   this.getAccountRelation,
        //   prefix,
        //   route
        // )
      ) {
        route = undefined
      }
    }

    const currentBest = this.forwardingRoutingTable.get(prefix)

    const currentNextHop = currentBest && currentBest.route && currentBest.route.nextHop
    const newNextHop = route && route.nextHop

    if (currentNextHop !== newNextHop) {
      const epoch = this.forwardingRoutingTable.currentEpoch++
      const routeUpdate: RouteUpdate = {
        prefix,
        route,
        epoch
      }

      this.forwardingRoutingTable.insert(prefix, routeUpdate)

      // log.trace('logging route update. update=%j', routeUpdate)

      // Remove from forwarding routing table.
      if (currentBest) {
        this.forwardingRoutingTable.log[currentBest.epoch] = null
      }

      this.forwardingRoutingTable.log[epoch] = routeUpdate

      if (route) {
        // We need to re-check any prefixes that start with this prefix to see
        // if we can apply DRAGON filtering.
        //
        // Note that we do this check *after* we have added the new route above.
        const subPrefixes = this.forwardingRoutingTable.getKeysStartingWith(prefix)

        for (const subPrefix of subPrefixes) {
          if (subPrefix === prefix) continue

          const routeUpdate = this.forwardingRoutingTable.get(subPrefix)

          if (!routeUpdate || !routeUpdate.route) continue

          this.updateForwardingRoute(subPrefix, routeUpdate.route)
        }
      }
    }
  }
}
