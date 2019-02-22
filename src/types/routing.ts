export interface IncomingRoute {
  peer: string,
  prefix: string,
  path: string[],
  weight?: number,
}

export interface Route {
  nextHop: string,
  path: string[],
  weight?: number
}

export interface BroadcastRoute extends Route {
  prefix: string
}
