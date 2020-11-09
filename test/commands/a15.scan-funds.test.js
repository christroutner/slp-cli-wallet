/*
  TODO:

*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

// Library under test.
const ScanFunds = require('../../src/commands/scan-funds')
// const config = require('../../config')

// Mock data
const { bitboxMock } = require('../mocks/bitbox')

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'

describe('#scanFunds', () => {
  let BCHJS
  let scanFunds
  let sandbox

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    BCHJS = bitboxMock

    sandbox = sinon.createSandbox()
    sandbox.reset()
    sandbox.resetHistory()
    sandbox.restore()

    scanFunds = new ScanFunds()
    scanFunds.BCHJS = BCHJS
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#generateDerivedAddress', () => {
    it('should call derivePath and toCashAddress once.', () => {
      scanFunds.BCHJS.HDNode.derivePath.resetHistory()
      scanFunds.BCHJS.HDNode.toCashAddress.resetHistory()
      scanFunds.generateDerivedAddress({}, '')

      assert.equal(scanFunds.BCHJS.HDNode.derivePath.calledOnce, true)
      assert.equal(scanFunds.BCHJS.HDNode.toCashAddress.calledOnce, true)
    })
  })

  describe('#addressHasTransactionHistoryBalance', () => {
    it('should have both hasHistory and balance keys in retuen value.', () => {
      scanFunds
        .addressHasTransactionHistoryBalance('')
        .then(function (response) {
          assert.hasAllKeys(response, ['hasHistory', 'balance'])
        })
    })
  })

  describe('#scanDerivationPath', () => {
    it('should return an empty array.', () => {
      scanFunds.scanDerivationPath({}).then(addressesWithHistory => {
        assert.lengthOf(addressesWithHistory, 0)
      })
    })
  })

  describe('#validateFlags', () => {
    it('should throw error if mnemonic is not supplied.', () => {
      try {
        scanFunds.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a mnemonic phrase with the -m flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error is mnemonic flag is specified with less than 12 words.', () => {
      try {
        const flags = {
          mnemonic: 'test mnemonic fail'
        }

        scanFunds.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a mnemonic phrase of 12 words.',
          'Expected error message.'
        )
      }
    })
  })
})
