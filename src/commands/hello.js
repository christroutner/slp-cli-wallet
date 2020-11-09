'use strict'

const { Command, flags } = require('@oclif/command')

class HelloCommand extends Command {
  async run () {
    const { flags } = this.parse(HelloCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/commands/hello.js`)
  }
}

HelloCommand.description = `Example command from oclif
...
Leaving it here for future reference in development.
`

HelloCommand.flags = {
  name: flags.string({ char: 'n', description: 'name to print' })
}

module.exports = HelloCommand
