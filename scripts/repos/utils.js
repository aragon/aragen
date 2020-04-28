const fs = require('fs-extra')

/**
 * Read file contents as JSON
 * @param filepath path
 */
const readJson = (filepath) => fs.readJsonSync(filepath)

module.exports = {
  readJson,
}
