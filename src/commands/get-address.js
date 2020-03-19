/*
  Generates a new HD address for recieving BCH.

  -The next available address is tracked by the 'nextAddress' property in the
  wallet .json file.

  TODO:
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

const { Command, flags } = require("@oclif/command")

//let _this

class GetAddress extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.BITBOX = BITBOX
    this.appUtils = appUtils
  }

  async run() {
    try {
      const { flags } = this.parse(GetAddress)

      // Validate input flags
      this.validateFlags(flags)

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet)
        this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })

      // Generate an absolute filename from the name.
      const filename = `${__dirname}/../../wallets/${flags.name}.json`

      const newAddress = await this.getAddress(filename, flags)

      // Display the address as a QR code.
      qrcode.generate(newAddress, { small: true })

      const slpAddr = this.BITBOX.SLP.Address.toSLPAddress(newAddress)
      const legacy = this.BITBOX.Address.toLegacyAddress(newAddress)

      // Display the address to the user.
      this.log(`cash address: ${newAddress}`)
      this.log(`SLP address: ${slpAddr}`)
      this.log(`legacy address: ${legacy}`)
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log(`Error in GetAddress.run: `, err)
    }
  }

  async getAddress(filename, flags) {
    //const filename = `${__dirname}/../../wallets/${name}.json`

    const walletInfo = this.appUtils.openWallet(filename)
    //console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

    // Point to the correct rest server.
    if (walletInfo.network === "testnet")
      this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })
    else this.BITBOX = new config.BCHLIB({ restURL: config.MAINNET_REST })

    // root seed buffer
    let rootSeed
    if (config.RESTAPI === "bitcoin.com")
      rootSeed = this.BITBOX.Mnemonic.toSeed(walletInfo.mnemonic)
    else rootSeed = await this.BITBOX.Mnemonic.toSeed(walletInfo.mnemonic)

    // master HDNode
    let masterHDNode
    if (walletInfo.network === "testnet")
      masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed, "testnet")
    else masterHDNode = this.BITBOX.HDNode.fromSeed(rootSeed)

    // HDNode of BIP44 account
    const account = this.BITBOX.HDNode.derivePath(
      masterHDNode,
      `m/44'/${walletInfo.derivation}'/0'`
    )
    //console.log(`account: ${util.inspect(account)}`)

    // derive an external change address HDNode
    const change = this.BITBOX.HDNode.derivePath(
      account,
      `0/${walletInfo.nextAddress}`
    )
    //console.log(`change: ${util.inspect(change)}`)

    // Increment to point to a new address for next time.
    walletInfo.nextAddress++

    // Update the wallet.addresses array.
    const addresses = await this.appUtils.generateAddress(
      walletInfo,
      0,
      walletInfo.nextAddress
    )
    walletInfo.addresses = []
    for (let i = 0; i < addresses.length; i++)
      walletInfo.addresses.push([i, addresses[i]])

    // Update the wallet file.
    await this.appUtils.saveWallet(filename, walletInfo)

    // get the cash address
    let newAddress = this.BITBOX.HDNode.toCashAddress(change)

    // Convert to simpleledger: address if flag is set.
    if (flags && flags.token) {
      if (config.RESTAPI === "bitcoin.com")
        newAddress = this.BITBOX.Address.toSLPAddress(newAddress)
      else newAddress = this.BITBOX.Address.toSLPAddress(newAddress)
    }

    return newAddress
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

GetAddress.description = `Generate a new address to recieve BCH.`

GetAddress.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" }),
  token: flags.boolean({
    char: "t",
    description: "Generate a simpledger: token address"
  })
}

module.exports = GetAddress
