export interface IncomingRoute {
  prefix: string,
  path: string[]
}

export interface Route {
  nextHop: string,
  path: string[],
  weight?: number
}

export interface BroadcastRoute extends Route {
  prefix: string
}
