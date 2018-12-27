var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var DevolucaoSchema = mongoose.Schema({
    id_devolucao: {
        type: String
    },
    id_vendedor:{
        type:String
    },
    id_user: {
        type: String
    },
    motivo: {
        type: String
    },
    descricao: {
        type: String
    },
    id_produto: {
        type: String
    }
});

var Devolucao = module.exports = mongoose.model('Devolucao', DevolucaoSchema);

module.exports.createDevolucao = function(newDevolucao, callback) {
    newDevolucao.save(callback);
}

module.exports.geteDevolucaoByID = function(problema, callback) {
    var query = { devolucao_id: devolucao_id };
    Devolucao.findOne(query, callback);
}
