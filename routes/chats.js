var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database'); // get db config file
var User = require('../models/user'); // get the mongoose model
var Conversation = require('../models/conversation'); // get the mongoose model
var Chat = require('../models/chat'); // get the mongoose model
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
router.get('/newChat', function(req, res) {
    var message = req.query.message;
    var id_gerado = req.query.id_gerado;
    var id_conversation = req.query.id_conversation;
    Conversation.findOne({ id_Conversation: id_conversation }, function(err, conversa) {
        console.log(conversa)
        if (err) throw err;
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
                            var editConversation = {
                                $set: {
                                    ultimaMensagem: message
                                }
                            };
                            var myquery = { id_Conversation: id_conversation };
                            db.collection("conversations").updateOne(myquery, editConversation, function(err, conversation) {
                                if (err) {
                                    res.json({ sucess: false })
                                }
                                else {

                                    if (conversa.id_vendedor == user.accountNumber) {
                                        var editConversationVendedor = {
                                            $set: {
                                                id_vendedor: 'Sim'
                                            }
                                        };
                                        var myquery = { id_Conversation: id_conversation };
                                        db.collection("conversations").updateOne(myquery, editConversationVendedor, function(err, conversation2) {
                                            if (err) {
                                                res.json({ sucess: false })
                                            }
                                            else {
                                                var date = new Date()
                                                var dt = dateTime.create();
                                                var formatted = dt.format('Y-m-d H:M:S');
                                                var newChat = new Chat({
                                                    id_interessado: conversa.id_user1,
                                                    id_vendedor: conversa.id_user2,
                                                    id_Sender: user.accountNumber,
                                                    dataChat: formatted,
                                                    message: message,
                                                    id_Conversation: id_conversation,
                                                    visualizado_interessado: 'Nao',
                                                    visualizado_vendedor: 'Sim'

                                                });
                                                newChat.save(function(err, chat) {
                                                    if (err) {
                                                        res.json({ sucess: false })
                                                    }
                                                    else {
                                                        res.json({
                                                            success: true,
                                                            chat: chat,
                                                            conversation: conversation
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        if (conversa.id_interessado == user.accountNumber) {
                                            var editConversationComprador = {
                                                $set: {
                                                    id_interessado: 'Sim'
                                                }
                                            };
                                            var myquery = { id_Conversation: id_conversation };
                                            db.collection("conversations").updateOne(myquery, editConversationComprador, function(err, conversation3) {
                                                if (err) {
                                                    res.json({ sucess: false })
                                                }
                                                else {

                                                    var date = new Date()
                                                    var dt = dateTime.create();
                                                    var formatted = dt.format('Y-m-d H:M:S');
                                                    var newChat = new Chat({
                                                        id_interessado: conversa.id_user1,
                                                        id_vendedor: conversa.id_user2,
                                                        id_Sender: user.accountNumber,
                                                        dataChat: formatted,
                                                        message: message,
                                                        id_Conversation: id_conversation,
                                                        visualizado_interessado: 'Sim',
                                                        visualizado_vendedor: 'Nao'
                                                    });
                                                    newChat.save(function(err, chat) {
                                                        if (err) {
                                                            res.json({ sucess: false })
                                                        }
                                                        else {
                                                            res.json({
                                                                success: true,
                                                                chat: chat,
                                                                conversation: conversation
                                                            });
                                                        }
                                                    });

                                                }
                                            });
                                        }
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
});

/*---------------------------------------------------------------------
ROUTE PARA CRIAR UM PRODUTO (POST http://localhost:8080/api/signup)
*-------------------------------------------------------------------*/
router.post('/newConversation', function(req, res) {
    var id_gerado = req.headers.authorization;
    console.log(id_gerado)
    var id_interessado = req.body.id_interessado;
    var id_vendedor = req.body.id_vendedor;
    console.log(id_vendedor)
    console.log(id_interessado)
    Conversation.findOne({ $or: [{ id_user1: id_interessado, id_user2: id_vendedor }, { id_user2: id_interessado, id_user1: id_vendedor }] }, function(err, conversa) {
        if (err) throw err;
        if (!conversa) {
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
                                User.findOne({
                                    accountNumber: id_vendedor
                                }, function(err, vendedor) {
                                    if (err) throw err;

                                    if (!vendedor) {
                                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                    }
                                    else {
                                        var cont = db.collection("conversations").count(function(err, cnt) {
                                            console.log(cnt)
                                            var newConversation = new Conversation({
                                                id_user1: id_interessado,
                                                id_user2: id_vendedor,
                                                nome_user1: user.username,
                                                nome_user2: vendedor.username,
                                                id_Conversation: cnt + 1,
                                                ultimaMensagem: '',
                                                imagemInteressado: user.imagem,
                                                imagemVendedor: vendedor.imagem
                                            });
                                            newConversation.save(function(err, conversation) {
                                                if (err) {
                                                    res.json({ sucess: false })
                                                }
                                                else {
                                                    res.json({
                                                        success: true,
                                                        conversation: conversation,
                                                        user: user,
                                                        message: "Conversa iniciada"
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
        }
        else {
            res.json({
                success: false,
                conversa: conversa,
                message: "Conversa ja iniciada"
            });
        }
    });
});
/*---------------------------------------------------------------------
ROUTE PARA ACEDER PRODUTOS VENDIDOS DO UTILIZADOR
*-------------------------------------------------------------------*/
router.get('/user/', function(req, res) {
    var perPage = 12
    var page = req.params.page || 1
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
                        Conversation.find({
                            $or: [{ id_user1: user.accountNumber }, { id_user2: user.accountNumber }]

                        }).exec(function(err, chats) {
                            if (err) throw err;
                            if (!chats) {
                                return res.status(403).send({ success: false, msg: 'Product not found.' });
                            }
                            else {
                                Product.find({
                                    $or: [{
                                        id_comprador: user.accountNumber,
                                        productStatus: "vendido"
                                    }, {
                                        id_comprador: user.accountNumber,
                                        productStatus: "enviado"
                                    }]
                                }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, produtosComprados) {
                                    if (err) throw err;
                                    if (!produtosComprados) {
                                        return res.status(403).send({ success: false, msg: 'Product not found.' });
                                    }
                                    else {
                                        Product.find({
                                            $or: [{
                                                vendedor_id: user.accountNumber,
                                                productStatus: "vendido"
                                            }, {
                                                vendedor_id: user.accountNumber,
                                                productStatus: "enviado"
                                            }]
                                        }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, produtosVendidos) {
                                            if (err) throw err;
                                            if (!produtosVendidos) {
                                                return res.status(403).send({ success: false, msg: 'Product not found.' });
                                            }
                                            else {
                                                Product.find({
                                                    vendedor_id: user.accountNumber,
                                                    productStatus: "venda"
                                                }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, produtosVenda) {
                                                    if (err) throw err;
                                                    if (!produtosVenda) {
                                                        return res.status(403).send({ success: false, msg: 'Product not found.' });
                                                    }
                                                    else {

                                                        Conversation.findOne({
                                                            $or: [{ id_user1: user.accountNumber }, { id_user2: user.accountNumber }]

                                                        }).exec(function(err, first_conversation) {

                                                            if (err) throw err;
                                                            if (!first_conversation) {
                                                                return res.status(403).send({ success: false, msg: 'Conversa not found.' });
                                                            }
                                                            else {
                                                                Chat.find({
                                                                    id_Conversation: first_conversation.id_Conversation

                                                                }).exec(function(err, primeiraConversa) {

                                                                    if (err) throw err;
                                                                    if (!primeiraConversa) {
                                                                        return res.status(403).send({ success: false, msg: 'Conversa not found.' });
                                                                    }
                                                                    else {
                                                                        res.json({
                                                                            success: true,
                                                                            produtosVenda: produtosVenda,
                                                                            produtosComprados: produtosComprados,
                                                                            produtosVendidos: produtosVendidos,
                                                                            chats: chats,
                                                                            user: user,
                                                                            primeiraConversa: primeiraConversa,
                                                                            first_conversation: first_conversation,
                                                                            id_primeira_conversa: primeiraConversa.id_Conversation
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
            }
        });
    }
    else {
        return res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER PRODUTOS VENDIDOS DO UTILIZADOR
*-------------------------------------------------------------------*/
router.get('/conversa/:id_conversa', function(req, res) {
    var id_conversa = req.params.id_conversa;
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
                        Conversation.find({
                            $or: [{ id_user1: user.accountNumber }, { id_user2: user.accountNumber }]
                        }).exec(function(err, conversa) {
                            if (err) throw err;
                            if (!conversa) {
                                return res.status(403).send({ success: false, msg: 'Conversa not found.' });
                            }
                            else {
                                Chat.find({
                                    id_Conversation: id_conversa,
                                    $or: [
                                        { id_vendedor: user.accountNumber },
                                        { id_interessado: user.accountNumber }
                                    ]
                                }).exec(function(err, chats) {
                                    if (err) throw err;
                                    if (!chats) {
                                        return res.status(403).send({ success: false, msg: 'Product not found.' });
                                    }
                                    else {
                                        Conversation.findOne({
                                            id_Conversation: id_conversa
                                        }).exec(function(err, first_conversation) {
                                            if (err) throw err;
                                            if (!first_conversation) {
                                                return res.status(403).send({ success: false, msg: 'Product not found.' });
                                            }
                                            else {
                                                res.json({ success: true, conversa: conversa, user: user, chats: chats, first_conversation: first_conversation });
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
    else {
        return res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});


module.exports = router;
