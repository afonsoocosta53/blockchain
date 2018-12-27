var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database'); // get db config file
var User = require('../models/user'); // get the mongoose model
var Chave = require('../models/chave'); // get the mongoose model
var Devolucao = require('../models/devolucao'); // get the mongoose model
var Product = require('../models/product'); // get the mongoose model
var Contacto = require('../models/contacto'); // get the mongoose model
var Feedback = require('../models/feedback'); // get the mongoose model
var RatingPercentage = require('../models/ratingPercentage'); // get the mongoose model
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
router.post('/newDevolucao', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_produto = req.body.id_produto;
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
                        Product.findOne({
                            id_produto: id_produto
                        }, function(err, produto) {
                            if (err) throw err;

                            if (!produto) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                var cont = db.collection("problemas").count(function(err, cnt) {
                                    var newDevolucao = new Devolucao({
                                        id_devolucao: cnt + 1,
                                        id_produto: id_produto,
                                        id_user: user.accountNumber,
                                        motivo: req.body.motivo,
                                        descricao: req.body.descricao,
                                        id_vendedor: produto.vendedor_id
                                    });
                                    newDevolucao.save(function(err, problema) {
                                        if (err) {
                                            res.json({ sucess: false })
                                        }
                                        else {
                                            var editProduto = {
                                                $set: {
                                                    productStatus: 'devolucao_iniciada',
                                                    motivoDevolucao: req.body.motivo
                                                }
                                            };
                                            var myquery = { id_produto: id_produto };
                                            db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                                                if (err) {
                                                    return res.json({ success: false, msg: 'Business already exists.' });
                                                }
                                                else {
                                                    res.json({ sucess: true, problema: problema, produto: produto})
                                                }
                                            });
                                        }
                                    });

                                });
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
