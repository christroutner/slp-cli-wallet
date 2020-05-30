"use strict"

const fs = require("fs")
const fsExtra = require("fs-extra")
const fsPromise = fs.promises

const AppUtils = require("../util")
const zipFolder = require("zip-folder")

const { Command, flags } = require("@oclif/command")

const outputPath = `${__dirname}/../../packaged-files`
const path = require("path")

let _this

class EncryptMessage extends Command {
  constructor(argv, config) {
    super(argv, config)

    this.fs = fs
    this.appUtils = new AppUtils(argv, config)
    this.outputPath = outputPath
    this.zipFolder = zipFolder
    this.fsExtra = fsExtra
    this.path = path
    this.fsPromise = fsPromise

    _this = this
  }

  async run() {
    try {
      const { flags } = this.parse(EncryptMessage)

      // Validate input flags
      this.validateFlags(flags)
      await _this.packageFiles(flags)
    } catch (err) {
      if (err.message) console.log(`${err.message}: `, err.message)
      else console.log(`Error in EncryptMessage.run(): `, err)
    }
  }
  // Validate the proper flags are passed in.
  validateFlags(flags) {
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

      const filePath = _this.path.resolve(flags.file)
      //console.log(`filePath: ${filePath}`)

      const outputFilePath = `${_this.outputPath}/${dirName}`

      const isCopied = await _this.copyFile(filePath, outputFilePath)
      if (!isCopied) throw new Error("Error copying file")

      const inputPath = `${_this.outputPath}/${dirName}`

      const fileName = _this.getFileNameFromPath(filePath)

      const outputZip = `${_this.outputPath}/${fileName}.zip`

      // Zip the user files and the json containing the message
      const isZipped = await _this.makeZip(inputPath, outputZip)
      if (!isZipped) throw new Error("Error creating zip")
      //console.log(`isZipped : ${isZipped}`)
      await _this.deleteFolderRecursive(inputPath)

      console.log("Files  zipped successfully!")
      console.log(`Package file name : ${fileName}.zip`)
    } catch (error) {
      throw error
    }
  }

  async makeZip(filePath, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // validate input
        if (!filePath || typeof filePath !== "string")
          throw new Error("filePath must be a string.")

        if (!outputPath || typeof outputPath !== "string")
          throw new Error("outputPath must be a string.")

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

  // Make a direcorty
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
  // Copy file or directory
  async copyFile(inputPath, outputPath) {
    return new Promise(function(resolve, reject) {
      try {
        // validate input
        if (!inputPath || typeof inputPath !== "string")
          throw new Error("inputPath must be a string.")

        if (!outputPath || typeof outputPath !== "string")
          throw new Error("outputPath must be a string.")

        // for validate if it exits file  or directory
        if (!_this.fs.existsSync(inputPath))
          throw new Error(`no such file or directory ${inputPath}`)

        if (!_this.fs.existsSync(outputPath))
          throw new Error(`no such file or directory ${outputPath}`)

        if (!_this.fs.lstatSync(outputPath).isDirectory())
          throw new Error(`outputPath must be a directory.`)

        //Get file name
        const indexName = inputPath.lastIndexOf("/")
        const fileName = inputPath.substring(indexName + 1, inputPath.length)
        const output = `${outputPath}/${fileName}`

        _this.fsExtra.copy(inputPath, output, function(err) {
          if (err) {
            console.log("An error occured while copying the folder.")
            return reject(err)
          }
          console.log("Copy completed!")
          return resolve(output)
        })
      } catch (err) {
        console.error(`Error in copyFile.`)
        return reject(err)
      }
    })
  }

  // Get file name from path
  getFileNameFromPath(path) {
    try {
      if (!path || typeof path !== "string")
        throw new Error("path must be a string")

      const _path = _this.path.resolve(path)
      const extension = _this.path.extname(_path)
      const name = _this.path.basename(_path, extension)

      return name
    } catch (error) {
      throw error
    }
  }

  // Remove file or folder
  async deleteFolderRecursive(path) {
    return new Promise(function(resolve, reject) {
      try {
        if (!path || typeof path !== "string")
          throw new Error("path must be a string")

        if (!_this.fs.existsSync(path))
          throw new Error(`no such  directory ${path}`)

        const _path = _this.path.resolve(path)
        _this.fs.rmdir(_path, { recursive: true }, function(err) {
          if (err) {
            console.log("An error occured while remove the folder.")
            return reject(err)
          }
          return resolve(true)
        })
      } catch (error) {
        throw error
      }
    })
  }
}

EncryptMessage.description = `Zips file or directory.
1-Copies the file or the specified directory
2-Exports the message in a JSON file
3-Creates a ZIP file with both contents
`

EncryptMessage.flags = {
  file: flags.string({
    char: "f",
    description: "Path of the file or directory"
  }),
  message: flags.string({
    char: "m",
    description:
      "The message you want to encrypt and send. Wrap in double quotes."
  })
}

module.exports = EncryptMessage
