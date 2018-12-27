var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var NewsletterSchema = mongoose.Schema({
    email: {
        type: String
    }
});

var Newsletter = module.exports = mongoose.model('Newsletter', NewsletterSchema);

module.exports.createNewsletter = function(newNewsletter, callback) {
    Newsletter.save(callback);
}

module.exports.getNewsletterByID = function(newsletter, callback) {
    var query = { newsletter_id: newsletter_id };
    Newsletter.findOne(query, callback);
}
