/*
  Create wallet
*/

"use strict"

const assert = require("chai").assert
const fs = require("fs")
const CreateWallet = require("../../src/commands/create-wallet")
const config = require("../../config")

const { bitboxMock } = require("../mocks/bitbox")
const filename = `${__dirname}/../../wallets/test123.json`

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = "unit"

const deleteFile = () => {
  const prom = new Promise((resolve, reject) => {
    fs.unlink(filename, () => {
      resolve(true)
    }) // Delete wallets file
  })
  return prom
}
describe("create-wallet", () => {
  let createWallet

  beforeEach(async () => {
    createWallet = new CreateWallet()
    // By default, use the mocking library instead of live calls.
    createWallet.BITBOX = bitboxMock
    await deleteFile()
  })

  it("should exit with error status if called without a filename.", async () => {
    try {
      await createWallet.createWallet(undefined, undefined)
    } catch (err) {
      assert.equal(
        err.message,
        "filename required.",
        "Should throw expected error."
      )
    }
  })

  it("should create a mainnet wallet file with the given name", async () => {
    // Use the real library if this is not a unit test.
    if (process.env.TEST !== "unit")
      createWallet.BITBOX = new config.BCHLIB({ restURL: config.MAINNET_REST })

    const walletData = await createWallet.createWallet(filename, undefined)
    // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

    assert.equal(walletData.network, "mainnet", "Expecting mainnet address")
    assert.hasAllKeys(walletData, [
      "network",
      "mnemonic",
      "balance",
      "nextAddress",
      "hasBalance",
      "rootAddress",
      "derivation",
      "addresses"
    ])

    // hasBalance is an array of objects. Each object represents an address with
    // a balance.
    assert.isArray(walletData.hasBalance)

    // For an integration test, ensure the rootAddress actually reflects mainnet.
    if (process.env.TEST !== "unit")
      assert.equal(walletData.rootAddress.indexOf("bitcoincash") > -1, true)
  })

  it("should create a mainnet wallet file when testnet is false", async () => {
    // Use the real library if this is not a unit test.
    if (process.env.TEST !== "unit")
      createWallet.BITBOX = new config.BCHLIB({ restURL: config.MAINNET_REST })

    const walletData = await createWallet.createWallet(filename, false)

    assert.equal(walletData.network, "mainnet", "Expecting mainnet address")
    assert.hasAllKeys(walletData, [
      "network",
      "mnemonic",
      "balance",
      "nextAddress",
      "hasBalance",
      "rootAddress",
      "derivation",
      "addresses"
    ])

    // hasBalance is an array of objects. Each object represents an address with
    // a balance.
    assert.isArray(walletData.hasBalance)

    // For an integration test, ensure the rootAddress actually reflects mainnet.
    if (process.env.TEST !== "unit")
      assert.equal(walletData.rootAddress.indexOf("bitcoincash") > -1, true)
  })

  it("should create a testnet wallet file with the given name", async () => {
    // Use the real library if this is not a unit test.
    if (process.env.TEST !== "unit")
      createWallet.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })

    const walletData = await createWallet.createWallet(filename, "testnet")

    assert.equal(walletData.network, "testnet", "Expecting testnet address")
    assert.hasAllKeys(walletData, [
      "network",
      "mnemonic",
      "balance",
      "nextAddress",
      "hasBalance",
      "rootAddress",
      "derivation",
      "addresses"
    ])

    // hasBalance is an array of objects. Each object represents an address with
    // a balance.
    assert.isArray(walletData.hasBalance)

    // For an integration test, ensure the rootAddress actually reflects mainnet.
    if (process.env.TEST !== "unit")
      assert.equal(walletData.rootAddress.indexOf("bchtest") > -1, true)
  })
  it("Should exit with error status if called with a filename that already exists.", async () => {
    const filename = `${__dirname}/../../wallets/test123.json`
    try {
      await createWallet.createWallet(filename, "testnet")
    } catch (err) {
      assert.equal(
        err.message,
        "filename already exist.",
        "Should throw expected error."
      )
    }
  })
})
