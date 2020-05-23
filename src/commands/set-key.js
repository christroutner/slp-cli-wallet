/*
  Forked from get-key.js. This command is exactly the same, except that it
  sets the WIF and BCH addr in the wallet as the one to use for encryption
  tasks.
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

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet)
        this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })

      // Generate an absolute filename from the name.
      const filename = `${__dirname}/../../wallets/${flags.name}.json`

      const newPair = await this.getPair(filename)
      const newAddress = newPair.pub

      // Display the Private Key
      // qrcode.generate(newPair.priv, { small: true })

      // Display the address as a QR code.
      qrcode.generate(newAddress, { small: true })

      // Display the address to the user.
      this.log(`${newAddress}`)
      //this.log(`legacy address: ${legacy}`)

      const slpAddr = this.BITBOX.SLP.Address.toSLPAddress(newAddress)
      console.log(`${slpAddr}`)

      this.log(`Private Key: ${newPair.priv}`)
      this.log(`Public Key: ${newPair.pubKey}`)

      // Generate a encryption object to save in the wallet.
      const encrypt = {
        bchAddr: newAddress,
        slpAddr: slpAddr,
        pubKey: newPair.pubKey,
        privKey: newPair.priv
      }

      await this.saveKey(encrypt, filename)
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log(`Error in GetKey.run: `, err)
    }
  }

  // Save key data to the wallet file.
  async saveKey(encrypt, walletFilename) {
    try {
      const walletInfo = appUtils.openWallet(walletFilename)

      walletInfo.encrypt = encrypt

      await this.appUtils.saveWallet(walletFilename, walletInfo)
    } catch (err) {
      console.log(`Error in saveKey().`)
      throw err
    }
  }

  // Get a private/public key pair. Private key in WIF format.
  async getPair(filename) {
    try {
      //const filename = `${__dirname}/../../wallets/${name}.json`
      const walletInfo = appUtils.openWallet(filename)
      //console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

      // root seed buffer
      let rootSeed
      if (config.RESTAPI === "bitcoin.com")
        rootSeed = this.BITBOX.Mnemonic.toSeed(walletInfo.mnemonic)
      else rootSeed = await this.BITBOX.Mnemonic.toSeed(walletInfo.mnemonic)

      // master HDNode
      if (walletInfo.network === "testnet")
        var masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed, "testnet")
      else var masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed)

      // HDNode of BIP44 account
      const account = this.BITBOX.HDNode.derivePath(
        masterHDNode,
        `m/44'/${walletInfo.derivation}'/0'`
      )

      // derive an external change address HDNode
      const change = this.BITBOX.HDNode.derivePath(
        account,
        `0/${walletInfo.nextAddress}`
      )

      // Increment to point to a new address for next time.
      walletInfo.nextAddress++

      // Update the wallet file.
      await appUtils.saveWallet(filename, walletInfo)

      // get the cash address
      const newAddress = this.BITBOX.HDNode.toCashAddress(change)
      //const legacy = BITBOX.HDNode.toLegacyAddress(change)

      // get the private key
      const newKey = this.BITBOX.HDNode.toWIF(change)

      const ec = this.BITBOX.ECPair.fromWIF(newKey)
      const pubKey = this.BITBOX.ECPair.toPublicKey(ec)

      return {
        priv: newKey,
        pub: newAddress,
        pubKey: pubKey.toString("hex")
      }
    } catch (err) {
      console.log(`Error in getPair().`)
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

GetKey.description = `Generate a new private/public key pair.`

GetKey.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" })
}

module.exports = GetKey
