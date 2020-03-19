/*
  oclif command to send all BCH in a wallet to a single address.

  This can be used to consolidate UTXOs or transfer all BCH to
  another wallet.

  This command has a negative effect on the users privacy by
  linking all addresses and UTXOs. This effectively deanonymize users.

  The order of operations matter. The code below complete the following steps
  *in order*:
  -Add each UTXO as an input to the TX
  -Calculate the TX fee
  -Add the output
  -Loop through each input and sign
  -Build the transaction
  -Broadcast the transaction

  Note: This will not send any tokens. If you run this before running
  send-all-tokens, the wallet will not have enough BCH to send the tokens.

  TO-DO: once sending tokens is implemented, this command should send all
  tokens first, then send BCH.
*/

"use strict"

const UpdateBalances = require("./update-balances")
const config = require("../../config")

const AppUtils = require("../util")
const appUtils = new AppUtils()

// Mainnet by default
const BITBOX = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

// Used for debugging and error reporting.
const util = require("util")
util.inspect.defaultOptions = { depth: 2 }

const { Command, flags } = require("@oclif/command")

class SendAll extends Command {
  constructor(argv, config) {
    super(argv, config)
    //_this = this

    this.BITBOX = BITBOX
  }

  async run() {
    try {
      const { flags } = this.parse(SendAll)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.
      const sendToAddr = flags.sendAddr // The address to send to.

      // Open the wallet data file.
      const filename = `${__dirname}/../../wallets/${flags.name}.json`
      let walletInfo = appUtils.openWallet(filename)
      walletInfo.name = name

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (walletInfo.network === "testnet") {
        this.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })
        appUtils.BITBOX = this.BITBOX
      }

      // Update balances before sending.
      const updateBalances = new UpdateBalances()
      updateBalances.BITBOX = this.BITBOX
      walletInfo = await updateBalances.updateBalances(flags)

      // Get all UTXOs controlled by this wallet.
      const utxos = await appUtils.getUTXOs(walletInfo)
      //console.log(`utxos: ${util.inspect(utxos)}`)

      // Send the BCH, transfer change to the new address
      const hex = await this.sendAllBCH(utxos, sendToAddr, walletInfo)

      const txid = await appUtils.broadcastTx(hex)

      console.log(`TXID: ${txid}`)

      // Display link to block explorer.
      console.log(`View on block explorer:`)
      if (walletInfo.network === "testnet")
        console.log(`https://explorer.bitcoin.com/tbch/tx/${txid}`)
      else console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`)
    } catch (err) {
      //if (err.message) console.log(err.message)
      //else console.log(`Error in .run: `, err)
      console.log(`Error in send-all.js/run: `, err)
    }
  }

  // Sends all BCH in a wallet to a new address.
  async sendAllBCH(utxos, sendToAddr, walletInfo) {
    try {
      //console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (!Array.isArray(utxos)) throw new Error(`utxos must be an array.`)

      if (utxos.length === 0) throw new Error(`No utxos found.`)

      // instance of transaction builder
      let transactionBuilder
      if (walletInfo.network === `testnet`)
        transactionBuilder = new this.BITBOX.TransactionBuilder("testnet")
      else transactionBuilder = new this.BITBOX.TransactionBuilder()

      let originalAmount = 0

      // Calulate the original amount in the wallet and add all UTXOs to the
      // transaction builder.
      for (var i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        originalAmount = originalAmount + utxo.satoshis

        transactionBuilder.addInput(utxo.txid, utxo.vout)
      }

      if (originalAmount < 1)
        throw new Error(`Original amount is zero. No BCH to send.`)

      // original amount of satoshis in vin
      //console.log(`originalAmount: ${originalAmount}`)

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = this.BITBOX.BitcoinCash.getByteCount(
        { P2PKH: utxos.length },
        { P2PKH: 1 }
      )
      const fee = Math.ceil(1.1 * byteCount)
      //console.log(`fee: ${byteCount}`)

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount = originalAmount - fee
      //console.log(`sendAmount: ${sendAmount}`)

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        this.BITBOX.Address.toLegacyAddress(sendToAddr),
        sendAmount
      )

      let redeemScript

      // Loop through each input and sign
      for (var i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        // Generate a keypair for the current address.
        const change = await appUtils.changeAddrFromMnemonic(
          walletInfo,
          utxo.hdIndex
        )
        const keyPair = this.BITBOX.HDNode.toKeyPair(change)

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      //console.log(`Transaction raw hex: ${hex}`)

      return hex
    } catch (err) {
      console.log(`Error in sendAllBCH()`)
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags(flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === "")
      throw new Error(`You must specify a wallet with the -n flag.`)

    const sendAddr = flags.sendAddr
    if (!sendAddr || sendAddr === "")
      throw new Error(`You must specify a send-to address with the -a flag.`)

    return true
  }
}

SendAll.description = `Send all BCH in a wallet to another address. **Degrades Privacy**
Send all BCH in a wallet to another address.

This method has a negative impact on privacy by linking all addresses in a
wallet. If privacy of a concern, CoinJoin should be used.
This is a good article describing the privacy concerns:
https://bit.ly/2TnhdVc
`

SendAll.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" }),
  sendAddr: flags.string({ char: "a", description: "Cash address to send to" }),
  ignoreTokens: flags.boolean({
    char: "i",
    description: "Ignore and burn tokens"
  })
}

module.exports = SendAll
