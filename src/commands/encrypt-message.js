/*
  Uses Eliptic Curve encryption to encrypt a message and write it out to a
  JSON object.
*/

"use strict"

const config = require("../../config")

const eccrypto = require("eccrypto-js")
const fs = require("fs")

const AppUtils = require("../util")
const GetPubKey = require("./get-pubkey")
const GetKey = require("./get-key")

// Mainnet by default.
const BCHJS = new config.BCHLIB({
  restURL: config.MAINNET_REST,
  apiToken: config.JWT
})

const { Command, flags } = require("@oclif/command")

const inputPath = `${__dirname}/../../packaged-files`
let _this

class EncryptMessage extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.bchjs = BCHJS
    this.eccrypto = eccrypto
    this.fs = fs
    this.inputPath = inputPath
    this.getPubKey = new GetPubKey(argv, config)
    this.getKey = new GetKey(argv, config)
    this.appUtils = new AppUtils(argv, config)

    _this = this
  }

  async run() {
    try {
      const { flags } = this.parse(EncryptMessage)

      // Validate input flags
      this.validateFlags(flags)

      // Determine if this is a testnet wallet or a mainnet wallet.
      if (flags.testnet) {
        this.bchjs = new config.BCHLIB({
          restURL: config.TESTNET_REST,
          apiToken: config.JWT
        })
      }

      const {
        ipfsPaymentTxid,
        signalTxid,
        ipfsHash
      } = await this.encryptAndSendMessage(flags)

      console.log(
        `Encrypted message upload to IPFS with this hash: ${ipfsHash}`
      )
      console.log(`IPFS file hosting paid for with this tx: ${ipfsPaymentTxid}`)
      console.log(`Message signal delivered with BCH TXID: ${signalTxid}`)
    } catch (err) {
      if (err.message) console.log(`${err.message}: `, err)
      else console.log(`Error in EncryptMessage.run(): `, err)
    }
  }

  // Primary function that orchestrates the other subfunctions.
  async encryptAndSendMessage(flags) {
    try {
      const toAddr = flags.address
      const fileName = flags.file

      // Get the public key for the address from the blockchain.
      let pubKey
      try {
        pubKey = await this.getPubKey.queryBlockchain(flags)
      } catch (err) {
        if (!pubKey) throw new Error(`Could not find pubKey for target address`)
      }
      console.log(`pubKey found: `, pubKey)

      const filePath = `${_this.inputPath}/${fileName}.zip`

      // Encrypt the message with the public key.
      const pubKeyBuf = Buffer.from(pubKey, "hex")
      const bufferedFile = await _this.getBufferFromFile(filePath)
      const structuredEj = await this.eccrypto.encrypt(pubKeyBuf, bufferedFile)
      // console.log(`structuredEj: ${JSON.stringify(structuredEj, null, 2)}`)

      // Serialize the encrypted data object
      const encryptedEj = Buffer.concat([
        structuredEj.ephemPublicKey,
        structuredEj.iv,
        structuredEj.ciphertext,
        structuredEj.mac
      ])
      const encryptedStr = encryptedEj.toString("hex")

      // Generate a JSON object to upload to IPFS.
      const exportData = {
        toAddr: toAddr,
        encryptedFile: encryptedStr
      }

      // Write the JSON object to a JSON file.
      const ipfsHosting = await this.uploadToIpfs(exportData)
      console.log(
        `Sending ${ipfsHosting.paymentAmount} BCH to ${ipfsHosting.paymentAddr} to pay for IPFS hosting of message.`
      )

      const fundingInfo = this.getKey.getKey(flags)
      // console.log(`fundingInfo: ${JSON.stringify(fundingInfo, null, 2)}`)

      // Generate a transaction to pay IPFS hosting fee.
      const hostingHex = await this.payIpfsHosting(fundingInfo, ipfsHosting)
      // console.log(`hostingHex: `, hostingHex)

      // Broadcast the hosting payment transaction.
      const hostingTxid = await _this.appUtils.broadcastTx(hostingHex)
      // console.log(`hostingTxid: ${hostingTxid}`)

      // Wait for the IPFS file server to return an IPFS hash.
      const ipfsHash = await _this.waitForIpfsHash(ipfsHosting.fileId)
      // console.log(`ipfsHash: ${ipfsHash}`)

      // Create a memo.cash protocol transaction to signal message to recipient.
      const signalHex = await _this.signalMessage(fundingInfo, ipfsHash, toAddr)
      // console.log(`signalHex: `, signalHex)

      // Broadcast the signal to the recipient.
      const signalTxid = await _this.appUtils.broadcastTx(signalHex)
      // console.log(`signalTxid: ${signalTxid}`)

      return {
        ipfsPaymentTxid: hostingTxid,
        signalTxid: signalTxid,
        ipfsHash: ipfsHash
      }
    } catch (err) {
      console.error(`Error in encryptAndSendMessage()`)
      throw err
    }
  }

  // Poll the IPFS file server until it returns an IPFS hash.
  async waitForIpfsHash(fileId) {
    try {
      if (!fileId) {
        throw new Error(
          `File ID required to get info from IPFS hosting server.`
        )
      }

      let ipfsHash = ""

      while (!ipfsHash) {
        // for (let i = 0; i < 8; i++) {

        // Wait for 30 seconds.
        console.log(
          `Waiting for IPFS hosting service to confirm IPFS upload...`
        )
        await _this.appUtils.sleep(30000)

        const result = await _this.bchjs.IPFS.getStatus(fileId)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        if (result.ipfsHash) ipfsHash = result.ipfsHash
      }

      return ipfsHash
    } catch (err) {
      console.error(`Error in waitForIpfsHash()`)
      throw err
    }
  }

  // Generate a hex-encoded BCH transaction for paying the IPFS hosting fee.
  async payIpfsHosting(fundingInfo, ipfsHosting) {
    try {
      console.log(`fundingInfo: ${JSON.stringify(fundingInfo, null, 2)}`)
      console.log(`ipfsHosting: ${JSON.stringify(ipfsHosting, null, 2)}`)

      const satsToSend = _this.bchjs.BitcoinCash.toSatoshi(
        ipfsHosting.paymentAmount
      )

      // Create an EC Key Pair from the user-supplied WIF.
      const ecPair = _this.bchjs.ECPair.fromWIF(fundingInfo.privKey)

      // Generate the public address that corresponds to this WIF.
      const sendAddr = _this.bchjs.ECPair.toCashAddress(ecPair)
      // console.log(`Publishing ${hash} to ${ADDR}`)

      // Pick a UTXO controlled by this address.
      const utxos = await _this.bchjs.Electrumx.utxo(sendAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (!utxos.success) throw new Error("Could not get UTXOs")

      const utxo = _this.findBiggestUtxo(utxos.utxos)
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      if (!utxo) throw new Error(`Could not find a utxo!`)

      // instance of transaction builder
      const transactionBuilder = new _this.bchjs.TransactionBuilder()

      // const satoshisToSend = SATOSHIS_TO_SEND
      const originalAmount = utxo.value
      const vout = utxo.tx_pos
      const txid = utxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = _this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: 1 },
        { P2PKH: 2 }
      )
      //console.log(`byteCount: ${byteCount}`)
      const satoshisPerByte = 1.1
      const fee = Math.floor(satoshisPerByte * byteCount)

      // Send the payment for IPFS hosting.
      transactionBuilder.addOutput(ipfsHosting.paymentAddr, satsToSend)

      // Send the change back to the yourself.
      transactionBuilder.addOutput(sendAddr, originalAmount - satsToSend - fee)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        ecPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error(`Error in payIpfsHosting()`)
      throw err
    }
  }

  async signalMessage(fundingInfo, ipfsHash, toAddr) {
    try {
      console.log(`fundingInfo: ${JSON.stringify(fundingInfo, null, 2)}`)
      console.log(`ipfsHash: ${JSON.stringify(ipfsHash, null, 2)}`)
      console.log(`toAddr: `, toAddr)

      // Create an EC Key Pair from the user-supplied WIF.
      const ecPair = _this.bchjs.ECPair.fromWIF(fundingInfo.privKey)

      // Generate the public address that corresponds to this WIF.
      const sendAddr = _this.bchjs.ECPair.toCashAddress(ecPair)
      // console.log(`Publishing ${hash} to ${ADDR}`)

      // Pick a UTXO controlled by this address.
      const utxos = await _this.bchjs.Electrumx.utxo(sendAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (!utxos.success) throw new Error("Could not get UTXOs")

      const utxo = _this.findBiggestUtxo(utxos.utxos)
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      // instance of transaction builder
      const transactionBuilder = new _this.bchjs.TransactionBuilder()

      // const satoshisToSend = SATOSHIS_TO_SEND
      const originalAmount = utxo.value
      const vout = utxo.tx_pos
      const txid = utxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // TODO: Compute the 1 sat/byte fee.
      const fee = 500
      const dust = 546

      // Send the UTXO back to yourself, less the fee and dust.
      transactionBuilder.addOutput(sendAddr, originalAmount - fee - dust)

      // Add the memo.cash OP_RETURN to the transaction.
      // This contains the IPFS hash needed to download the message.
      const script = [
        _this.bchjs.Script.opcodes.OP_RETURN,
        Buffer.from("6d02", "hex"),
        Buffer.from(`MSG IPFS ${ipfsHash}`)
      ]

      // console.log(`script: ${util.inspect(script)}`);
      const data = _this.bchjs.Script.encode(script)
      // console.log(`data: ${util.inspect(data)}`);
      transactionBuilder.addOutput(data, 0)

      // Send a dust amount to the recipient to signal to them that they have a message.
      transactionBuilder.addOutput(toAddr, dust)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        ecPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error(`Error in signalMessage()`)
      throw err
    }
  }

  // Returns the utxo with the biggest balance from an array of utxos.
  findBiggestUtxo(utxos) {
    let largestAmount = 0
    let largestIndex = 0

    for (var i = 0; i < utxos.length; i++) {
      const thisUtxo = utxos[i]

      if (thisUtxo.value > largestAmount) {
        largestAmount = thisUtxo.value
        largestIndex = i
      }
    }

    // console.log(`Largest UTXO: ${JSON.stringify(utxos[largestIndex], null, 2)}`)

    return utxos[largestIndex]
  }

  // Upload an object to IPFS as a JSON file.
  async uploadToIpfs(obj) {
    try {
      // Write the object to a temporary file.
      const filename = await this.writeObject(obj)

      // Request a BCH address and amount of BCH to pay for hosting the file.
      const fileModel = await this.bchjs.IPFS.createFileModel(`./${filename}`)
      // console.log(`fileModel: ${JSON.stringify(fileModel, null, 2)}`)

      // This file ID is used to identify the file we're about to upload.
      const fileId = fileModel.file._id
      // console.log(`ID for your file: ${fileId}`)

      // Upload the actual file, include the ID assigned to it by the server.
      await this.bchjs.IPFS.uploadFile(`./${filename}`, fileId)
      // console.log(`fileObj: ${JSON.stringify(fileObj, null, 2)}`)

      this.deleteFile(filename)

      return {
        paymentAddr: fileModel.file.bchAddr,
        paymentAmount: fileModel.hostingCostBCH,
        fileId: fileId
      }
    } catch (err) {
      console.error(`Error in uploadToIpfs()`)
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags(flags) {
    // Exit if address is not specified.
    const address = flags.address
    if (!address || address === "")
      throw new Error(`You must specify an address with the -a flag.`)

    const name = flags.name
    if (!name || name === "")
      throw new Error(`You must specify a wallet with the -n flag.`)

    const file = flags.file
    if (!file || file === "") {
      throw new Error(
        `You must specify a file path with the -f flag. Enclose the file path in double quotes.`
      )
    }

    return true
  }

  // Write an object to a JSON file.
  writeObject(obj) {
    return new Promise(function(resolve, reject) {
      try {
        const fileStr = JSON.stringify(obj, null, 2)

        // Generate a random filename.
        const serialNum = Math.floor(100000000 * Math.random())

        const filename = `${serialNum}.json`

        _this.fs.writeFile(`./${filename}`, fileStr, function(err) {
          if (err) {
            console.error(`Error while trying to write ${filename} file.`)
            return reject(err)
          }
          // console.log(`${fileName} written successfully!`)
          return resolve(filename)
        })
      } catch (err) {
        console.error(
          `Error trying to write out ${filename} file in writeObject.`
        )
        return reject(err)
      }
    })
  }
  //Gets the buffer of a file
  async getBufferFromFile(inputPath) {
    return new Promise(function(resolve, reject) {
      try {
        if (!_this.fs.existsSync(inputPath))
          throw new Error(`no such file or directory ${inputPath}`)

        _this.fs.readFile(inputPath, function(err, buffer) {
          if (err) {
            console.error(`Error while trying to read file.`)
            return reject(err)
          }
          return resolve(buffer)
        })
      } catch (err) {
        console.log(err)
        console.error(`Error in getBufferFromFile.`)
        return reject(err)
      }
    })
  }

  // Delete the file that was generate with writeObject.
  deleteFile(filename) {
    try {
      fs.unlinkSync(`./${filename}`)
    } catch (err) {
      console.error(`Error in deleteFile()`)
      throw err
    }
  }
}

EncryptMessage.description = `Encrypt a message for another BCH address.

Given a BCH address, this command will do the following:
1. It will search the blockchain for the public key associated with the address.
2. It will encrypt the message with the public key.
3. It will upload the encrypted message to IPFS.
4. It will signal the address with an on-chain message.
5. It will pay for the IPFS and BCH messages with the address set using set-key.
`

EncryptMessage.flags = {
  address: flags.string({
    char: "a",
    description: "BCH address to find public key for"
  }),

  file: flags.string({
    char: "f",
    description: "The file you want to encrypt and send. Wrap in double quotes."
  }),

  name: flags.string({ char: "n", description: "Name of wallet" })
}

module.exports = EncryptMessage
