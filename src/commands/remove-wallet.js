"use strict"

const shelljs = require("shelljs")

const { Command, flags } = require("@oclif/command")

class RemoveWallet extends Command {
  async run() {
    try {
      const { flags } = this.parse(RemoveWallet)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname}/../../wallets/${flags.name}.json`

      this.removeWallet(filename)
    } catch (err) {
      console.log(`Error: `, err)
    }
  }

  async removeWallet(filename) {
    try {
      shelljs.rm(filename)
    } catch (err) {
      if (err.code !== "EEXIT") console.log(`Error in removeWallet().`)
      throw err
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

RemoveWallet.description = `Remove an existing wallet.`

RemoveWallet.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" })
}

module.exports = RemoveWallet
