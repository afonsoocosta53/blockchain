var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var ProductSchema = mongoose.Schema({
    id_produto: {
        type: String
    },
    nome_produto: {
        type: String
    },
    categoria: {
        type: String
    },
    descricao: {
        type: String
    },
    preco: {
        type: Number
    },
    negociavel: {
        type: String
    },
    imagem: {
        type: Array
    },
    vendedor_id: {
        type: String
    },
    subcategoria: {
        type: String
    },
    cidade: {
        type: String
    },
    rating: {
        type: Number
    },
    productStatus: {
        type: String
    },
    id_comprador: {
        type: String
    },
    nome_comprador: {
        type: String
    },
    nome_vendedor: {
        type: String
    },
    razao_devolucao: {
        type: String
    },
    data_criacao: {
        type: String
    },
    data_venda: {
        type: String
    },
    valor_transferido: {
        type: Number
    },
    valor_atransferir: {
        type: String
    },
    motivoDevolucao: {
        type: String
    }

});

var Product = module.exports = mongoose.model('Product', ProductSchema);

module.exports.createProduct = function(newProduct, callback) {
    newProduct.save(callback);
}

module.exports.getProductByID = function(product, callback) {
    var query = { product_id: product_id };
    Product.findOne(query, callback);
}
