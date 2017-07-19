const rp = require('remove-punctuation');
const st = require('striptags');
const sw = require('stopword').removeStopwords;

module.exports = {
  genMachineName: function(name) {
    return rp(st(name.toLowerCase()));
  },
  genSortName: function(name) {
    return sw(this.genMachineName(name).split(' ')).join(' ');
  }
}
