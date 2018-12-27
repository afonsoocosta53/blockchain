var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var ContactoSchema = mongoose.Schema({
    id_contacto: {
        type: String
    },
    email: {
        type: String
    },
    nome: {
        type: String
    },
    motivo: {
        type: String
    },
    mensagem: {
        type: String
    },
    anexo: {
        type: String
    }
});

var Contacto = module.exports = mongoose.model('Contacto', ContactoSchema);

module.exports.createContacto = function(newContacto, callback) {
    newContacto.save(callback);
}

module.exports.getContactoByID = function(contacto, callback) {
    var query = { contacto_id: contacto_id };
    Contacto.findOne(query, callback);
}
