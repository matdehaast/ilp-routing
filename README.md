# ilp-router
> Routing module for ILP address space

[![NPM Package](https://img.shields.io/npm/v/ilp-router.svg?style=flat)](https://npmjs.org/package/ilp-router)
[![CircleCI](https://circleci.com/gh/interledgerjs/ilp-router.svg?style=shield)](https://circleci.com/gh/interledgerjs/ilp-router)

## Usage

```js
// TypeScript
import Router from 'ilp-router'

const router = new Router()

// Adding Peers
const peerRequestHandler = (payload) => Promise.resolve(payload)
router.addPeer('harry', peerRequestHandler)

// Adding Routes
router.addRoute('harry', {
  prefix: 'g.harry',
  path: string[]
})

// Making a request for the router to route.
const response = await router.request('g.harry.met.sally', payload)

```

## Project



### Folders

All source code is expected to be TypeScript and is placed in the `src` folder. Tests are put in the `test` folder.

The NPM package will not contain any TypeScript files (`*.ts`) but will have typings and source maps.

### Scripts

  - `clean` : Cleans the build folder and test output
  - `build` : Build the project
  - `lint`  : Run the linter over the project
  - `test`  : Run the unit tests and produce a code coverage report
  - `doc`   : Build the docs

### Future notes/reading
Implement BGP type path based filtering
https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/13753-25.html#bestpath
Multipath could also be an interesting area to pursue.