/*
  TODO:
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

// File under test.
const AppUtils = require('../../src/util')
const config = require('../../config')

// Mocking data
const utilMocks = require('../mocks/util')

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('#util.js', () => {
  let appUtils
  let sandbox

  beforeEach(() => {
    appUtils = new AppUtils()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  // describe('#getUTXOs', () => {
  //   it('should get all UTXOs in wallet', async () => {
  //     // Unit test mocking.
  //     if (process.env.TEST === 'unit') {
  //       sandbox
  //         .stub(appUtils.BITBOX.Blockbook, 'utxo')
  //         .resolves(utilMocks.mockSpentUtxo)
  //     }
  //
  //     const utxos = await appUtils.getUTXOs(utilMocks.mainnetWallet)
  //     // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
  //
  //     assert.isArray(utxos, 'Expect array of utxos')
  //     if (utxos.length > 0) {
  //       assert.property(utxos[0], 'txid')
  //       assert.property(utxos[0], 'vout')
  //       assert.property(utxos[0], 'satoshis')
  //       assert.property(utxos[0], 'height')
  //       assert.property(utxos[0], 'confirmations')
  //       assert.property(utxos[0], 'hdIndex')
  //       assert.property(utxos[0], 'value')
  //       assert.property(utxos[0], 'cashAddr')
  //       assert.property(utxos[0], 'legacyAddr')
  //       assert.property(utxos[0], 'slpAddr')
  //     }
  //   })
  // })

  describe('#openWallet', () => {
    it('should throw error if wallet file not found.', () => {
      try {
        appUtils.openWallet('doesnotexist')
      } catch (err) {
        assert.include(err.message, 'Could not open', 'Expected error message.')
      }
    })
  })

  describe('#saveWallet', () => {
    it('should save a wallet without error', async () => {
      const filename = `${__dirname}/../../wallets/test123.json`

      await appUtils.saveWallet(filename, utilMocks.mockWallet)
    })
  })

  describe('#changeAddrFromMnemonic', () => {
    it('should return a change address', async () => {
      appUtils.BITBOX = new config.BCHLIB({
        restURL: config.TESTNET_REST
      })

      const result = await appUtils.changeAddrFromMnemonic(
        utilMocks.mockWallet,
        0
      )
      // console.log(`result: ${util.inspect(result)}`)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAnyKeys(result, ['keyPair', 'chainCode', 'index'])
    })
  })

  describe('#validateUtxo', () => {
    it('should throw error on empty input', async () => {
      try {
        await appUtils.isValidUtxo({})
      } catch (err) {
        assert.include(err.message, 'utxo does not have a txid property')
      }
    })

    it('should throw error on malformed utxo', async () => {
      try {
        await appUtils.isValidUtxo({ txid: 'sometxid' })
      } catch (err) {
        assert.include(err.message, 'utxo does not have a vout property')
      }
    })

    it('should return false for a spent UTXO', async () => {
      // Unit test mocking.
      if (process.env.TEST === 'unit') { sandbox.stub(appUtils.BITBOX.Blockchain, 'getTxOut').resolves(null) }

      const result = await appUtils.isValidUtxo(utilMocks.mockSpentUtxo[0])
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, false)
    })

    it('should return true for an unspent UTXO', async () => {
      // Unit test mocking.
      if (process.env.TEST === 'unit') {
        sandbox
          .stub(appUtils.BITBOX.Blockchain, 'getTxOut')
          .resolves(utilMocks.mockTxOut)
      }

      const result = await appUtils.isValidUtxo(utilMocks.mockUnspentUtxo[0])
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, true)
    })
  })

  describe('#generateAddresses', () => {
    it('should generate an address accurately.', async () => {
      // updateBalances.BITBOX = new config.BCHLIB({
      //   restURL: config.TESTNET_REST
      // })

      const addr = await appUtils.generateAddress(utilMocks.mockWallet, 3, 1)
      // console.log(`addr: ${util.inspect(addr)}`)

      assert.isArray(addr)
      assert.equal(addr.length, 1)
      assert.equal(
        addr[0],
        'bchtest:qqkng037s5pjhhk38mkaa3c6grl3uep845evtxvyse'
      )
    })

    it('should generate the first 20 addresses', async () => {
      appUtils.BITBOX = new config.BCHLIB({
        restURL: config.TESTNET_REST
      })

      const addr = await appUtils.generateAddress(utilMocks.mockWallet, 0, 20)
      // console.log(`addr: ${util.inspect(addr)}`)

      assert.isArray(addr)
      assert.equal(addr.length, 20)
      assert.equal(addr[0], utilMocks.mockWallet.rootAddress)
    })
  })

  describe('#getIndex', () => {
    it('should throw an error if walletInfo is not included', async () => {
      try {
        await appUtils.getIndex('abc')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have nextAddress property'
        )
      }
    })

    it('should throw an error if walletInfo does not have an addresses property', async () => {
      try {
        await appUtils.getIndex('abc', { nextAddress: 2 })

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have an addresses property'
        )
      }
    })

    it('should return false if address is not included in wallet', async () => {
      const result = await appUtils.getIndex('abc', utilMocks.mockWallet)

      assert.equal(result, false)
    })

    it('should get index', async () => {
      const addr = 'bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0'
      const result = await appUtils.getIndex(addr, utilMocks.mockWallet)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 2)
    })
  })

  describe('#generateIndex', () => {
    it('should throw an error if walletInfo is not included', async () => {
      try {
        await appUtils.getIndex('abc')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'walletInfo object does not have nextAddress property'
        )
      }
    })

    it('should return false if address is not included in wallet', async () => {
      const result = await appUtils.getIndex('abc', utilMocks.mockWallet)

      assert.equal(result, false)
    })

    it('should get index', async () => {
      const addr = 'bchtest:qp6dyeslwkslzruaf29vvtv6lg7lez8csca90lg6a0'
      const result = await appUtils.getIndex(addr, utilMocks.mockWallet)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 2)
    })
  })
})
