/*
  TODO:
  --sendAllBCH throws error when utxos are undefined
  --sendAllBCH throws error when trying to send 0 satoshis.

*/

'use strict'

const assert = require('chai').assert

// Library under test.
const SendAll = require('../../src/commands/send-all')
// const config = require('../../config')

// Mocking data
const { bitboxMock } = require('../mocks/bitbox')
const testwallet = require('../mocks/testwallet.json')
const mockUtxos = require('../mocks/send-mocks')

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('Send All', () => {
  let BITBOX
  let mockedWallet
  let sendAll

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    BITBOX = bitboxMock
    mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sendAll = new SendAll()
    sendAll.BITBOX = BITBOX
  })

  describe('#validateFlags', () => {
    it('should throw error if name is not supplied.', () => {
      try {
        sendAll.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('should throw error if recieving address is not supplied.', () => {
      try {
        const flags = {
          name: 'testwallet'
        }

        sendAll.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a send-to address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('should return true if all flags are supplied.', () => {
      const flags = {
        name: 'testwallet',
        sendAddr: 'abc'
      }

      const result = sendAll.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe('#sendAllBCH', () => {
    it('should throw an error for malformed UTXOs', async () => {
      try {
        const utxos = 'badUtxo'
        const sendToAddr = 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt'

        await sendAll.sendAllBCH(utxos, sendToAddr, mockedWallet)

        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        assert.include(err.message, 'utxos must be an array')
      }
    })

    it('should throw an error for empty array of UTXOs', async () => {
      try {
        const utxos = []
        const sendToAddr = 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt'

        await sendAll.sendAllBCH(utxos, sendToAddr, mockedWallet)

        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        assert.include(err.message, 'No utxos found')
      }
    })

    // it('should send BCH on testnet', async () => {
    //   const utxos = [
    //     {
    //       txid:
    //         '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b',
    //       vout: 1,
    //       scriptPubKey: '76a9142b0379444f2e01905b2dd511644af4f53556edeb88ac',
    //       amount: 0.06999752,
    //       satoshis: 6999752,
    //       height: 1265272,
    //       confirmations: 644,
    //       legacyAddress: 'mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz',
    //       cashAddress: 'bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3',
    //       hdIndex: 3
    //     },
    //     {
    //       txid:
    //         '26564508facb32a5f6893cb7bdfd2dcc264b248a1aa7dd0a572117667418ae5b',
    //       vout: 0,
    //       scriptPubKey: '76a9148687a941392d82bf0af208779c3b147e2fbadafa88ac',
    //       amount: 0.03,
    //       satoshis: 3000000,
    //       height: 1265272,
    //       confirmations: 733,
    //       legacyAddress: 'mjSPWfCwCgHZC27nS8GQ4AXz9ehhb2GFqz',
    //       cashAddress: 'bchtest:qq4sx72yfuhqryzm9h23zez27n6n24hdavvfqn2ma3',
    //       hdIndex: 3
    //     }
    //   ]
    //
    //   const sendToAddr = 'bchtest:qzsfqeqtdk6plsvglccadkqtf0trf2nyz58090e6tt'
    //
    //   const hex = await sendAll.sendAllBCH(utxos, sendToAddr, mockedWallet)
    //
    //   assert.isString(hex)
    // })

    it('should send BCH on mainnet', async () => {
      const utxos = mockUtxos.twoUtxos

      const sendToAddr = 'bitcoincash:qryxufkckgdfe3cfykydez4fjjsk4p2c5usevl9lfa'

      // Switch to mainnet
      mockedWallet.network = 'mainnet'

      const hex = await sendAll.sendAllBCH(utxos, sendToAddr, mockedWallet)

      assert.isString(hex)
    })
  })
})
