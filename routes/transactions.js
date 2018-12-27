var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database'); // get db config file
var User = require('../models/user'); // get the mongoose model
var Chave = require('../models/chave'); // get the mongoose model
var Product = require('../models/product'); // get the mongoose model
var Feedback = require('../models/feedback'); // get the mongoose model
var Transaction = require('../models/transaction'); // get the mongoose model
var port = process.env.PORT || 8080;
var jwt = require('jwt-simple');
var dateTime = require('node-datetime');
var ip = require("ip");
var nodemailer = require('nodemailer');
var randomstring = require("randomstring");
var request = require("request");
// connect to database
/* mongoose.connect(config.database); */
var db = mongoose.connection;

// pass passport for configuration
require('../config/passport')(passport);

// bundle our routes
var router = express.Router();

/*---------------------------------------------------------------------
ROUTE PARA CRIAR UM PRODUTO (POST http://localhost:8080/api/signup)
*-------------------------------------------------------------------*/
router.post('/newTransaction', function(req, res) {
    var id_gerado = req.headers.authorization;
    console.log(id_gerado);
    if (id_gerado) {
        Chave.findOne({
            id_gerado: id_gerado
        }, function(err, chave) {
            if (err) throw err;
            if (!chave) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. Chave not found.' });
            }
            else {
                var decoded = jwt.decode(chave.token, config.secret);
                console.log(chave.token);
                User.findOne({
                    username: decoded.username
                }, function(err, user) {
                    if (err) throw err;

                    if (!user) {
                        console.log(user);
                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                    }
                    else {
                        var cont = db.collection("transactions").count(function(err, cnt) {
                            var newTransaction = new Transaction({
                                id_transaction: cnt,
                                id_compra: cnt,
                                id_venda: cnt,
                                id_produto: req.body.id_produto,
                                id_comprador: req.body.id_comprador,
                                id_vendedor: req.body.id_vendedor,
                                valor: req.body.valor,
                            });

                            newTransaction.save(function(err, transaction) {
                                if (err) {
                                    res.json({ sucess: false })
                                }
                                else {
                                    res.json({ sucess: true, message: transaction })
                                }
                            });
                        });
                    }
                });
            }
        });
    }
    else {
        return res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});



module.exports = router;
