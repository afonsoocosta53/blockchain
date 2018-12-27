var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

// set up a mongoose model
var conversationSchema = new Schema({
    id_user1: {
        type: String
    },
    nome_user1: {
        type: String
    },
    id_user2: {
        type: String
    },
    nome_user2: {
        type: String
    },
    id_Conversation: {
        type: String
    },
    ultimaMensagem: {
        type: String
    },
    imagemInteressado: {
        type: String
    },
    imagemVendedor: {
        type: String
    }

});

var Conversation = module.exports = mongoose.model('Conversation', conversationSchema);

module.exports.createConversation = function(newConversation, callback) {
    newConversation.save(callback);
}

module.exports.getConversationByID = function(chat, callback) {
    var query = { conversation_id: conversation_id };
    Conversation.findOne(query, callback);
}
