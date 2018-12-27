var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var FeedbackSchema = mongoose.Schema({
    id_feeback: {
        type: String
    },
    id_comprador: {
        type: String
    },
    id_vendedor: {
        type: String
    },
    rating: {
        type: Number
    },
    comentario: {
        type: String
    },
    statusFeedback: {
        type: String
    },
    username: {
        type: String
    },
    dateFeedback: {
        type: String
    }
});

var Feedback = module.exports = mongoose.model('Feedback', FeedbackSchema);

module.exports.createFeedback = function(newFeedback, callback) {
    newFeedback.save(callback);
}

module.exports.getFeedbackByID = function(feedback, callback) {
    var query = { feedback_id: feedback_id };
    Feedback.findOne(query, callback);
}
