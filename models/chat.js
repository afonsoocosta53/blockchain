var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

// set up a mongoose model
var chatSchema = new Schema({

    id_interessado: {
        type: String
    },
    id_vendedor: {
        type: String
    },
    id_Sender: {
        type: String
    },
    message: {
        type: String
    },
    dataChat: {
        type: String
    },
    id_Conversation: {
        type: String
    },
    imagemInteressado: {
        type: String
    },
    imagemVendedor: {
        type: String
    },
    visualizado_interessado:{
        type: String
    },
    visualizado_vendedor:{
        type: String
    }
    });

var Chat = module.exports = mongoose.model('Chat', chatSchema);

module.exports.createChat = function(newChat, callback) {
    newChat.save(callback);
}

module.exports.getChatByID = function(chat, callback) {
    var query = { chat_id: chat_id };
    Chat.findOne(query, callback);
}
