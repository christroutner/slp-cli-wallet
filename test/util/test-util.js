/*
  A test utility library.
*/

const shell = require('shelljs')

// Restore a the token wallet.
// Used in the update-balances test.
function restoreWallet () {
  // console.log(`__dirname: ${__dirname}`)
  shell.cp(`${__dirname}/../mocks/token-wallet.json`, `${__dirname}/../../wallets/test123.json`)
}

module.exports = {
  restoreWallet
}
