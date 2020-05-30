/*
  Create wallet
*/

"use strict"

const assert = require("chai").assert
const fs = require("fs")
const PackageFiles = require("../../src/commands//package-files")
const packageFiles = new PackageFiles()
const path = require("path")

const fileName = `testPackage.json`
const zipName = "test.zip"
const filePath = `${__dirname}/../../packaged-files/${fileName}`
const packagedFilesPath = `${__dirname}/../../packaged-files`

// Set default environment variables for unit tests.
if (!process.env.TEST) process.env.TEST = "unit"

const deleteFile = fileName => {
  const prom = new Promise((resolve, reject) => {
    fs.unlink(fileName, () => {
      resolve(true)
    }) // Delete wallets file
  })
  return prom
}
const createFile = filePath =>
  new Promise((resolve, reject) => {
    const data = {
      test: "zip"
    }
    fs.writeFile(filePath, JSON.stringify(data, null, 2), function(err) {
      if (err) return reject(console.error(err))

      //console.log(`${name}.json written successfully.`)
      return resolve()
    })
  })
describe("package-files", () => {
  before(async () => {
    await createFile(filePath)
  })
  after(async () => {
    await deleteFile(filePath)
    await deleteFile(`${packagedFilesPath}/${zipName}`)
  })

  describe("#validateFlags", () => {
    it("should throw error if file is not supplied.", () => {
      try {
        packageFiles.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          `You must specify a file path with the -f flag.`,
          "Expected error message."
        )
      }
    })

    it("should throw error if message is not supplied.", () => {
      try {
        const flags = {
          file: filePath
        }

        packageFiles.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          `You must specify a message with the -m flag.`,
          "Expected error message."
        )
      }
    })

    it("should return true if all flags are supplied.", () => {
      const flags = {
        message: `test message`,
        file: filePath
      }

      const result = packageFiles.validateFlags(flags)

      assert.equal(result, true)
    })
  })

  describe("#makeZip", () => {
    it("should throw error if filePath is not supplied.", async () => {
      try {
        await packageFiles.makeZip()
      } catch (err) {
        assert.include(
          err.message,
          `filePath must be a string`,
          "Expected error message."
        )
      }
    })

    it("should throw error if outputPath is not supplied.", async () => {
      try {
        await packageFiles.makeZip(filePath)
      } catch (err) {
        assert.include(
          err.message,
          `outputPath must be a string`,
          "Expected error message."
        )
      }
    })
    it("should throw error if filePath  does not exist.", async () => {
      try {
        await packageFiles.makeZip("badPath.txt", packagedFilesPath)
      } catch (err) {
        assert.include(
          err.message,
          `no such file or directory`,
          "Expected error message."
        )
      }
    })

    it("should return true if zip is maked.", async () => {
      const outputPath = `${packagedFilesPath}/${zipName}`
      const result = await packageFiles.makeZip(filePath, outputPath)

      const exitsZip = fs.existsSync(outputPath)
      assert.equal(result, true)
      assert.equal(exitsZip, true)
    })
  })

  describe("#copyFile", () => {
    it("should throw error if inputPath is not supplied.", async () => {
      try {
        await packageFiles.copyFile()
      } catch (err) {
        assert.include(
          err.message,
          `inputPath must be a string`,
          "Expected error message."
        )
      }
    })

    it("should throw error if outputPath is not supplied.", async () => {
      try {
        await packageFiles.copyFile(filePath)
      } catch (err) {
        assert.include(
          err.message,
          `outputPath must be a string`,
          "Expected error message."
        )
      }
    })
    it("should throw error if filePath  does not exist.", async () => {
      try {
        await packageFiles.copyFile("badPath.txt", packagedFilesPath)
      } catch (err) {
        assert.include(
          err.message,
          `no such file or directory`,
          "Expected error message."
        )
      }
    })
    it("should throw error if outputPath  does not exist.", async () => {
      try {
        await packageFiles.copyFile(filePath, "badPath/")
      } catch (err) {
        assert.include(
          err.message,
          `no such file or directory`,
          "Expected error message."
        )
      }
    })
    it("should throw error if outputPath  is not a directory.", async () => {
      try {
        await packageFiles.copyFile(filePath, filePath)
      } catch (err) {
        assert.include(
          err.message,
          `outputPath must be a directory`,
          "Expected error message."
        )
      }
    })
    it("should return true if file or directory is copied.", async () => {
      const fileName = "package-lock.json"
      const outputPath = packagedFilesPath
      const filePath = path.resolve(fileName)

      const filePathResult = await packageFiles.copyFile(filePath, outputPath)

      const exitsFile = fs.existsSync(filePathResult)

      assert.equal(exitsFile, true)
      assert.equal(filePathResult, `${outputPath}/${fileName}`)
      deleteFile(filePathResult)
    })
  })

  describe("#getFileNameFromPath", () => {
    it("should throw error if path is not supplied.", async () => {
      try {
        await packageFiles.getFileNameFromPath()
      } catch (err) {
        assert.include(
          err.message,
          `path must be a string`,
          "Expected error message."
        )
      }
    })

    it("should throw error if path is not a string.", async () => {
      try {
        await packageFiles.getFileNameFromPath(1)
      } catch (err) {
        assert.include(
          err.message,
          `path must be a string`,
          "Expected error message."
        )
      }
    })

    it("should return file or directory name from path.", async () => {
      const fileName = "testFile"
      const filePath = `${packagedFilesPath}/${fileName}.txt`
      const name = await packageFiles.getFileNameFromPath(filePath)

      assert.equal(name, fileName)
    })
  })

  describe("#deleteFolderRecursive", () => {
    it("should throw error if path is not supplied.", async () => {
      try {
        await packageFiles.deleteFolderRecursive()
      } catch (err) {
        assert.include(
          err.message,
          `path must be a string`,
          "Expected error message."
        )
      }
    })

    it("should throw error if path is not a string.", async () => {
      try {
        await packageFiles.deleteFolderRecursive(1)
      } catch (err) {
        assert.include(
          err.message,
          `path must be a string`,
          "Expected error message."
        )
      }
    })
    it("should throw error if path does not exist.", async () => {
      try {
        const path = "/badPath"
        await packageFiles.deleteFolderRecursive(path)
      } catch (err) {
        assert.include(
          err.message,
          `no such  directory`,
          "Expected error message."
        )
      }
    })

    // it("should remove file or folder.", async () => {
    //   const fileName = "package-lock.json"
    //   const outputPath = `${packagedFilesPath}/${fileName}`

    //   const result = await packageFiles.deleteFolderRecursive(outputPath)

    //   const exitsFile = fs.existsSync(outputPath)

    //   assert.equal(result, true)
    //   assert.equal(exitsFile, false)
    // })
  })
})
