/*
  Calls a REST API endpoint on FullStack.cash in order to search the blockchain
  for a public key associated with a BCH address. This is information required
  to encrypt a message for that person.
*/

"use strict"

const AppUtils = require("../util")
const appUtils = new AppUtils()

const config = require("../../config")

// Mainnet by default.
const BCHJS = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

const { Command, flags } = require("@oclif/command")

//let _this

class GetPubKey extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.appUtils = appUtils
  }

  async run() {
    try {
      const { flags } = this.parse(GetPubKey)

      // Validate input flags
      this.validateFlags(flags)

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({
          restURL: config.TESTNET_REST,
          apiToken: config.JWT
        })
      }

      // Generate an absolute filename from the name.
      const filename = `${__dirname}/../../wallets/${flags.name}.json`
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log(`Error in GetKey.run: `, err)
    }
  }

  // Validate the proper flags are passed in.
  validateFlags(flags) {
    // Exit if address is not specified.
    const address = flags.address
    if (!address || address === "")
      throw new Error(`You must specify an address with the -a flag.`)

    return true
  }
}

GetPubKey.description = `Search the blockchain for a public key associated with an address.

Bitcoin Cash addresses are derived from a public key. If an address has made a
transaction, then the public key can be retrieved from the blockchain. This
public key is required in order to encrypt messages and files for that address.
`

GetPubKey.flags = {
  address: flags.string({
    char: "a",
    description: "BCH address to find public key for"
  })
}

module.exports = GetPubKey
