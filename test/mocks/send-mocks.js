/*
  Mocking data used for unit tests.
*/

"use strict"

// bitcoincash:qrgeltnxk6zltsmr8sxmqcqrzwgcx3eztusrwgf0x3
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

const mockSpentUtxo = [
  {
    txid: "4cf8d184de587912d13c4a5af94ae4e58262a76ee35ea84a42ddaacbeaa8ce7a",
    vout: 0,
    value: "1000",
    height: 1332533,
    confirmations: 32,
    satoshis: 1000,
    hdIndex: 1
  }
]

module.exports = {
  mockUnspentUtxo,
  mockSpentUtxo
}
