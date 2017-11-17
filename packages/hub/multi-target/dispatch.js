if(Number(process.version[1]) >= 8) {
  console.log('es2017');
  module.exports = require('../dist/es2017');
} else {
  console.log('es2016');
  module.exports = require('../dist/es2016');
}
