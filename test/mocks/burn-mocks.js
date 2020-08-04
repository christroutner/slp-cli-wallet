/*
  Mocks for unit tests for the burn-tokens command
*/

'use strict'

const tokenUtxo = [
  {
    txid: 'ede636bbbde580052d89791d09d5feda9623415b47829e17f9719ab1174444ca',
    vout: 1,
    value: '546',
    height: 614044,
    confirmations: 2,
    satoshis: 546,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    tokenTicker: 'TOK-CH',
    tokenName: 'TokyoCash',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 8,
    tokenQty: 7,
    cashAddr: 'bitcoincash:qrn7wgwvtt5ure4za5wff0ehu4tpajufkqe6akhm63',
    slpAddr: 'simpleledger:qrn7wgwvtt5ure4za5wff0ehu4tpajufkq4pkdzmy0',
    hdIndex: 15
  }
]

const bchUtxo = {
  txid: '0b7769cf3dd4b37ddc25987f6b6882caa22df8bd9aa92ab3f31b68a63acaee2e',
  vout: 0,
  value: '20000',
  height: 613965,
  confirmations: 81,
  satoshis: 20000,
  hdIndex: 3,
  amount: 0.0002
}

module.exports = {
  tokenUtxo,
  bchUtxo
}
