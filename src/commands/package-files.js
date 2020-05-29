"use strict"

const fs = require("fs")

const AppUtils = require("../util")
const zipFolder = require("zip-folder")

const { Command, flags } = require("@oclif/command")

const outputPath = `${__dirname}/../../packaged-files`

let _this

class EncryptMessage extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.fs = fs
    this.appUtils = new AppUtils(argv, config)
    this.outputPath = outputPath
    this.zipFolder = zipFolder

    _this = this
  }

  async run() {
    try {
      const { flags } = this.parse(EncryptMessage)

      // Validate input flags
      this.validateFlags(flags)
      await _this.packageFiles(flags)
    } catch (err) {
      if (err.message) console.log(`${err.message}: `, err)
      else console.log(`Error in EncryptMessage.run(): `, err)
    }
  }
  // Validate the proper flags are passed in.
  async validateFlags(flags) {
    // Exit if address is not specified.
    const filePath = flags.file
    if (!filePath || filePath === "")
      throw new Error(`You must specify a file path with the -f flag.`)

    const message = flags.message
    if (!message || message === "") {
      throw new Error(
        `You must specify a message with the -m flag. Enclose the message in double quotes.`
      )
    }

    return true
  }
  async packageFiles(flags) {
    try {
      const msgObject = {
        message: flags.message
      }
      //Creates the directory that will hold the json
      //and the file to be zipped
      const dirName = await _this.makeDir()
      if (!dirName) throw new Error("Error creating directory")

      const jsonPath = `${_this.outputPath}/${dirName}`
      //console.log(`dirName : ${dirName}`)

      //creates the json file in the directory created previously
      const msgPath = await _this.writeObject(msgObject, jsonPath)
      if (!msgPath) throw new Error("Error creating json file")
      //console.log(`msgPath : ${msgPath}`)

      const filePath = `${process.cwd()}/${flags.file}`
      //console.log(`file path : ${filePath}`)

      const outputFilePath = `${_this.outputPath}/${dirName}`

      const isCopied = await _this.copyFile(filePath, outputFilePath)
      if (!isCopied) throw new Error("Error copying file")

      const inputPath = `${_this.outputPath}/${dirName}`

      const fileName = _this.getFileNameFromPath(flags.file)
      console.log("Files  zipped successfully!")
      console.log(`Package file name : ${fileName}`)

      const outputZip = `${_this.outputPath}/${fileName}.zip`

      // Zip the user files and the json containing the message
      const isZipped = await _this.makeZip(inputPath, outputZip)
      if (!isZipped) throw new Error("Error creating zip")
      //console.log(`isZipped : ${isZipped}`)
    } catch (error) {
      throw error
    }
  }
  async makeZip(filePath, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // for validate if it exits file  or directory
        if (!_this.fs.existsSync(filePath))
          throw new Error(`no such file or directory ${filePath}`)

        _this.zipFolder(filePath, outputPath, async function(err) {
          if (err) throw new Error(err)
          else resolve(true)
        })
      } catch (err) {
        return reject(err)
      }
    })
  }

  // Write an object to a JSON file.
  writeObject(obj, outputDir) {
    return new Promise(function(resolve, reject) {
      try {
        const fileStr = JSON.stringify(obj, null, 2)

        // Generate a random filename.
        const serialNum = Math.floor(100000000 * Math.random())

        const filename = `${serialNum}.json`
        const output = `${outputDir}/${filename}`

        _this.fs.writeFile(output, fileStr, function(err) {
          if (err) {
            console.error(`Error while trying to write ${fileame} file.`)
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

  // Write an object to a JSON file.
  makeDir() {
    return new Promise(function(resolve, reject) {
      try {
        // Generate a random filename.
        const dirName = Math.floor(100000000 * Math.random())

        const outputPath = `${_this.outputPath}/${dirName}`

        _this.fs.mkdir(outputPath, { recursive: true }, function(err) {
          if (err) {
            console.error(`Error while trying to write ${dirName} file.`)
            return reject(err)
          }
          // console.log(`${dirName} written successfully!`)
          return resolve(dirName)
        })
      } catch (err) {
        console.error(`Error in makeDir.`)
        return reject(err)
      }
    })
  }
  //
  async copyFile(inputPath, outputPath) {
    return new Promise(function(resolve, reject) {
      try {
        // for validate if it exits file  or directory
        if (!_this.fs.existsSync(inputPath))
          throw new Error(`no such file or directory ${inputPath}`)

        if (!_this.fs.existsSync(outputPath))
          throw new Error(`no such file or directory ${outputPath}`)

        //Get file name
        const indexName = inputPath.lastIndexOf("/")
        const fileName = inputPath.substring(indexName, inputPath.length)

        const output = `${outputPath}/${fileName}`

        _this.fs.copyFile(inputPath, output, function(err) {
          if (err) {
            console.error(`Error while trying to copy file.`)
            return reject(err)
          }
          // console.log(`${dirName} written successfully!`)
          return resolve(true)
        })
      } catch (err) {
        console.error(`Error in copyFile.`)
        return reject(err)
      }
    })
  }
  getFileNameFromPath(path) {
    try {
      const index = path.lastIndexOf(".")
      const subName = path.substring(0, index)
      const index2 = subName.lastIndexOf("/")
      const name = subName.substring(index2, subName.length)
      return name
    } catch (error) {
      throw error
    }
  }
}

EncryptMessage.description = `
Package files
`

EncryptMessage.flags = {
  file: flags.string({
    char: "f",
    description: "Path of the files"
  }),
  message: flags.string({
    char: "m",
    description:
      "The message you want to encrypt and send. Wrap in double quotes."
  })
}

module.exports = EncryptMessage
