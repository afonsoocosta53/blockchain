var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var TransactionSchema = mongoose.Schema({
    id_transaction:{
        type: String
    },
    id_comprador:{
    	type: String
    },
    id_vendedor:{
    	type: String
    },
    valor:{
    	type: String
    },
    id_compra:{
    	type: String
    },
    id_venda:{
        type: String
    },
    id_produto:{
    	type:String
    }
});

var Transaction = module.exports = mongoose.model('Trasancao', TransactionSchema);

module.exports.createTransaction = function (newTransaction, callback) {
    newTransaction.save(callback);
}

module.exports.getTransactionoByID = function (transaction, callback) {
    var query = { transaction_id: transaction_id };
    Transaction.findOne(query, callback);
}


