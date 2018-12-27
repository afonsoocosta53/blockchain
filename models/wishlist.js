var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Product = require('../models/product'); // get the mongoose model
var Schema = mongoose.Schema;


// User Schema
var WishlistSchema = mongoose.Schema({
    id_wishlist: {
        type: String
    },
    id_user: {
        type: String
    },
    nome_produto: {
        type: String
    },
    preco: {
        type: String
    },
    imagem:{
        type: String
    },
    id_produto:{
        type:String
    }
});

var Wishlist = module.exports = mongoose.model('Wishlist', WishlistSchema);

module.exports.createWishlist = function(newWishlist, callback) {
    newWishlist.save(callback);
}

module.exports.getWishlistByID = function(wishlist, callback) {
    var query = { wishlist_id: wishlist_id };
    Wishlist.findOne(query, callback);
}
