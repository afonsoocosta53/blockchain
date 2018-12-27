var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

// set up a mongoose model
var ChaveSchema = new Schema({
  id_gerado: {
    type: String,
    index: true
	},
	token: {
		type: String
	},
	token_uniq: {
		type: String
	}
});

module.exports.createChave = function (newChave, callback) {
  newChave.save(callback);
}

module.exports.getChaveByID = function (id, callback) {
  var query = { id_gerado: id };
  Chave.findOne(query, callback);
}

module.exports = mongoose.model('Chave', ChaveSchema);