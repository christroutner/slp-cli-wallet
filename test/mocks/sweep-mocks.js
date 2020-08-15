/*
  Mocks for unit tests for the sweep command
*/

'use strict'

const mockBalance1 = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qqtc3vqfzz050jkvcfjvtzj392lf6wlqhun3fw66n9',
  balance: '1000',
  totalReceived: '1000',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 1,
  txids: ['406b9f2282fca16e1e3cb2bab02d50aacb26511b6b1becd95c81f24161b768a3']
}

const tokenOnlyUtxos = [
  {
    txid: '90efd19136d40dfea0ee06d901029eee688b262efd7a3e26cbd2986a60912969',
    vout: 1,
    value: '546',
    confirmations: 0
  }
]

const tokenOnlyTokenInfo = [
  {
    txid: '90efd19136d40dfea0ee06d901029eee688b262efd7a3e26cbd2986a60912969',
    vout: 1,
    value: '546',
    confirmations: 0,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'dd84ca78db4d617221b58eabc6667af8fe2f7eadbfcc213d35be9f1b419beb8d',
    tokenTicker: 'TAP',
    tokenName: 'Thoughts and Prayers',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 1
  }
]

const bchOnlyUtxos = [
  {
    txid: '53c9ee6e5ecec2787d2edfeaf0b192b45a937d5a4b1eaa715545eeb3c5c67ede',
    vout: 0,
    value: '1000',
    height: 603853,
    confirmations: 17
  }
]

const bchSmallUtxos = [
  {
    txid: '53c9ee6e5ecec2787d2edfeaf0b192b45a937d5a4b1eaa715545eeb3c5c67ede',
    vout: 0,
    value: '550',
    height: 603853,
    confirmations: 17,
    satoshis: 550
  }
]

const bchOnlyTokenInfo = [false]

const bothUtxos = [
  {
    txid: 'b319024ef23f49ec645e7b5d92db66269553d662d0ad63fbf0db1d0a276c7974',
    vout: 1,
    value: '546',
    height: 603753,
    confirmations: 117
  },
  {
    txid: '3097f6fbd8d1013799f14e1d7cb5cb179fff573266cfc820d1442b88f2211200',
    vout: 0,
    value: '2000',
    height: 603753,
    confirmations: 117
  }
]

const bothTokenInfo = [
  {
    txid: 'cfef85eadec3f6c0f62e522d8e7b9e5e664f27b29442b882c8aa021fb02b5e45',
    vout: 1,
    value: '546',
    height: 648506,
    confirmations: 1,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenTicker: 'TROUT',
    tokenName: "Trout's test token",
    tokenDocumentUrl: 'troutsblog.com',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: 2.3,
    isValid: true
  },
  {
    txid: '056aec5d36110ab2701f068e88b35cbb1dd1f8c2964aa72f5475d56231bd1aa6',
    vout: 0,
    value: '10000',
    height: 648506,
    confirmations: 1,
    satoshis: 10000,
    isValid: false
  }
]

const bchUtxo = [
  {
    txid: '71de89aeeb935311847696e410a7456eef807e8c3dc87d7a13b3da84baf4c485',
    vout: 0,
    value: '2000',
    height: 603753,
    confirmations: 145,
    satoshis: 2000
  }
]

const twoTokens = [
  {
    txid: '410fa835c5409497954a5819f7eca577d429fc1606eb29107125c2372286bf1b',
    vout: 1,
    value: '546',
    confirmations: 0,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    tokenTicker: 'TOK-CH',
    tokenName: 'TokyoCash',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 8,
    tokenQty: 1
  },
  {
    txid: '551d9e9ee4a40a3b42a96dde8a41a5b48c849f0ea72ee525b839f1f1140575cb',
    vout: 1,
    value: '546',
    height: 603753,
    confirmations: 283,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'dd84ca78db4d617221b58eabc6667af8fe2f7eadbfcc213d35be9f1b419beb8d',
    tokenTicker: 'TAP',
    tokenName: 'Thoughts and Prayers',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 1
  }
]

module.exports = {
  mockBalance1,
  tokenOnlyUtxos,
  tokenOnlyTokenInfo,
  bchOnlyUtxos,
  bchOnlyTokenInfo,
  bothUtxos,
  bothTokenInfo,
  bchUtxo,
  twoTokens,
  bchSmallUtxos
}
