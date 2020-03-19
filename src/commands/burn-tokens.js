/*
  oclif command to burn a specific quantity of SLP tokens.

  Burning tokens is exactly the same as sending tokens without change. The only
  difference is that the output of the OP_RETURN indicates the difference.

  e.g. If you have 100 tokens and want to burn 10, you use the 100 token UTXO
  as input, and write the output OP_RETURN with a quantity of 90. That will
  effectively burn 10 tokens.
*/

"use strict"

const GetAddress = require("./get-address")
const UpdateBalances = require("./update-balances")
const Send = require("./send")
// const SendAll = require("./send-all")
const SendTokens = require("./send-tokens")
const config = require("../../config")

const BigNumber = require("bignumber.js")

const AppUtils = require("../util")
const appUtils = new AppUtils()

const send = new Send()
const sendTokens = new SendTokens()
// const sendAll = new SendAll()
const getAddress = new GetAddress()

// Mainnet by default
const BITBOX = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

// Used for debugging and error reporting.
const util = require("util")
util.inspect.defaultOptions = { depth: 2 }

const { Command, flags } = require("@oclif/command")

class BurnTokens extends Command {
  constructor(argv, config) {
    super(argv, config)
    //_this = this

    this.BITBOX = BITBOX
    this.appUtils = appUtils // Allows for easy mocking for unit tests.
  }

  async run() {
    try {
      const { flags } = this.parse(BurnTokens)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const name = flags.name // Name of the wallet.
      const qty = flags.qty // Amount to send in BCH.
      const tokenId = flags.tokenId // SLP token ID.

      // Open the wallet data file.
      const filename = `${__dirname}/../../wallets/${name}.json`
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
      //console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

      // Get a list of token UTXOs from the wallet for this token.
      const tokenUtxos = sendTokens.getTokenUtxos(tokenId, walletInfo)

      // Get a list of BCH UTXOs in this wallet that can be used to pay for
      // the transaction fee.
      const utxos = await sendTokens.getBchUtxos(walletInfo)
      // console.log(`send utxos: ${util.inspect(utxos)}`)

      // Instatiate the Send class so this function can reuse its selectUTXO() code.
      if (walletInfo.network === "testnet") {
        send.BITBOX = new config.BCHLIB({ restURL: config.TESTNET_REST })
        send.appUtils.BITBOX = new config.BCHLIB({
          restURL: config.TESTNET_REST
        })
      }

      // Select optimal UTXO
      // TODO: Figure out the appropriate amount of BCH to use in selectUTXO()
      const utxo = await send.selectUTXO(0.000015, utxos)
      // 1500 satoshis used until a more accurate calculation can be devised.
      // console.log(`selected utxo: ${util.inspect(utxo)}`)

      // Exit if there is no UTXO big enough to fulfill the transaction.
      if (!utxo.amount) {
        this.log(
          `Could not find a UTXO big enough for this transaction. More BCH needed.`
        )
        return
      }

      // Generate a new address, for sending change to.
      getAddress.BITBOX = this.BITBOX
      const tokenChangeAddress = await getAddress.getAddress(filename)
      // console.log(`tokenChangeAddress: ${tokenChangeAddress}`)

      const bchChangeAddress = await getAddress.getAddress(filename)
      // console.log(`bchChangeAddress: ${bchChangeAddress}`)

      // Generate an address to send the qty of tokens to burn.
      // const burnAddress = await getAddress.getAddress(filename)
      // console.log(`burnAddress: ${burnAddress}`)

      // Send the token, transfer change to the new address
      const hex = await this.burnTokens(
        utxo,
        qty,
        tokenChangeAddress,
        bchChangeAddress,
        walletInfo,
        tokenUtxos
      )
      // console.log(`hex: ${hex}`)

      const txid = await appUtils.broadcastTx(hex)
      appUtils.displayTxid(txid, walletInfo.network)
    } catch (err) {
      //if (err.message) console.log(err.message)
      //else console.log(`Error in .run: `, err)
      console.log(`Error in burn-tokens.js/run(): `, err)
    }
  }

  // Spends tokens and burns the selected quantity by subtracting that amount
  // from the output. This function returns a hex string of a transaction, ready
  // to be broadcast to the network.
  async burnTokens(
    utxo,
    qty,
    tokenChangeAddress,
    bchChangeAddress,
    walletInfo,
    tokenUtxos
  ) {
    try {
      //console.log(`utxo: ${util.inspect(utxo)}`)

      // instance of transaction builder
      let transactionBuilder
      if (walletInfo.network === `testnet`)
        transactionBuilder = new this.BITBOX.TransactionBuilder("testnet")
      else transactionBuilder = new this.BITBOX.TransactionBuilder()

      //const satoshisToSend = Math.floor(bch * 100000000)
      //console.log(`Amount to send in satoshis: ${satoshisToSend}`)
      const originalAmount = utxo.satoshis
      const vout = utxo.vout
      const txid = utxo.txid

      // add input utxo to pay for transaction.
      transactionBuilder.addInput(txid, vout)

      // add each token UTXO as an input.
      for (let i = 0; i < tokenUtxos.length; i++)
        transactionBuilder.addInput(tokenUtxos[i].txid, tokenUtxos[i].vout)

      // get byte count to calculate fee. paying 1 sat
      // Note: This may not be totally accurate. Just guessing on the byteCount size.
      // const byteCount = this.BITBOX.BitcoinCash.getByteCount(
      //   { P2PKH: 3 },
      //   { P2PKH: 5 }
      // )
      // //console.log(`byteCount: ${byteCount}`)
      // const satoshisPerByte = 1.1
      // const txFee = Math.floor(satoshisPerByte * byteCount)
      // console.log(`txFee: ${txFee} satoshis\n`)
      const txFee = 500

      // amount to send back to the sending address. It's the original amount - 1 sat/byte for tx size
      const remainder = originalAmount - txFee - 546 * 2
      if (remainder < 1)
        throw new Error(`Selected UTXO does not have enough satoshis`)
      //console.log(`remainder: ${remainder}`)

      // Generate the OP_RETURN entry for an SLP SEND transaction.
      const script = this.generateOpReturn(tokenUtxos, qty)
      //console.log(`script: ${JSON.stringify(script, null, 2)}`)

      const data = BITBOX.Script.encode(script)
      //console.log(`data: ${JSON.stringify(data, null, 2)}`)

      // Add OP_RETURN as first output.
      transactionBuilder.addOutput(data, 0)

      // Send dust transaction representing tokens being sent.
      transactionBuilder.addOutput(
        this.BITBOX.Address.toLegacyAddress(tokenChangeAddress),
        546
      )

      // Last output: send the change back to the wallet.
      transactionBuilder.addOutput(
        this.BITBOX.Address.toLegacyAddress(bchChangeAddress),
        remainder
      )
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      // Generate a keypair from the change address.
      const change = await appUtils.changeAddrFromMnemonic(
        walletInfo,
        utxo.hdIndex
      )
      //console.log(`change: ${JSON.stringify(change, null, 2)}`)
      const keyPair = this.BITBOX.HDNode.toKeyPair(change)

      // Sign the transaction with the private key for the UTXO paying the fees.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // Sign each token UTXO being consumed.
      for (let i = 0; i < tokenUtxos.length; i++) {
        const thisUtxo = tokenUtxos[i]
        // console.log(`thisUtxo: ${JSON.stringify(thisUtxo, null, 2)}`)

        // Generate a keypair to sign the SLP UTXO.
        const slpChangeAddr = await appUtils.changeAddrFromMnemonic(
          walletInfo,
          thisUtxo.hdIndex
        )

        const slpKeyPair = this.BITBOX.HDNode.toKeyPair(slpChangeAddr)
        //console.log(`slpKeyPair: ${JSON.stringify(slpKeyPair, null, 2)}`)

        transactionBuilder.sign(
          1 + i,
          slpKeyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          thisUtxo.satoshis
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      //console.log(`Transaction raw hex: `)
      //console.log(hex)

      return hex
    } catch (err) {
      console.log(`Error in sendTokens()`)
      throw err
    }
  }

  // Generate the OP_RETURN script for an SLP Send transaction.
  // It's assumed all elements in the tokenUtxos array belong to the same token.
  // Differs from the similar function in the send-token command, in that it
  // does not send change. It sends all tokens, minus the amount to be burned.
  generateOpReturn(tokenUtxos, qty) {
    try {
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
      // console.log(`qty: ${qty}`)

      if (!tokenUtxos || tokenUtxos.length === 0)
        throw new Error(`tokenUtxos array can not be empty.`)

      if (!qty || qty <= 0)
        throw new Error(`Quantity to burn needs to be greater than zero.`)

      const tokenId = tokenUtxos[0].tokenId
      const decimals = tokenUtxos[0].decimals

      // Calculate the total amount of tokens owned by the wallet.
      let totalTokens = 0
      for (let i = 0; i < tokenUtxos.length; i++)
        totalTokens += tokenUtxos[i].tokenQty

      // Calculate the amount of send, which is the total minus the quantity to
      // burn.
      const sendQty = totalTokens - qty

      let baseQty = new BigNumber(sendQty).times(10 ** decimals)
      baseQty = baseQty.absoluteValue()
      let baseQtyHex = baseQty.toString(16)
      baseQtyHex = baseQtyHex.padStart(16, "0")

      //console.log(`baseQty: ${baseQty.toString()}`)

      const script = [
        BITBOX.Script.opcodes.OP_RETURN,
        Buffer.from("534c5000", "hex"),
        //BITBOX.Script.opcodes.OP_1,
        Buffer.from("01", "hex"),
        Buffer.from(`SEND`),
        Buffer.from(tokenId, "hex"),
        Buffer.from(baseQtyHex, "hex")
      ]

      return script
    } catch (err) {
      console.log(`Error in generateOpReturn()`)
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags(flags) {
    //console.log(`flags: ${JSON.stringify(flags, null, 2)}`)

    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === "")
      throw new Error(`You must specify a wallet with the -n flag.`)

    const qty = flags.qty
    if (isNaN(Number(qty)))
      throw new Error(`You must specify a quantity of tokens with the -q flag.`)

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === "")
      throw new Error(`You must specifcy the SLP token ID`)

    // check Token Id should be hexademical chracters.
    const re = /^([A-Fa-f0-9]{2}){32,32}$/
    if (typeof tokenId !== "string" || !re.test(tokenId)) {
      throw new Error(
        "TokenIdHex must be provided as a 64 character hex string."
      )
    }

    return true
  }
}

BurnTokens.description = `Burn SLP tokens.`

BurnTokens.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" }),
  tokenId: flags.string({ char: "t", description: "Token ID" }),
  qty: flags.string({ char: "q", decription: "Quantity of tokens to send" })
}

module.exports = BurnTokens
