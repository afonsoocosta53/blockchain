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
router.post('/newFeedback', function(req, res) {

    var id_gerado = req.headers.authorization;
    var somarating = 0;
    var numFeedbacks = 0;
    var totalRating = 0;
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
                        var cont = db.collection("feedbacks").count(function(err, cnt) {
                            var date = new Date()
                            var dt = dateTime.create();
                            var formatted = dt.format('Y-m-d');
                            var newFeedback = new Feedback({
                                id_feeback: cnt,
                                id_comprador: user.accountNumber,
                                id_vendedor: req.body.id_vendedor,
                                rating: req.body.rating,
                                comentario: req.body.comentario,
                                dateFeedback: formatted,
                                username: user.username
                            });
                            newFeedback.save(function(err, feedback) {
                                if (err) {
                                    res.json({ sucess: false })
                                }
                                else {
                                    Feedback.find({
                                        id_vendedor: req.body.id_vendedor
                                    }, function(err, feedback2) {
                                        if (err) throw err;
                                        if (!feedback2) {
                                            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                        }
                                        else {
                                            feedback2.forEach(function(itemfeedback) {
                                                somarating += itemfeedback.rating;
                                                numFeedbacks = numFeedbacks + 1;
                                            });
                                            totalRating = Math.round(somarating / numFeedbacks);
                                            User.findOne({
                                                accountNumber: req.body.id_vendedor
                                            }, function(err, feedbackUser) {
                                                if (err) throw err;
                                                if (!feedbackUser) {
                                                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                                }
                                                else {
                                                    var newUser = {
                                                        $set: {
                                                            rating: totalRating,
                                                            numFeedbacks: numFeedbacks,
                                                        }
                                                    };
                                                    var myquery = { accountNumber: feedbackUser.accountNumber };
                                                    db.collection("users").updateOne(myquery, newUser, function(err, dbb) {
                                                        if (err) {
                                                            return res.json({ success: false, msg: 'User sem Feedbacks.' });
                                                        }
                                                        else {
                                                            Product.find({ vendedor_id: req.body.id_vendedor },
                                                                function(err, productsUser) {
                                                                    if (err) throw err;
                                                                    if (!productsUser) {
                                                                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                                                    }
                                                                    else {
                                                                        var newUser = {
                                                                            $set: {
                                                                                rating: totalRating,
                                                                            }
                                                                        };
                                                                        var myquery = { vendedor_id: req.body.id_vendedor };
                                                                        db.collection("products").updateOne(myquery, newUser, function(err, dbb) {
                                                                            if (err) {
                                                                                return res.json({ success: false, msg: 'User sem Feedbacks.' });
                                                                            }
                                                                            else {
                                                                                var editarEstado = {
                                                                                    $set: {
                                                                                        productStatus: 'concluido',
                                                                                    }
                                                                                };
                                                                                var myquery = { vendedor_id: req.body.id_vendedor, id_produto: req.body.id_produto };
                                                                                db.collection("products").updateOne(myquery, editarEstado, function(err, dbb) {
                                                                                    if (err) {
                                                                                        return res.json({ success: false, msg: 'User sem Feedbacks.' });
                                                                                    }
                                                                                    else {
                                                                                        res.json({
                                                                                            success: true,
                                                                                            feedback: feedback,
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }

                                                                });
                                                        }
                                                    });
                                                }
                                            });
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
    else {
        return res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});


/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM DETERMINADO PRODUTO 
*-------------------------------------------------------------------*/
router.get('/feedbacksUser/:page&:id_vendedor', function(req, res) {
    var perPage = 12
    var vendedor_id = req.params.id_vendedor
    var page = req.params.page || 1
    var id_gerado = req.headers.authorization;
    var sortfiltro = "";
    User.findOne({ accountNumber: vendedor_id }).exec(function(err, vendedor) {
        if (err) throw err;
        if (!vendedor) {
            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
        }
        else {
            if (!id_gerado) {
                Feedback.find({ id_vendedor: vendedor_id }).count(function(err, cnt) {
                        Feedback.find({ id_vendedor: vendedor_id }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, feedback) {
                            if (err) throw err;
                            if (!feedback) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                res.json({
                                    success: true,
                                    current: page,
                                    feedback: feedback,
                                    numerofeedbacks: cnt,
                                    pages: Math.ceil(cnt / perPage),
                                    vendedor: vendedor
                                });
                            }
                        });
                    }

                );
            }
            else {
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
                                Feedback.find({ id_vendedor: vendedor_id }).count(function(err, cnt) {
                                        Feedback.find({ id_vendedor: vendedor_id }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, feedback) {
                                            if (err) throw err;
                                            if (!feedback) {
                                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                            }
                                            else {
                                                res.json({
                                                    success: true,
                                                    current: page,
                                                    feedback: feedback,
                                                    numerofeedbacks: cnt,
                                                    user: user,
                                                    pages: Math.ceil(cnt / perPage),
                                                    vendedor: vendedor
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
        }
    });
});



module.exports = router;
