'use strict'

// const { expect, test } = require("@oclif/test")
const assert = require('chai').assert
const CreateWallet = require('../../src/commands/create-wallet')
const ListWallets = require('../../src/commands/list-wallets')
const filename = `${__dirname}/../../wallets/test123.json`
const fs = require('fs')

// const { bitboxMock } = require("../mocks/bitbox")
// const BB = require("bitbox-sdk").BITBOX
// const REST_URL = { restURL: "https://trest.bitcoin.com/v2/" }

// Inspect utility used for debugging.
const util = require('util')
util.inspect.defaultOptions = {
  showHidden: true,
  colors: true,
  depth: 1
}

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = 'unit'
const deleteFile = () => {
  const prom = new Promise((resolve, reject) => {
    fs.unlink(filename, () => {
      resolve(true)
    }) // Delete wallets file
  })
  return prom
}
describe('list-wallets', () => {
  // let listWallets

  beforeEach(async () => {
    await deleteFile()
    // listWallets = new ListWallets()
    // By default, use the mocking library instead of live calls.
    // listWallets.BITBOX = bitboxMock
  })

  it('should correctly identify a mainnet wallet', async () => {
    // Create a mainnet wallet.
    const createWallet = new CreateWallet()
    await createWallet.createWallet(filename, false)

    const listWallets = new ListWallets()
    const data = listWallets.parseWallets()

    // Find the wallet that was just created.
    const testWallet = data.find(wallet => wallet[0].indexOf('test123') > -1)

    const network = testWallet[1]
    const balance = testWallet[2]
    assert.equal(network, 'mainnet', 'Correct network detected.')
    assert.equal(balance, 0, 'Should have a zero balance')
  })

  it('should correctly identify a testnet wallet', async () => {
    // Create a testnet wallet
    const createWallet = new CreateWallet()
    await createWallet.createWallet(filename, 'testnet')

    const listWallets = new ListWallets()
    const data = listWallets.parseWallets()
    // console.log(`data: ${util.inspect(data)}`)

    // Find the wallet that was just created.
    const testWallet = data.find(wallet => wallet[0].indexOf('test123') > -1)
    // console.log(`testWallet: ${util.inspect(testWallet)}`)

    const network = testWallet[1]
    const balance = testWallet[2]
    assert.equal(network, 'testnet', 'Correct network detected.')
    assert.equal(balance, 0, 'Should have a zero balance')
  })
})
