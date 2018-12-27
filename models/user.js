var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

// set up a mongoose model
var UserSchema = new Schema({
	username: {
		type: String,
		index: true,
		unique: true
	},
	password: {
		type: String
	},
	email: {
		type: String,
		unique: true
	},
	name: {
		type: String
	},
	phone: {
		type: String
	},
	country: {
		type: String
	},
	address: {
		type : String
	},
	address2: {
		type : String
	},
	postalCode: {
		type: String
	},
	accCreatedOn: {
		type: String
	},
	lastSignedIn: {
		type: String
	},
	lastAccIp: {
		type: String
	},
	accountNumber: { //id do cliente
		type: String
	},
	accountPoint:{ //registo acabado ou ainda por completar
		type: String
	},
	account_state: {
		type: String
	},
	id_gerado: {
		type: String
	},
	procurado:{ //ultimos 5 produtos que procurou
		type: Array(5)
	},
	rating:{
		type:Number
	},
	numFeedbacks:{
		type: Number
	},
	imagem:{
		type:String
	},
	address2:{
		type:String
	},
	country2:{
		type:String
	},
	postalCode2:{
		type:String
	},
	chavePrivada:{
		type: String
	},
	addressConta:{ //address da meoda
		type:String
	},
	pedirMoeda:{
		type:String
	},
	descricao:{
		type:String
	}
		
});

UserSchema.pre('save', function (next) {
	var user = this;
	if (this.isModified('password') || this.isNew) {
		bcrypt.genSalt(11, function (err, salt) {
			if (err) {
				return next(err);
			}
			bcrypt.hash(user.password, salt, function (err, hash) {
				if (err) {
					return next(err);
				}
				user.password = hash;
				next();
			});
		});
	} else {
		return next();
	}
});

UserSchema.methods.comparePassword = function (passw, cb) {
	bcrypt.compare(passw, this.password, function (err, isMatch) {
		if (err) {
			return cb(err);
		}
		cb(null, isMatch);
	});
	
};

module.exports = mongoose.model('User', UserSchema);