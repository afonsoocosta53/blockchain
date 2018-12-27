var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var DefinicoesMoedaSchema = mongoose.Schema({
    quantidade: {
        type: String
    },
    address: {
        type: String
    },
    privatekey: {
        type: String
    },
    addressEmpresa:{
        type:String
    },
    rating0: {
        type: String
    },
    rating1: {
        type: String
    },
    rating2: {
        type: String
    },
    rating3: {
        type: String
    },
    rating4: {
        type: String
    },
    rating5: {
        type: String
    },
    taxa:{
        type:String
    }
});

var DefinicoesMoeda = module.exports = mongoose.model('DefinicoesMoeda', DefinicoesMoedaSchema);

module.exports.createDefinicoesMoeda = function(newDefinicoesMoeda, callback) {
    newDefinicoesMoeda.save(callback);
}

module.exports.getDefinicoesMoedaByID = function(definicoesMoeda, callback) {
    var query = { definicoesMoeda_id: definicoesMoeda_id };
    DefinicoesMoeda.findOne(query, callback);
}
