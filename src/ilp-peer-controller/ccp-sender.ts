import ForwardingRoutingTable, { RouteUpdate } from '../ilp-router/forwarding-routing-table'
import { BroadcastRoute } from '../types/routing'
import {
  CcpRouteControlRequest,
  CcpRouteUpdateRequest,
  Mode,
  ModeReverseMap,
  serializeCcpRouteUpdateRequest
} from 'ilp-protocol-ccp'
import { IlpPrepare, IlpReply, deserializeIlpPrepare } from 'ilp-packet'
import { Relation } from '../types/relation'

export function getRelationPriority (relation: Relation): number {
  return {
    parent: 0,
    peer: 1,
    child: 2,
    local: 3
  }[relation]
}

export interface CcpSenderOpts {
  peerId: string,
  forwardingRoutingTable: ForwardingRoutingTable
  getPeerRelation: (peer: string) => Relation,
  sendData: (packet: IlpPrepare) => Promise<IlpReply>,
  routeExpiry: number
  routeBroadcastInterval: number
}

const MINIMUM_UPDATE_INTERVAL = 150

const MAX_EPOCHS_PER_UPDATE = 50

export default class CcpSender {
  private peerId: string
  private forwardingRoutingTable: ForwardingRoutingTable
  private mode: Mode = Mode.MODE_IDLE
  private getPeerRelation: (peer: string) => Relation
  private sendData: (packet: IlpPrepare) => Promise<IlpReply>
  private routeExpiry: number
  private routeBroadcastInterval: number

  /**
   * Next epoch that the peer requested from us.
   */
  private lastKnownEpoch: number = 0

  private lastUpdateSentAt: number = 0
  private sendRouteUpdateTimer?: NodeJS.Timer

  // TODO: possible get away with only having the relation passed in explicitly?. Then might not need accountId, getOwnAddress and getAccountRelation
  // getAccountRelation needs to be getPeerRelation
  constructor ({
    peerId,
    forwardingRoutingTable,
    getPeerRelation,
    routeExpiry,
    routeBroadcastInterval,
    sendData
  }: CcpSenderOpts) {
    this.peerId = peerId
    this.forwardingRoutingTable = forwardingRoutingTable
    this.getPeerRelation = getPeerRelation
    this.routeExpiry = routeExpiry
    this.routeBroadcastInterval = routeBroadcastInterval
    this.sendData = sendData
  }

  stop () {
    if (this.sendRouteUpdateTimer) {
      clearTimeout(this.sendRouteUpdateTimer)
    }
  }

  getLastUpdate () {
    return this.lastUpdateSentAt
  }

  getLastKnownEpoch () {
    return this.lastKnownEpoch
  }

  getRoutingTableId () {
    return this.forwardingRoutingTable.routingTableId
  }

  getMode () {
    return this.mode
  }

  getStatus () {
    return {
      epoch: this.lastKnownEpoch,
      mode: ModeReverseMap[this.mode]
    }
  }

  handleRouteControl ({
    mode,
    lastKnownRoutingTableId,
    lastKnownEpoch,
    features
  }: CcpRouteControlRequest) {
    if (this.mode !== mode) {
      // this.log.trace('peer requested changing routing mode. oldMode=%s newMode=%s', ModeReverseMap[this.mode], ModeReverseMap[mode])
    }
    this.mode = mode

    if (lastKnownRoutingTableId !== this.forwardingRoutingTable.routingTableId) {
      // this.log.trace('peer has old routing table id, resetting lastKnownEpoch to zero. theirTableId=%s correctTableId=%s', lastKnownRoutingTableId, this.forwardingRoutingTable.routingTableId)
      this.lastKnownEpoch = 0
    } else {
      // this.log.trace('peer epoch set. epoch=%s currentEpoch=%s', this.accountId, lastKnownEpoch, this.forwardingRoutingTable.currentEpoch)
      this.lastKnownEpoch = lastKnownEpoch
    }

    // We don't support any optional features, so we ignore the `features`

    if (this.mode === Mode.MODE_SYNC) {
      // Start broadcasting routes to this peer
      this.scheduleRouteUpdate()
    } else {
      // Stop broadcasting routes to this peer
      if (this.sendRouteUpdateTimer) {
        clearTimeout(this.sendRouteUpdateTimer)
        this.sendRouteUpdateTimer = undefined
      }
    }
  }

  scheduleRouteUpdate = () => {
    if (this.sendRouteUpdateTimer) {
      clearTimeout(this.sendRouteUpdateTimer)
      this.sendRouteUpdateTimer = undefined
    }

    if (this.mode !== Mode.MODE_SYNC) {
      return
    }

    const lastUpdateSentAt = this.lastUpdateSentAt
    const nextEpoch = this.lastKnownEpoch

    let delay: number
    if (nextEpoch < this.forwardingRoutingTable.currentEpoch) {
      delay = 0
    } else {
      delay = this.routeBroadcastInterval - (Date.now() - lastUpdateSentAt)
    }

    delay = Math.max(MINIMUM_UPDATE_INTERVAL, delay)

    // this.log.trace('scheduling next route update. accountId=%s delay=%s currentEpoch=%s peerHasEpoch=%s', this.accountId, delay, this.forwardingRoutingTable.currentEpoch, this.lastKnownEpoch)
    this.sendRouteUpdateTimer = setTimeout(() => {
      this.sendSingleRouteUpdate()
        .then(() => this.scheduleRouteUpdate())
        .catch((err: any) => {
          const errInfo = (err instanceof Object && err.stack) ? err.stack : err
          // this.log.debug('failed to broadcast route information to peer. peer=%s error=%s', this.accountId, errInfo)
        })
    }, delay)
    this.sendRouteUpdateTimer.unref()
  }

  private async sendSingleRouteUpdate () {
    // This should maybe only be set after successfully sending?
    this.lastUpdateSentAt = Date.now()

    // if (!this.plugin.isConnected()) {
    //   this.log.debug('cannot send routes, plugin not connected (yet).')
    //   return
    // }

    const nextRequestedEpoch = this.lastKnownEpoch
    const allUpdates = this.forwardingRoutingTable.log
      .slice(nextRequestedEpoch, nextRequestedEpoch + MAX_EPOCHS_PER_UPDATE)

    const toEpoch = nextRequestedEpoch + allUpdates.length

    const updates = this.filterRoutes(allUpdates)

    const newRoutes: BroadcastRoute[] = []
    const withdrawnRoutes: { prefix: string, epoch: number }[] = []

    // New Routes
    // Withdrawn Routes
    for (const update of updates) {
      if (update.route) {
        newRoutes.push({
          prefix: update.prefix,
          nextHop: update.route.nextHop,
          path: update.route.path
        })
      } else {
        withdrawnRoutes.push({
          prefix: update.prefix,
          epoch: update.epoch
        })
      }
    }

    // this.log.trace('broadcasting routes to peer. speaker=%s peer=%s fromEpoch=%s toEpoch=%s routeCount=%s unreachableCount=%s', this.getOwnAddress(), this.accountId, this.lastKnownEpoch, toEpoch, newRoutes.length, withdrawnRoutes.length)

    const routeUpdate: CcpRouteUpdateRequest = {
      speaker: '',
      routingTableId: this.forwardingRoutingTable.routingTableId,
      holdDownTime: this.routeExpiry,
      currentEpochIndex: this.forwardingRoutingTable.currentEpoch,
      fromEpochIndex: this.lastKnownEpoch,
      toEpochIndex: toEpoch,
      newRoutes: newRoutes.map(r => ({
        ...r,
        nextHop: undefined,
        auth: Buffer.from(''),
        props: []
      })),
      withdrawnRoutes: withdrawnRoutes.map(r => r.prefix)
    }

    // We anticipate that they're going to be happy with our route update and
    // request the next one.
    const previousNextRequestedEpoch = this.lastKnownEpoch
    this.lastKnownEpoch = toEpoch

    const timeout = this.routeBroadcastInterval

    const timerPromise: Promise<Buffer> = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('route update timed out.')), timeout)
      // Don't let this timer keep Node running
      timer.unref()
    })

    // TODO: Temp whilst need to update ccp
    const packet = deserializeIlpPrepare(serializeCcpRouteUpdateRequest(routeUpdate))
    try {
      await Promise.race([
        // TODO: Handle sendData
        this.sendData(packet),
        timerPromise
      ])
    } catch (err) {
      this.lastKnownEpoch = previousNextRequestedEpoch
      throw err
    }
  }

  private filterRoutes (allUpdates: (RouteUpdate | null)[]) {

    function isRouteUpdate (update: RouteUpdate | null): update is RouteUpdate {
      return !!update
    }

    return allUpdates
      .filter(isRouteUpdate)
      .map((update: RouteUpdate) => {
        if (!update.route) return update

        if (
          // Don't send peer their own routes
          update.route.nextHop === this.peerId ||

          // TODO: Understand why this is the case.
          // Essentially dont send your peer or other parents routes to your parent
          // Don't advertise peer and provider routes to providers
          (
            this.getPeerRelation(this.peerId) === 'parent' &&
            ['peer', 'parent'].indexOf(this.getPeerRelation(update.route.nextHop)) !== -1
          )
        ) {
          return {
            ...update,
            route: undefined
          }
        } else {
          return update
        }
      })
  }
}
