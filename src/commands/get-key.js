/*
  Get the key pair set in the wallet for use with encrypted messages.
*/

"use strict"

const qrcode = require("qrcode-terminal")

const AppUtils = require("../util")
const appUtils = new AppUtils()

const config = require("../../config")

// Mainnet by default.
const BITBOX = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

// Used for debugging and iterrogating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 2 }

const { Command, flags } = require("@oclif/command")

//let _this

class GetKey extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.BITBOX = BITBOX
    this.appUtils = appUtils
  }

  async run() {
    try {
      const { flags } = this.parse(GetKey)

      // Validate input flags
      this.validateFlags(flags)

      // Get the encryption information from the wallet.
      const encrypt = this.getKey(flags)

      console.log(
        `Key pair for encryption: ${JSON.stringify(encrypt, null, 2)}`
      )
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log(`Error in SetKey.run: `, err)
    }
  }

  // Returns the encryption information stored in a wallet file.
  getKey(flags) {
    try {
      // Generate an absolute filename from the name.
      const filename = `${__dirname}/../../wallets/${flags.name}.json`

      const walletInfo = this.appUtils.openWallet(filename)

      return walletInfo.encrypt
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log(`Error in GetKey.run: `, err)
    }
  }

  // Validate the proper flags are passed in.
  validateFlags(flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === "")
      throw new Error(`You must specify a wallet with the -n flag.`)

    return true
  }
}

GetKey.description = `Generate a new private/public key pair.`

GetKey.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" })
}

module.exports = GetKey
