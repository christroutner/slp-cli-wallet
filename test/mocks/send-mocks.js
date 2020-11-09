/*
  Mocking data used for unit tests.
*/

'use strict'

// bitcoincash:qrgeltnxk6zltsmr8sxmqcqrzwgcx3eztusrwgf0x3
const mockUnspentUtxo = [
  {
    address: 'bitcoincash:qpw8hqawqt7mwhpgcnxmgshqzve7mu7ypvgs7zz50t',
    utxos: [
      {
        height: 655855,
        tx_hash:
          '81e1d1e2b3ddac806036dcca1f6cdee8b109fc13fb7fc4da683bd882055bada7',
        tx_pos: 0,
        value: 6000,
        satoshis: 6000,
        txid:
          '81e1d1e2b3ddac806036dcca1f6cdee8b109fc13fb7fc4da683bd882055bada7',
        vout: 0,
        isValid: false,
        address: 'bitcoincash:qpw8hqawqt7mwhpgcnxmgshqzve7mu7ypvgs7zz50t',
        hdIndex: 0
      }
    ]
  }
]

const mockSpentUtxo = [
  {
    address: 'bitcoincash:qpw8hqawqt7mwhpgcnxmgshqzve7mu7ypvgs7zz50t',
    utxos: [
      {
        height: 655855,
        tx_hash:
          '81e1d1e2b3ddac806036dcca1f6cdee8b109fc13fb7fc4da683bd882055bada7',
        tx_pos: 0,
        value: 1000,
        satoshis: 1000,
        txid:
          '81e1d1e2b3ddac806036dcca1f6cdee8b109fc13fb7fc4da683bd882055bada7',
        vout: 0,
        isValid: false,
        address: 'bitcoincash:qpw8hqawqt7mwhpgcnxmgshqzve7mu7ypvgs7zz50t',
        hdIndex: 0
      }
    ]
  }
]

const mockSingleUtxos = [
  {
    address: 'bitcoincash:qpw8hqawqt7mwhpgcnxmgshqzve7mu7ypvgs7zz50t',
    utxos: [
      {
        height: 655855,
        tx_hash:
          '81e1d1e2b3ddac806036dcca1f6cdee8b109fc13fb7fc4da683bd882055bada7',
        tx_pos: 0,
        value: 60000,
        satoshis: 60000,
        txid:
          '81e1d1e2b3ddac806036dcca1f6cdee8b109fc13fb7fc4da683bd882055bada7',
        vout: 0,
        isValid: false,
        address: 'bitcoincash:qpw8hqawqt7mwhpgcnxmgshqzve7mu7ypvgs7zz50t',
        hdIndex: 0
      }
    ]
  }
]

const twoUtxos = [
  {
    address: 'bitcoincash:qr50yj9lcx6nykxx9hqgell7vck0fw2va50csrxr77',
    utxos: [
      {
        height: 0,
        tx_hash:
          'fd9220601ddad7183cb63d8530c935c5006e065ea6eacd18e5aa285c88cb7220',
        tx_pos: 0,
        value: 1000,
        satoshis: 1000,
        txid:
          'fd9220601ddad7183cb63d8530c935c5006e065ea6eacd18e5aa285c88cb7220',
        vout: 0,
        isValid: false,
        address: 'bitcoincash:qr50yj9lcx6nykxx9hqgell7vck0fw2va50csrxr77',
        hdIndex: 1
      }
    ]
  },
  {
    address: 'bitcoincash:qryxufkckgdfe3cfykydez4fjjsk4p2c5usevl9lfa',
    utxos: [
      {
        height: 0,
        tx_hash:
          'fd9220601ddad7183cb63d8530c935c5006e065ea6eacd18e5aa285c88cb7220',
        tx_pos: 1,
        value: 556,
        satoshis: 556,
        txid:
          'fd9220601ddad7183cb63d8530c935c5006e065ea6eacd18e5aa285c88cb7220',
        vout: 1,
        isValid: false,
        address: 'bitcoincash:qryxufkckgdfe3cfykydez4fjjsk4p2c5usevl9lfa',
        hdIndex: 23
      }
    ]
  }
]

module.exports = {
  mockUnspentUtxo,
  mockSpentUtxo,
  mockSingleUtxos,
  twoUtxos
}
