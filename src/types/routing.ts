export interface IncomingRoute {
  prefix: string,
  path: string[]
}

export interface Route {
  nextHop: string,
  path: string[],
  auth: Buffer
}
