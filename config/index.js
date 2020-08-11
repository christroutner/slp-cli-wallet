/*
  This config file contains settings shared across files.

  Toolset and REST API can be selected with this file, or by setting the RESTAPI
  environment variable. By default, Bitcoin.com's infrastructure is used.

  You can run your own infrastructure. See bchjs.cash for details.
*/

'use strict'

// By default choose a local rest API.
// let RESTAPI = "rest.bitcoin.com"
// let RESTAPI = "wallet"
let RESTAPI = 'fullstack.cash'

// Override the RESTAPI setting if envronment variable is set.
if (process.env.RESTAPI && process.env.RESTAPI !== '') { RESTAPI = process.env.RESTAPI }

// console.log(`process.env.RESTAPI: ${process.env.RESTAPI}`)

// Ensure bch-js can pick up the env var.
process.env.RESTAPI = RESTAPI

const BCHJS = require('@psf/bch-js')
// const BITBOX = require("slp-sdk")

const config = {}

// Set the JWT access token.
config.JWT = '' // default value
if (process.env.BCHJSTOKEN) config.JWT = process.env.BCHJSTOKEN

if (RESTAPI === 'wallet') {
  config.BCHLIB = BCHJS.BitboxShim()
  // config.MAINNET_REST = `https://api.bchjs.cash/v3/`
  // config.TESTNET_REST = `https://tapi.bchjs.cash/v3/`
  config.MAINNET_REST = 'https://wallet.bchjs.cash/v3/'
  config.TESTNET_REST = 'https://twallet.bchjs.cash/v3/'
  config.RESTAPI = 'wallet'
}

if (RESTAPI === 'fullstack.cash') {
  config.BCHLIB = BCHJS
  config.MAINNET_REST = 'https://api.fullstack.cash/v3/'
  config.TESTNET_REST = 'https://tapi.fullstack.cash/v3/'
  config.RESTAPI = 'bchjs'
}

// Use BITBOX and the bitcoin.com infrastructure.
// if (RESTAPI === "bitcoin.com") {
//   config.BCHLIB = BITBOX
//   config.MAINNET_REST = `https://rest.bitcoin.com/v2/`
//   config.TESTNET_REST = `https://trest.bitcoin.com/v2/`
//   config.RESTAPI = "bitcoin.com"
// }

// Use bch-js but use it with the bitcoin.com infrastructure.
if (RESTAPI === 'rest.bitcoin.com') {
  config.BCHLIB = BCHJS.BitboxShim()
  config.MAINNET_REST = 'https://rest.bitcoin.com/v2/'
  config.TESTNET_REST = 'http://157.245.141.224:3000/v2/'
  config.RESTAPI = 'rest.bitcoin.com'
}

// Use bch-js with local infrastructure.
if (RESTAPI === 'local') {
  config.BCHLIB = BCHJS.BitboxShim()
  // config.MAINNET_REST = `http://192.168.0.36:12400/v3/`
  // config.TESTNET_REST = `http://192.168.0.38:13400/v3/`
  config.MAINNET_REST = 'http://127.0.0.1:3000/v3/'
  // config.TESTNET_REST = `http://decatur.hopto.org:13400/v3/`
  // config.TESTNET_REST = `https://testnet.bchjs.cash/v3/`
  config.TESTNET_REST = 'http://127.0.0.1:4000/v3/'
  config.RESTAPI = 'local'
}

// Use bch-js with decatur infrastructure.
if (RESTAPI === 'decatur') {
  config.BCHLIB = BCHJS.BitboxShim()
  config.MAINNET_REST = 'http://decatur.hopto.org:12400/v3/'
  config.TESTNET_REST = 'http://decatur.hopto.org:13400/v3/'
  config.RESTAPI = 'decatur'
}

module.exports = config
