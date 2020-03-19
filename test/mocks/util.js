/*
  Contains mock data for the util.js library.
*/

"use strict"

const mockSpentUtxo = [
  {
    txid: "2cb218dc02e5df66506950174bfa540497973cba141f1ff737d3be042069c935",
    vout: 0,
    value: "1000",
    height: 1332533,
    confirmations: 32,
    satoshis: 1000,
    hdIndex: 1
  }
]

const mockUnspentUtxo = [
  {
    txid: "62a3ea958a463a372bc0caf2c374a7f60be9c624be63a0db8db78f05809df6d8",
    vout: 0,
    amount: 0.00006,
    satoshis: 6000,
    height: 603562,
    confirmations: 10
  }
]

const mockWallet = {
  network: "testnet",
  mnemonic:
    "alert mad wreck salon target later across crater stick mammal grunt ability",
  derivation: 245,
  rootAddress: "bchtest:qzl37uzel5urphw8dnkerxtlr5mxunvsys062p7g9v",
  balance: 0.00001,
  nextAddress: 3,
  hasBalance: [
    {
      index: 1,
      balance: 0.00001,
      balanceSat: 1000,
      unconfirmedBalance: 0,
      unconfirmedBalanceSat: 0,
      cashAddress: "bchtest:qzylf04c9f9d20gndgw9dp82602umwzuuqhnxv7jmn"
    }
  ],
  name: "temp",
  balanceConfirmed: 0.00001,
  balanceUnconfirmed: 0,
  SLPUtxos: [],
  addresses: [
    [0, "bchtest:qzl37uzel5urphw8dnkerxtlr5mxunvsys062p7g9v"],
    [1, "bchtest:qzylf04c9f9d20gndgw9dp82602umwzuuqhnxv7jmn"],
    [2, "bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0"],
    [3, "bchtest:qqkng037s5pjhhk38mkaa3c6grl3uep845evtxvyse"]
  ]
}

const mainnetWallet = {
  network: "mainnet",
  mnemonic:
    "shaft jelly okay little immense grant poet east there urge exhaust swarm",
  derivation: 245,
  rootAddress: "bitcoincash:qr7rzs9jmng7y2j0v9dh3acr08p54hhw9vxhne9dew",
  balance: 0.00001,
  nextAddress: 2,
  hasBalance: [
    {
      index: 1,
      balance: 0.00001,
      balanceSat: 1000,
      unconfirmedBalance: 0,
      unconfirmedBalanceSat: 0,
      cashAddress: "bitcoincash:qzxj70q8xkw0sjkj526uc4k08g36sldldygxe7pgn4"
    }
  ],
  name: "temp",
  balanceConfirmed: 0.00001,
  balanceUnconfirmed: 0,
  SLPUtxos: []
}

const mockTxOut = {
  bestblock: "000000000000000001e36f898d6dcd941b1de4202466d72843209277cc052bbc",
  confirmations: 11,
  value: 0.00006,
  scriptPubKey: {
    asm:
      "OP_DUP OP_HASH160 d19fae66b685f5c3633c0db0600313918347225f OP_EQUALVERIFY OP_CHECKSIG",
    hex: "76a914d19fae66b685f5c3633c0db0600313918347225f88ac",
    reqSigs: 1,
    type: "pubkeyhash",
    addresses: ["bitcoincash:qrgeltnxk6zltsmr8sxmqcqrzwgcx3eztusrwgf0x3"]
  },
  coinbase: false
}

module.exports = {
  mockSpentUtxo,
  mockUnspentUtxo,
  mockWallet,
  mainnetWallet,
  mockTxOut
}
