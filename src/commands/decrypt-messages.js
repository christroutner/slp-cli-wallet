/*
  Retrieve signals for messages, download messages from IPFS, and decrypt them.

  1. Get encryption data from the wallet.
  2. Get transaction history for the messaging address.
  3. Walk through the transactions, looking for an OP_RETURN in the TX.
  4. If OP_RETURN matches the MSG format, download the message from IPFS.
  5. Download, decrypt, and display the message.
*/

"use strict"

const IPFS_GATEWAY = `https://gateway.temporal.cloud`

const eccrypto = require("eccrypto-js")
const wif = require("wif")

const AppUtils = require("../util")
const GetKey = require("./get-key")

const config = require("../../config")

// Mainnet by default.
const bchjs = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

const { Command, flags } = require("@oclif/command")

let _this

class DecryptMessages extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.bchjs = bchjs
    this.eccrypto = eccrypto
    this.wif = wif

    this.appUtils = new AppUtils()
    this.getKey = new GetKey(argv, config)

    _this = this
  }

  async run() {
    try {
      const { flags } = this.parse(DecryptMessages)

      // Validate input flags
      this.validateFlags(flags)

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({
          restURL: config.TESTNET_REST,
          apiToken: config.JWT
        })
      }

      await this.getAndDecryptMessages(flags)
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log(`Error in DecryptMessages.run: `, err)
    }
  }

  // Primary function that orchestrates the other subfunctions.
  async getAndDecryptMessages(flags) {
    try {
      // Get the keypair used for encrypted messaging.
      const encryptionInfo = this.getKey.getKey(flags)
      // console.log(`encryptionInfo: ${JSON.stringify(encryptionInfo, null, 2)}`)

      // Get indexer data for the address uses for encrypted messaging.
      const balance = await this.bchjs.Blockbook.balance(encryptionInfo.bchAddr)
      // console.log(`balance: ${JSON.stringify(balance, null, 2)}`)

      // Get a list of TXIDs associated with that address.
      const txids = balance.txids

      // Search the list of transactions for the first signal of an encrypted message.
      const msgSignal = await this.findMsgSignal(txids)
      // console.log(`msgSignal: ${JSON.stringify(msgSignal, null, 2)}`)

      if (!msgSignal) {
        console.log(
          `Encrypted message signal could not be found in transaction history for ${encryptionInfo.bchAddr}`
        )
      }

      // Pull down the encrypted message from IPFS.
      const ipfsObj = await this.getIpfsObj(msgSignal)
      // console.log(`ipfsObj: ${JSON.stringify(ipfsObj, null, 2)}`)

      // Decrypt the message
      const decryptedMsg = await this.decryptMsg(ipfsObj, encryptionInfo)

      console.log(`Decrypted message:`)
      console.log(decryptedMsg)
    } catch (err) {
      console.error(`Error in getAndDecryptMessages()`)
      throw err
    }
  }

  // Decrypt the message in the object retrieved from IPFS.
  async decryptMsg(ipfsObj, encryptionInfo) {
    try {
      // Generate a private key from the WIF for decrypting the data.
      const privKeyBuf = _this.wif.decode(encryptionInfo.privKey).privateKey
      // console.log(`private key: ${privKeyBuf.toString("hex")}`)

      // Convert the hex encoded message to a buffer
      const msgBuf = Buffer.from(ipfsObj.encryptedMessage, "hex")

      // Convert the bufer into a structured object.
      const structData = _this.convertToEncryptStruct(msgBuf)

      // Decrypt the data with a private key.
      const fileBuf = await _this.eccrypto.decrypt(privKeyBuf, structData)
      // _this.log("Decrypted message:")
      // _this.log(fileBuf.toString())

      return fileBuf.toString()
    } catch (err) {
      console.error(`Error in decryptMsg()`)
      throw err
    }
  }

  // Converts a serialized buffer containing encrypted data into an object
  // that can interpreted by the eccryptoJS library.
  convertToEncryptStruct(encbuf) {
    try {
      let offset = 0
      const tagLength = 32
      let pub
      switch (encbuf[0]) {
        case 4:
          pub = encbuf.slice(0, 65)
          break
        case 3:
        case 2:
          pub = encbuf.slice(0, 33)
          break
        default:
          throw new Error(`Invalid type: ${encbuf[0]}`)
      }
      offset += pub.length

      const c = encbuf.slice(offset, encbuf.length - tagLength)
      const ivbuf = c.slice(0, 128 / 8)
      const ctbuf = c.slice(128 / 8)

      const d = encbuf.slice(encbuf.length - tagLength, encbuf.length)

      return {
        iv: ivbuf,
        ephemPublicKey: pub,
        ciphertext: ctbuf,
        mac: d
      }
    } catch (err) {
      console.error(`Error in convertToEncryptStruct()`)
      throw err
    }
  }

  // Pulls down the JSON object from the IPFS network.
  async getIpfsObj(ipfsHash) {
    try {
      // Use the axios library encapsulated in the IPFS class to make a general
      // http call to the IPFS gateway.
      const result = await this.bchjs.IPFS.axios.get(
        `${IPFS_GATEWAY}/ipfs/${ipfsHash}`
      )

      return result.data
    } catch (err) {
      console.error(`Error in getIpfsObj()`)
      throw err
    }
  }

  // Given a list of TXIDs, search for a transaction with an OP_RETURN that
  // matches the encrypted messaging signal.
  async findMsgSignal(txids) {
    try {
      // Loop through each transaction and look for an encrypted message.
      for (let i = 0; i < txids.length; i++) {
        const thisTxid = txids[i]

        const txData = await this.bchjs.RawTransactions.getRawTransaction(
          thisTxid,
          true
        )

        let script = []

        // Loop through each output of the transaction.
        for (let j = 0; j < txData.vout.length; j++) {
          const thisVout = txData.vout[j]

          // Decode the hex into normal text.
          script = this.bchjs.Script.toASM(
            Buffer.from(thisVout.scriptPubKey.hex, "hex")
          ).split(" ")
          // console.log(`script: ${JSON.stringify(script, null, 2)}`);

          // Exit the loop if OP_RETURN is found.
          if (script[0] === "OP_RETURN") break
        }

        // Skip if no OP_RETURN was found
        if (script[0] !== "OP_RETURN") continue

        const msg = Buffer.from(script[2], "hex").toString("ascii")
        // console.log(`Message encoded in the OP_RETURN: ${msg}`)

        // Return the IPFS hash for the message.
        const msgChunks = msg.split(" ")
        if (msgChunks[0] === "MSG") return msgChunks[2]
      }
    } catch (err) {
      console.error(`Error in findMsgSignal()`)
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

DecryptMessages.description = `Retrieve and display the encrypted message sent to this wallet.

Prototype command for retrieving, decrypting, and displaying a message using
the Bitcoin Cash blockchain and IPFS. This command does the following:

1. Get encryption data from the wallet.
2. Get transaction history for the messaging address.
3. Walk through the transactions, looking for an OP_RETURN in the TX.
4. If OP_RETURN matches the MSG format, download the message from IPFS.
5. Download, decrypt, and display the message.

It only does this for the first message found, then exists.

This is just a prototype.
`

DecryptMessages.flags = {
  name: flags.string({ char: "n", description: "Name of wallet" })
}

module.exports = DecryptMessages
