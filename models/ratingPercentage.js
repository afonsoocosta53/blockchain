var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var RatingPercentageSchema = mongoose.Schema({
	id_ratingPercentage:{
		type: String
	},
    rating: {
        type: String
    },
    percentage:{
    	type: String
    }
});

var RatingPercentage = module.exports = mongoose.model('RatingPercentage', RatingPercentageSchema);

module.exports.createRatingPercentage = function (newRatingPercentage, callback) {
    newRatingPercentage.save(callback);
}

module.exports.getRatingPercentageByID = function (ratingPercentage, callback) {
    var query = { ratingPercentage_id: ratingPercentage_id };
    RatingPercentage.findOne(query, callback);
}



