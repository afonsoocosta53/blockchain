var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var FaqSchema = mongoose.Schema({
	faq_id:{
		type: String
	},
    categoria: {
        type: String
    },
    faq_pergunta:{
    	type: String
    },
    faq_resposta:{
        type:String
    }
});

var Faq = module.exports = mongoose.model('Faq', FaqSchema);

module.exports.createFaq = function (newFaq, callback) {
    newFaq.save(callback);
}

module.exports.getFaqByID = function (faq, callback) {
    var query = { faq_id: faq_id };
    Faq.findOne(query, callback);
}



