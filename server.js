var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database'); // get db config file
var User = require('./models/user'); // get the mongoose model
var Chave = require('./models/chave');
var Contacto = require('./models/contacto');
var Devolucao = require('./models/devolucao');
var DefinicoesMoeda = require('./models/definicoesMoeda');
var Product = require('./models/product');
var Chat = require('./models/chat');
var Newsletter = require('./models/newsletter');
var Feedback = require('./models/feedback');
var RatingPercentage = require('./models/ratingPercentage'); // get the mongoose model
var Transaction = require('./models/transaction');
var Wishlist = require('./models/wishlist');
var port = process.env.PORT || 8080;
var jwt = require('jwt-simple');
mongoose.connect(config.database);

//routes var
var users = require('./routes/users');
var newsletter = require('./routes/newsletters');
var products = require('./routes/products');
var devolucoes = require('./routes/devolucoes');
var contactos = require('./routes/contactos');
var chats = require('./routes/chats');
var feedbacks = require('./routes/feedbacks');
var definicoesMoedas = require('./routes/definicoesMoedas');
var transactions = require('./routes/transactions');
var ratingPercentages = require('./routes/ratingPercentages');
var wishlists = require('./routes/wishlists');

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

// demo Route (GET http://localhost:8080)
// ...

// connect the api routes under /api/*
app.use('/user', users);
app.use('/product', products);
app.use('/chat', chats);
app.use('/devolucao', devolucoes);
app.use('/definicoesMoeda', definicoesMoedas);
app.use('/contacto', contactos);
app.use('/newsletter', newsletter);
app.use('/feedback', feedbacks);
app.use('/transaction', transactions);
app.use('/wishlist', wishlists);
app.use('/ratingPercentage', ratingPercentages);
