/*
  Contains mock data used in unit tests for the update-balances.js command.
*/

'use strict'

// Has an address with a balance.
const mockAddressDetails1 = [
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bchtest:qrls6vzjkkxlds7aqv9075u0fttwc7u9jvczn5fdt9',
    balance: '8954',
    totalReceived: '8954',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 1,
    txids: ['sometxid']
  },
  {
    page: 1,
    totalPages: 1,
    itemsOnPage: 1000,
    address: 'bchtest:qzayl9rxxprzst3fnydykx2rt4d746fcqq8mh040hp',
    balance: '0',
    totalReceived: '0',
    totalSent: '0',
    unconfirmedBalance: '0',
    unconfirmedTxs: 0,
    txs: 0
  }
]

// Has no addresses with balances.
const mockAddressDetails2 = [
  {
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: [],
    legacyAddress: 'mv9wPCHx2iCdbXBkJ1UTAZCAq57PCL2YQ9',
    cashAddress: 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt',
    currentPage: 0,
    pagesTotal: 0
  },
  {
    balance: 0,
    balanceSat: 0,
    totalReceived: 0,
    totalReceivedSat: 0,
    totalSent: 0,
    totalSentSat: 0,
    unconfirmedBalance: 0,
    unconfirmedBalanceSat: 0,
    unconfirmedTxApperances: 0,
    txApperances: 0,
    transactions: [],
    legacyAddress: 'n3A9BmjrEG3ubJeoAJGwjkymhmqZhGbZR2',
    cashAddress: 'bchtest:qrkkx8au5lxsu2hka2c4ecn3juxjpcuz05wh08hhl2',
    currentPage: 0,
    pagesTotal: 1
  }
]

const mockUtxos = {
  utxos: [
    {
      txid: '77aff2eee866ae8fb335d670e68422dddd018fbf501b0da986e52c960cb3b6d6',
      vout: 0,
      amount: 0.00005176,
      satoshis: 5176,
      height: 595653,
      confirmations: 143
    }
  ],
  legacyAddress: '14RnUWKF6dtRBnPApFAEftwTR4q4yrhtgM',
  cashAddress: 'bitcoincash:qqjes5sxwneywmnzqndvs6p3l9rp55a2ug0e6e6s0a',
  slpAddress: 'simpleledger:qqjes5sxwneywmnzqndvs6p3l9rp55a2ugrz3z0s3r',
  scriptPubKey: '76a9142598520674f2476e6204dac86831f9461a53aae288ac'
}

const mockTokenUtxo = {
  utxos: [
    {
      txid: '4588c219dd5842ddce3962d1dfe443b92337fa91d5314ee7792b9cd8dac32075',
      vout: 1,
      amount: 0.00000546,
      satoshis: 546,
      height: 597740,
      confirmations: 604
    }
  ],
  legacyAddress: '16qFZvK3t7hiXxPJh1wMHnmugzQHAVQgB3',
  cashAddress: 'bitcoincash:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huv3xm2ztf',
  scriptPubKey: '76a9143ff8c16737df63e10c3b50318ed35b35703667bf88ac'
}

const mockTokenUtxoDetails = [
  {
    txid: '4588c219dd5842ddce3962d1dfe443b92337fa91d5314ee7792b9cd8dac32075',
    vout: 1,
    amount: 0.00000546,
    satoshis: 546,
    height: 597740,
    confirmations: 604,
    utxoType: 'token',
    tokenId: '3b3dbc418af179bfa9832255e9cc4e4bb7abacde8da62881f6eb466cbf70cc66',
    tokenTicker: 'p\u001f\r\u001e',
    tokenName: 'p\u001f\r\u001e',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 0,
    tokenQty: 61769
  }
]

const mockFindSlpUtxos = [
  {
    txid: '4588c219dd5842ddce3962d1dfe443b92337fa91d5314ee7792b9cd8dac32075',
    vout: 1,
    amount: 0.00000546,
    satoshis: 546,
    height: 597740,
    confirmations: 604,
    cashAddr: 'bitcoincash:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huv3xm2ztf',
    slpAddr: 'simpleledger:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huq2dqlz4h'
  }
]

const mockBalancesForAddress = [
  [
    {
      tokenId:
        '3b3dbc418af179bfa9832255e9cc4e4bb7abacde8da62881f6eb466cbf70cc66',
      balance: 61769,
      balanceString: '61769',
      slpAddress: 'simpleledger:qqll3st8xl0k8cgv8dgrrrkntv6hqdn8huq2dqlz4h',
      decimalCount: 0
    }
  ]
]

const updateBalancesMocks = {
  mockAddressDetails1,
  mockAddressDetails2,
  mockUtxos,
  mockTokenUtxo,
  mockTokenUtxoDetails,
  mockFindSlpUtxos,
  mockBalancesForAddress
}

module.exports = updateBalancesMocks
