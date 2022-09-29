export const networkIds = {
  DND: 7363
}

const networks = {
  [networkIds.DND]: {
    chainId: '7363',
    chainName: 'DynoChain',
    nativeCurrency: {
      name: 'Dyno',
      symbol: 'DND',
      decimals: 18
    },
    rpc: 'https://rpc.dynochain.io',
    explorer: 'https://dynoscan.io'
  }
}

export const getNetwork = (networkId) => networks[networkId]
