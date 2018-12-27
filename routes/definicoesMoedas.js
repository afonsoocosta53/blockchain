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
var DefinicoesMoeda = require('../models/definicoesMoeda'); // get the mongoose model
var port = process.env.PORT || 8080;
var jwt = require('jwt-simple');
var dateTime = require('node-datetime');
var ip = require("ip");
var nodemailer = require('nodemailer');
var randomstring = require("randomstring");
var request = require("request");
var bcrypt = require('bcryptjs');
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
router.post('/newDefinicoesMoeda', function(req, res) {
    var cont = db.collection("definicoesMoeda").count(function(err, cnt) {
        var newDefinicoesMoeda = new DefinicoesMoeda({
            quantidade: req.body.quantidade,
            address: req.body.address,
            privatekey: req.body.privatekey,
            addressEmpresa: req.body.addressEmpresa,
            rating0: req.body.rating0,
            rating1: req.body.rating1,
            rating2: req.body.rating2,
            rating3: req.body.rating3,
            rating4: req.body.rating4,
            rating5: req.body.rating5
        });
        newDefinicoesMoeda.save(function(err, definicoesMoeda) {
            if (err) {
                res.json({ sucess: false })
            }
            else {
                res.json({ sucess: true, definicoesMoeda: definicoesMoeda })
            }
        });
    });
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS DEFINICOES DA MOEDA(GET http://localhost:8080/api/memberinfo)
  *-------------------------------------------------------------------*/
router.get('/definicoesMoeda', function(req, res) {
    DefinicoesMoeda.find({}, function(err, definicoesMoeda) {
        if (err) throw err;
        if (!definicoesMoeda) {
            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
        }
        else {
            res.json({ success: true, definicoesMoeda: definicoesMoeda });
        }
    });
});



/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS DEFINICOES DA MOEDA(GET http://localhost:8080/api/memberinfo)
  *-------------------------------------------------------------------*/
router.post('/editarDefinicoesMoeda', function(req, res) {
    var id_gerado = req.headers.authorization;
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
                User.findOne({
                    username: decoded.username
                }, function(err, user) {
                    if (err) throw err;

                    if (!user) {
                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                    }
                    else {
                        var editDefinicoesMoeda = {
                            $set: {
                                quantidade: req.body.quantidade,
                                address: req.body.address,
                                privatekey: req.body.privatekey,
                                rating0: req.body.rating0,
                                rating1: req.body.rating1,
                                rating2: req.body.rating2,
                                rating3: req.body.rating3,
                                rating4: req.body.rating4,
                                rating5: req.body.rating5,
                                taxa: req.body.taxa
                            }
                        };
                        var myquery = {};
                        db.collection("definicoesMoedas").updateOne({
                            myquery,
                            editDefinicoesMoeda,
                            function(err, editDefinicoesMoeda) {
                                if (err) throw err;

                                if (!user) {
                                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                }
                                else {
                                    res.json({ success: true, editDefinicoesMoeda: editDefinicoesMoeda });
                                }
                            }
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
