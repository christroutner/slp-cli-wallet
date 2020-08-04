/*
  Scans first 20 addresses of each derivation path for history and balance.
  If any of them had a history, scans the next 20, until it reaches a batch of 20
  addresses with no history.
  derivation settings:
  145 - BIP44 standard path for Bitcoin Cash
  245 - BIP44 standard path for SLP tokens
  0 - Used by common software like the Bitcoin.com wallet and Honest.cash
*/

'use strict'

const config = require('../../config')
// Mainnet.
const BCHJS = new config.BCHLIB({ restURL: config.MAINNET_REST })

const { Command, flags } = require('@oclif/command')

class ScanFunds extends Command {
  constructor (argv, config) {
    super(argv, config)

    this.BCHJS = BCHJS

    this.derivePathes = [
      "m/44'/145'/0'/0", // BCH BIP 44 standard
      "m/44'/0'/0'/0", // Bitcoin.com wallet
      "m/44'/245'/0'/0" // SLP BIP44 standard
    ]
  }

  async run () {
    try {
      const { flags } = this.parse(ScanFunds)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const rootSeed = await this.BCHJS.Mnemonic.toSeed(flags.mnemonic)
      const masterHDNode = this.BCHJS.HDNode.fromSeed(rootSeed)

      // Loop through each derivation in the array.
      this.derivePathes.forEach(derivePath => {
        this.scanDerivationPath(masterHDNode, derivePath).then(
          addressesWithHistory => {
            if (addressesWithHistory.length === 0) {
              console.log(`No history found on derivation path ${derivePath}`)
            } else {
              addressesWithHistory.forEach(element => {
                console.log(
                  `${element.address} - confirmed balance: ${element.balance.confirmed} unconfirmed balance: ${element.balance.unconfirmed}`
                )
              })
            }
          }
        )
      })
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log('Error in .run: ', err)
      // console.log(`Error in scan-funds.js/run: `, err)
      throw err
    }
  }

  // Generates a child HDNode from masterHDNode using derivePath
  generateDerivedAddress (masterHDNode, derivePath) {
    try {
      const derivedHDNode = this.BCHJS.HDNode.derivePath(
        masterHDNode,
        derivePath
      )
      return this.BCHJS.HDNode.toCashAddress(derivedHDNode)
    } catch (err) {
      console.log('Error in generateDerivedAddress()')
      throw err
    }
  }

  // Queries ElectrumX for transaction history of address, if existed, gets address balance too
  async addressHasTransactionHistoryBalance (address) {
    try {
      let balance = { confirmed: 0, unconfirmed: 0 }
      const transactions = await this.BCHJS.Electrumx.transactions(
        address
      ).catch(err => {
        console.log(err)
      })
      let hasHistory
      if (transactions) {
        hasHistory =
          transactions.success && transactions.transactions.length > 0
      }
      if (hasHistory) {
        const balanceData = await this.BCHJS.Electrumx.balance(address).catch(
          err => {
            console.log(err)
          }
        )
        balance = balanceData.balance
      }
      return { hasHistory: hasHistory, balance: balance }
    } catch (err) {
      console.log('Error in addressHasTransactionHistoryBalance()')
      throw err
    }
  }

  // Scans the derivePath children in groups of 20 addresses, until one group
  // has no history
  async scanDerivationPath (masterHDNode, derivePath) {
    try {
      console.log(`Scanning derivation path ${derivePath}...`)
      const addressesWithHistory = []
      let limit = 20
      for (let index = 0; index <= limit; index++) {
        const derivedChildPath = `${derivePath}/${index}`

        const derivedChildAdress = this.generateDerivedAddress(
          masterHDNode,
          derivedChildPath
        )

        const historyBalanceData = await this.addressHasTransactionHistoryBalance(
          derivedChildAdress
        )

        if (historyBalanceData.hasHistory) {
          addressesWithHistory.push({
            address: derivedChildAdress,
            balance: historyBalanceData.balance
          })
          limit += 20
        }
      }
      return addressesWithHistory
    } catch (err) {
      console.log('Error in scanDerivationPath()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if mnemonic phrase not specified.
    const mnemonic = flags.mnemonic
    if (!mnemonic || mnemonic === '') { throw new Error('You must specify a mnemonic phrase with the -m flag.') }

    // Exit if number of mnemonic words is not 12.
    if (mnemonic.split(' ').length !== 12) { throw new Error('You must specify a mnemonic phrase of 12 words.') }

    return true
  }
}

ScanFunds.description = `Scans first 20 addresses of each derivation path for
history and balance of the given mnemonic. If any of them had a history, scans
the next 20, until it reaches a batch of 20 addresses with no history. The -m
flag is used to pass it a mnemonic phrase.

Derivation pathes used:
145 - BIP44 standard path for Bitcoin Cash
245 - BIP44 standard path for SLP tokens
0 - Used by common software like the Bitcoin.com wallet and Honest.cash
`

ScanFunds.flags = {
  mnemonic: flags.string({
    char: 'm',
    description: 'mnemonic phrase to generate addresses, wrapped in quotes'
  })
}

module.exports = ScanFunds
