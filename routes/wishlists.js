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
var Wishlist = require('../models/wishlist'); // get the mongoose model
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
ROUTE PARA CRIAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/addWishlist/', function(req, res) {
    var id_produto = req.body.id_produto
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
                    } {
                        Wishlist.findOne({
                            id_user: user.accountNumber,
                            id_produto: id_produto
                        }, function(err, wishlist) {
                            if (err) throw err;

                            if (wishlist) {
                                console.log(user);
                                return res.status(403).send({ success: false, msg: 'Produto já na wishlist.' });
                            }
                            else {
                                var cont = db.collection("wishlists").count(function(err, cnt) {
                                    Product.findOne({
                                        id_produto: id_produto
                                    }, function(err, product) {
                                        var newWishlist = new Wishlist({
                                            nome_produto: product.nome_produto,
                                            preco: product.preco,
                                            imagem: product.imagem,
                                            id_wishlist: cnt,
                                            id_user: user.accountNumber,
                                            id_produto: id_produto
                                        })
                                        newWishlist.save(function(err, wishlist) {
                                            if (err) {
                                                res.json({ sucess: false })
                                            }
                                            else {
                                                res.json({ sucess: true, msg: "Adicionado com sucesso à wishlist" })
                                            }
                                        });
                                    })

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

/*---------------------------------------------------------------------
ROUTE PARA APAGAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/wishlistDelete', function(req, res) {
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
                        db.collection("wishlists").deleteOne({
                            id_wishlist: req.body.id_produto
                        }, function(err, user) {
                            if (err) throw err;
                            if (!user) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                res.json({ success: true, msg: 'Produto da wishlist apagado com sucesso ' });
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

/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM DETERMINADO PRODUTO 
*-------------------------------------------------------------------*/
router.get('/productsWishlist/:page', function(req, res) {
    var perPage = 12
    var page = req.params.page || 1
    var id_gerado = req.headers.authorization;
    var sortfiltro = "";
    var sort = req.query.sort;
    if (sort === 'undefined') {
        var sortfiltro = "Relevancia";
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

                        if (!chave) {
                            return res.status(403).send({ success: false, msg: 'Authentication failed. Chave not found.' });
                        }
                        else {
                            Wishlist.find({ id_user: user.accountNumber }).count(function(err, cnt) {
                                    console.log(cnt)
                                    Wishlist.find({ id_user: user.accountNumber}).skip((perPage * page) - perPage).limit(perPage).exec(function(err, wishlist) {
                                        if (err) throw err;
                                        if (!wishlist) {
                                            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                        }
                                        else {
                                            res.json({
                                                success: true,
                                                current: page,
                                                wishlist: wishlist,
                                                user: user,
                                                numero_produtos: cnt,
                                                pages: Math.ceil(cnt / perPage),
                                                sortfiltro: sortfiltro
                                            });
                                        }
                                    });
                                }

                            );
                        }
                    });
                }
            });
        }
        else {
            return res.status(403).send({ success: false, msg: 'No token provided.' });
        }
    }
    else {
        if (sort === 'descendente') {
            var sort = { "preco": -1 }
            var sortfiltro = "Mais Caro"
        }
        else {

        }
        if (sort === 'ascendente') {
            var sort = { "preco": 1 }
            var sortfiltro = "Mais Barato"
        }
        else {}
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

                        if (!chave) {
                            return res.status(403).send({ success: false, msg: 'Authentication failed. Chave not found.' });
                        }
                        else {
                            Wishlist.find({ id_user: user.accountNumber }).count(function(err, cnt) {
                                    Wishlist.find({ id_user: user.accountNumber }).skip((perPage * page) - perPage).sort(sort).limit(perPage).exec(function(err, wishlist) {
                                        if (err) throw err;
                                        if (!wishlist) {
                                            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                        }
                                        else {
                                            res.json({
                                                success: true,
                                                current: page,
                                                wishlist: wishlist,
                                                user: user,
                                                numero_produtos: cnt,
                                                pages: Math.ceil(cnt / perPage),
                                                sortfiltro: sortfiltro
                                            });
                                        }
                                    });
                                }

                            );
                        }
                    });
                }
            });
        }
        else {
            return res.status(403).send({ success: false, msg: 'No token provided.' });
        }


    }
});


module.exports = router;
