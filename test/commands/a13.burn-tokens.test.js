/*
  TODO:


*/

"use strict"

const assert = require("chai").assert
const sinon = require("sinon")

// Library under test.
const BurnTokens = require("../../src/commands/burn-tokens")
const config = require("../../config")

// Mock data
const testwallet = require("../mocks/testwallet.json")
const { bitboxMock } = require("../mocks/bitbox")
const utilMocks = require("../mocks/util")
const burnMocks = require("../mocks/burn-mocks")

// Inspect utility used for debugging.
const util = require("util")
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = "unit"

describe("#burn-tokens", () => {
  let BITBOX
  let mockedWallet
  let burnTokens
  let sandbox

  beforeEach(() => {
    // By default, use the mocking library instead of live calls.
    BITBOX = bitboxMock
    mockedWallet = Object.assign({}, testwallet) // Clone the testwallet

    sandbox = sinon.createSandbox()

    burnTokens = new BurnTokens()
    burnTokens.BITBOX = BITBOX
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe("#validateFlags", () => {
    it("should throw error if name is not supplied.", () => {
      try {
        burnTokens.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          `You must specify a wallet with the -n flag`,
          "Expected error message."
        )
      }
    })

    it("should throw error if token quantity is not supplied.", () => {
      try {
        const flags = {
          name: `testwallet`
        }

        burnTokens.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          `You must specify a quantity of tokens with the -q flag`,
          "Expected error message."
        )
      }
    })

    it("should throw error if token ID is not supplied.", () => {
      try {
        const flags = {
          name: `testwallet`,
          qty: 0.1
        }

        burnTokens.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          `You must specifcy the SLP token ID`,
          "Expected error message."
        )
      }
    })

    it("should throw error if token ID is not valid.", () => {
      try {
        const flags = {
          name: `testwallet`,
          qty: 0.1,
          tokenId: "abc"
        }

        burnTokens.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          `TokenIdHex must be provided as a 64 character hex string`,
          "Expected error message."
        )
      }
    })

    it("should return true if all flags are supplied.", () => {
      const flags = {
        name: `testwallet`,
        qty: 1.5,
        tokenId: `c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479`
      }

      const result = burnTokens.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe("#generateOpReturn", () => {
    it("should throw an error if tokenUtxos is undefined", () => {
      try {
        burnTokens.generateOpReturn()
      } catch (err) {
        // console.log(`err: `, err)

        assert.include(
          err.message,
          `tokenUtxos array can not be empty`,
          "Expected error message."
        )
      }
    })

    it("should throw an error if tokenUtxos array is empty", () => {
      try {
        burnTokens.generateOpReturn([], 5)
      } catch (err) {
        // console.log(`err: `, err)

        assert.include(
          err.message,
          `tokenUtxos array can not be empty`,
          "Expected error message."
        )
      }
    })

    it("should throw an error if tokenUtxos array is empty", () => {
      try {
        burnTokens.generateOpReturn([], 5)
      } catch (err) {
        // console.log(`err: `, err)

        assert.include(
          err.message,
          `tokenUtxos array can not be empty`,
          "Expected error message."
        )
      }
    })

    it("should throw an error if qty is undefined", () => {
      try {
        burnTokens.generateOpReturn(burnMocks.tokenUtxo)
      } catch (err) {
        // console.log(`err: `, err)

        assert.include(
          err.message,
          `Quantity to burn needs to be greater than zero`,
          "Expected error message."
        )
      }
    })

    it("should throw an error if qty is 0", () => {
      try {
        burnTokens.generateOpReturn(burnMocks.tokenUtxo, 0)
      } catch (err) {
        // console.log(`err: `, err)

        assert.include(
          err.message,
          `Quantity to burn needs to be greater than zero`,
          "Expected error message."
        )
      }
    })

    it("should return an array of buffers", () => {
      const script = burnTokens.generateOpReturn(burnMocks.tokenUtxo, 1)
      // console.log(`script: ${JSON.stringify(script, null, 2)}`)

      assert.isArray(script)
      assert.isAbove(script.length, 1)
    })
  })

  describe("#burnTokens", () => {
    it("should generate tx hex to burn tokens", async () => {
      const sendToAddr = `bitcoincash:qp72leshv5h4uw8nj500ljwjqq6tqxgsguduwe9zz8`

      const hex = await burnTokens.burnTokens(
        burnMocks.bchUtxo,
        1,
        sendToAddr,
        sendToAddr,
        mockedWallet,
        burnMocks.tokenUtxo
      )

      // console.log(`hex: ${hex}`)

      assert.isString(hex)
    })
  })
})
