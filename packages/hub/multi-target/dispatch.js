if(Number(process.version[1]) >= 8) {
  module.exports = require('../dist/es2017');
} else {
  module.exports = require('../dist/es2016');
}
