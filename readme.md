# AraGen [![Build Status](https://travis-ci.org/aragon/aragen.svg?branch=master)](https://travis-ci.org/aragon/aragen) [![npm](https://img.shields.io/npm/v/@aragon/aragen.svg?style=for-the-badge)](https://www.npmjs.com/package/@aragon/aragen)

Generate an Aragon environment

### Requirements
- `npm`
- `git`

### How to
```
npm i
npm start
```

Yes, you are done. Happy hacking 🔥🦅!

If you happen to stop ganache, just: 

```
npm run start-ganache
```

### Using snapshots

The Aragen package published to NPM contains a ganache snapshot that can be used to quickly start a chain with the entire Aragon system ready.

By default it has set up:

- ENS: `0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1`
- APM: `ens.addr('aragonpm.eth')`
- AragonID: `ens.owner('aragonid.eth')`
- Aragon apps: As APM repos, e.g. `apm.getLatest('voting.aragonpm.eth')`
- Beta templates: As APM repos, e.g. `apm.getLatest('democracy-template.aragonpm.eth')`

To use directly with ganache-cli:

```
npm install @aragon/aragen
ganache-cli --db node_modules/@aragon/aragen/aragon-ganache -m "explain tackle mirror kit van hammer degree position ginger unfair soup bonus" -i 15 -l 100000000
```

If you wish to access from code, for example to run ganache-core directly:

```js
const aragonSnapshot = path.resolve(require.resolve('@aragon/aragen'), '../aragon-ganache')
```

### CI

If you need to trigger the CI so a new snapshot is generated and publish to NPM, you need to tag the release by bumping the NPM version and commit to master.

```
npm version [major, minor, patch]
```
