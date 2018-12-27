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
var faker = require('faker');
var random = require("random-js")(); // uses the nativeMath engine
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
var fs = require('fs');
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
router.post('/newProduct', function(req, res) {
    var imagem = req.body.imagem;
    if (imagem === 'undefined') {
        imagens = '';
    }
    else {
        var imagens = imagem.split(",");
    }
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
                        var cont = db.collection("products").count(function(err, cnt) {
                            var date = new Date()
                            var dt = dateTime.create();
                            var formatted = dt.format('Y-m-d H:M:S');
                            var newProduct = new Product({
                                id_produto: cnt + 1,
                                nome_produto: req.body.nome_produto,
                                categoria: req.body.categoria,
                                descricao: req.body.descricao,
                                preco: req.body.preco,
                                negociavel: req.body.negociavel,
                                imagem: imagens,
                                vendedor_id: user.accountNumber,
                                subcategoria: req.body.subcategoria,
                                cidade: req.body.cidade,
                                rating: user.rating,
                                productStatus: "venda",
                                id_comprador: "",
                                nome_vendedor: user.username,
                                nome_comprador: "",
                                data_criacao: formatted,
                                data_venda: '',
                                valor_transferido: '0',
                                valor_atransferir: '0',
                                motivoDevolucao: ''
                            })
                            newProduct.save(function(err, product) {
                                if (err) {
                                    console.log(err)
                                    res.json({ sucess: false })
                                }
                                else {
                                    console.log(user.rating)

                                    res.json({ success: true, productR: product });
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
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DO USER LOGADO(GET http://localhost:8080/api/memberinfo)
  *-------------------------------------------------------------------*/
router.post('/vendedorAddress', function(req, res) {
    var id_vendedor = req.body.id_vendedor
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
                        User.findOne({
                            accountNumber: id_vendedor
                        }, function(err, vendedor) {
                            if (err) throw err;
                            if (!user) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                console.log(vendedor.address)
                                res.json({ success: true, address: vendedor.addressConta, rating: vendedor.rating });
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
ROUTE PARA EDITAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/editProduct', function(req, res) {
    var imagem = req.body.imagem;
    console.log(imagem)
    if (imagem === 'undefined') {
        imagens = '';
    }
    else {
        var imagens = imagem.split(",");
    }
    console.log(imagens)
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
                        var editProduto = {
                            $set: {
                                nome_produto: req.body.nome_produto,
                                categoria: req.body.categoria,
                                descricao: req.body.descricao,
                                preco: req.body.preco,
                                negociavel: req.body.negociavel,
                                imagem: imagens,
                                subcategoria: req.body.subcategoria,
                                cidade: req.body.cidade
                            }
                        };
                        var myquery = { id_produto: req.body.id_produto };
                        db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                            if (err) {
                                return res.json({ success: false, msg: 'Business already exists.' });
                            }
                            else {
                                res.json({ success: true, msg: 'Produto editado com sucesso' });
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
ROUTE PARA EDITAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/editProductPendente', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_produto = req.body.id_produto;
    var id_vendedor = req.body.id_vendedor;
    var valor_atransferir = req.body.valor_atransferir;
    var valor_transferido = req.body.valor_transferido;
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
                        User.findOne({
                            accountNumber: id_vendedor
                        }, function(err, vendedor) {
                            if (err) throw err;
                            if (!user) {
                                console.log(vendedor);
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                var date = new Date()
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                var editProduto = {
                                    $set: {
                                        productStatus: "pago_empresa",
                                        data_venda: formatted,
                                        nome_comprador: user.username,
                                        id_comprador: user.accountNumber,
                                        valor_atransferir: valor_atransferir,
                                        valor_transferido: valor_transferido

                                    }
                                };
                                var myquery = { id_produto: id_produto, vendedor_id: id_vendedor };
                                db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                                    if (err) {
                                        return res.json({ success: false, msg: 'Business already exists.' });
                                    }
                                    else {
                                        res.json({ success: true, msg: 'Produto editado com sucesso' + dbb });
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
ROUTE PARA EDITAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/editProductPago', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_produto = req.body.id_produto;
    var id_vendedor = req.body.id_vendedor
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
                        User.findOne({
                            accountNumber: id_vendedor
                        }, function(err, vendedor) {
                            if (err) throw err;
                            if (!user) {
                                console.log(vendedor);
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                var date = new Date()
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                var editProduto = {
                                    $set: {
                                        productStatus: "pago",
                                                                               data_venda: formatted
                                    }
                                };
                                var myquery = { id_produto: id_produto, vendedor_id: id_vendedor };
                                db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                                    if (err) {
                                        return res.json({ success: false, msg: 'Business already exists.' });
                                    }
                                    else {
                                        res.json({ success: true, msg: 'Produto editado com sucesso' + dbb });
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
ROUTE PARA EDITAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/editProductDevolucao', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_produto = req.body.id_produto;
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
                        Product.findOne({
                            id_produto: id_produto
                        }, function(err, produto) {
                            if (err) throw err;
                            if (!produto) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                var date = new Date()
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                var editProduto = {
                                    $set: {
                                        productStatus: "devolucao_concluida",
                                        data_venda: formatted
                                    }
                                };
                                var myquery = { id_produto: id_produto, vendedor_id: user.accountNumber };
                                db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                                    if (err) {
                                        return res.json({ success: false, msg: 'Business already exists.' });
                                    }
                                    else {

                                        User.findOne({
                                            accountNumber: produto.id_comprador
                                        }, function(err, comprador) {
                                            if (err) throw err;
                                            if (!produto) {
                                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                            }
                                            else {
                                                res.json({ success: true, vendedor: user, produto: produto, comprador: comprador });
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
ROUTE PARA APAGAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/productDelete', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_produto = req.body.id_produto;
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
                        Product.findOne({
                            id_produto: id_produto
                        }, function(err, produto) {
                            if (err) throw err;
                            if (!produto) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                var date = new Date()
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                var editProduto = {
                                    $set: {
                                        productStatus: "removido",
                                        
                                    }
                                };
                                var myquery = { id_produto: id_produto, vendedor_id: user.accountNumber };
                                db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                                    if (err) {
                                        return res.json({ success: false, msg: 'Business already exists.' });
                                    }
                                    else {

                                        User.findOne({
                                            accountNumber: produto.id_comprador
                                        }, function(err, comprador) {
                                            if (err) throw err;
                                            if (!produto) {
                                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                            }
                                            else {
                                                res.json({ success: true, vendedor: user, produto: produto, comprador: comprador });
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
ROUTE PARA APAGAR UM PRODUTO 
*-------------------------------------------------------------------*/
router.post('/productVendaAgain', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_produto = req.body.id_produto;
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
                        Product.findOne({
                            id_produto: id_produto
                        }, function(err, produto) {
                            if (err) throw err;
                            if (!produto) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                var date = new Date()
                                var dt = dateTime.create();
                                var formatted = dt.format('Y-m-d H:M:S');
                                var editProduto = {
                                    $set: {
                                        productStatus: "venda",
                                        
                                    }
                                };
                                var myquery = { id_produto: id_produto, vendedor_id: user.accountNumber };
                                db.collection("products").updateOne(myquery, editProduto, function(err, dbb) {
                                    if (err) {
                                        return res.json({ success: false, msg: 'Business already exists.' });
                                    }
                                    else {

                                        User.findOne({
                                            accountNumber: produto.id_comprador
                                        }, function(err, comprador) {
                                            if (err) throw err;
                                            if (!produto) {
                                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                            }
                                            else {
                                                res.json({ success: true, vendedor: user, produto: produto, comprador: comprador });
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
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM DETERMINADO PRODUTO 
*-------------------------------------------------------------------*/
router.get('/productInfo/:id_produto', function(req, res) {
    var id_produto = req.params.id_produto;
    var id_gerado = req.headers.authorization;
    if (id_gerado == undefined) {
        db.collection("products").findOne({
            id_produto: id_produto
        }, function(err, product) {
            if (err) throw err;
            if (!product) {
                return res.status(403).send({ success: false, msg: 'Product not found.' });
            }
            else {
                db.collection("users").findOne({ accountNumber: product.vendedor_id }, function(err, vendedor) {
                    if (err) throw err;
                    if (!vendedor) {
                        return res.status(403).send({ success: false, msg: 'Seller not found.' });
                    }
                    else {
                        Feedback.find({ id_vendedor: vendedor.accountNumber }, function(err, feedback) {
                            if (err) throw err;
                            if (!feedback) {
                                return res.status(403).send({ success: false, msg: 'Seller not found.' });
                            }
                            else {
                                db.collection("products").aggregate([{ $match: { categoria: product.categoria, subcategoria: product.subcategoria } }, { $sample: { size: 4 } }], function(err, produtos) {
                                    if (err) throw err;
                                    if (!produtos) {
                                        return res.status(403).send({ success: false, msg: 'Seller not found.' });
                                    }
                                    else {
                                        res.json({ success: true, productinfo: product, vendedor: vendedor, feedback: feedback, produtos4: produtos });
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
                        db.collection("products").findOne({
                            id_produto: id_produto
                        }, function(err, product) {
                            if (err) throw err;
                            if (!product) {
                                return res.status(403).send({ success: false, msg: 'Product not found.', user: user });
                            }
                            else {
                                db.collection("users").findOne({ accountNumber: product.vendedor_id }, function(err, vendedor) {
                                    if (err) throw err;
                                    if (!vendedor) {
                                        return res.status(403).send({ success: false, msg: 'Seller not found.', user: user });
                                    }
                                    else {
                                        Feedback.find({ id_vendedor: vendedor.accountNumber }, function(err, feedback) {
                                            if (err) throw err;
                                            if (!feedback) {
                                                return res.status(403).send({ success: false, msg: 'Seller not found.', user: user });
                                            }
                                            else {
                                                Feedback.find({ id_vendedor: vendedor.accountNumber }, function(err, feedback) {
                                                    if (err) throw err;
                                                    if (!feedback) {
                                                        return res.status(403).send({ success: false, msg: 'Seller not found.', user: user });
                                                    }
                                                    else {
                                                        Feedback.find({ id_vendedor: vendedor.accountNumber }, function(err, feedback) {
                                                            if (err) throw err;
                                                            if (!feedback) {
                                                                return res.status(403).send({ success: false, msg: 'Seller not found.', user: user });
                                                            }
                                                            else {
                                                                db.collection("products").aggregate([{ $match: { categoria: product.categoria, subcategoria: product.subcategoria } }, { $sample: { size: 4 } }], function(err, produtos) {
                                                                    if (err) throw err;
                                                                    if (!produtos) {
                                                                        return res.status(403).send({ success: false, msg: 'Seller not found.', user: user });
                                                                    }
                                                                    else {
                                                                        res.json({ success: true, productinfo: product, user: user, vendedor: vendedor, feedback: feedback, produtos4: produtos });
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
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER PRODUTOS COMPRADO
*-------------------------------------------------------------------*/
router.get('/produtosComprados/:page', function(req, res) {
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
                        Product.find({
                            $or: [{
                                id_comprador: user.accountNumber,
                                productStatus: "enviado"
                            }, {
                                id_comprador: user.accountNumber,
                                productStatus: "pago"
                            }, {
                                id_comprador: user.accountNumber,
                                productStatus: "pago_empresa"
                            }, {
                                id_comprador: user.accountNumber,
                                productStatus: "devolucao_iniciada"
                            }]
                        }).count(function(err, cnt) {
                            Product.find({
                                $or: [{
                                    id_comprador: user.accountNumber,
                                    productStatus: "enviado"
                                }, {
                                    id_comprador: user.accountNumber,
                                    productStatus: "pago"
                                }, {
                                    id_comprador: user.accountNumber,
                                    productStatus: "pago_empresa"
                                }, {
                                    id_comprador: user.accountNumber,
                                    productStatus: "devolucao_iniciada"
                                }]
                            }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, product) {
                                if (err) throw err;
                                if (!product) {
                                    console.log(product)
                                    return res.status(403).send({ success: false, msg: 'Product not found.' });
                                }
                                else {
                                    res.json({
                                        success: true,
                                        productinfo: product,
                                        user: user,
                                        numero_produtos: cnt,
                                        pages: Math.ceil(cnt / perPage),
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
ROUTE PARA ACEDER PRODUTOS COMPRADO
*-------------------------------------------------------------------*/
router.get('/produtosCompradosConcluido/:page', function(req, res) {
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
                        Product.find({
                            $or: [{
                                id_comprador: user.accountNumber,
                                productStatus: "concluido"
                            }, {
                                id_comprador: user.accountNumber,
                                productStatus: "devolucao_concluida"
                            }]
                        }).count(function(err, cnt) {
                            Product.find({
                                $or: [{
                                    id_comprador: user.accountNumber,
                                    productStatus: "concluido"
                                }, {
                                    id_comprador: user.accountNumber,
                                    productStatus: "devolucao_concluida"
                                }]
                            }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, product) {
                                if (err) throw err;
                                if (!product) {
                                    console.log(product)
                                    return res.status(403).send({ success: false, msg: 'Product not found.' });
                                }
                                else {
                                    res.json({
                                        success: true,
                                        productinfo: product,
                                        user: user,
                                        numero_produtos: cnt,
                                        pages: Math.ceil(cnt / perPage),
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
ROUTE PARA ACEDER PRODUTOS VENDIDOS DO UTILIZADOR
*-------------------------------------------------------------------*/
router.get('/produtosVendidos/:page', function(req, res) {
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
                        Product.find({
                            $or: [{
                                vendedor_id: user.accountNumber,
                                productStatus: "enviado"
                            },  {
                                vendedor_id: user.accountNumber,
                                productStatus: "pago"
                            }, {
                                vendedor_id: user.accountNumber,
                                productStatus: "pago_empresa"
                            }, {
                                vendedor_id: user.accountNumber,
                                productStatus: "devolucao_iniciada"
                            }]
                        }).count(function(err, cnt) {
                            Product.find({
                                $or: [{
                                    vendedor_id: user.accountNumber,
                                    productStatus: "venda"
                                },  {
                                    vendedor_id: user.accountNumber,
                                    productStatus: "pago"
                                }, {
                                    vendedor_id: user.accountNumber,
                                    productStatus: "pago_empresa"
                                }, {
                                    vendedor_id: user.accountNumber,
                                    productStatus: "devolucao_iniciada"
                                }]
                            }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, product) {
                                if (err) throw err;
                                if (!product) {
                                    return res.status(403).send({ success: false, msg: 'Product not found.' });
                                }
                                else {
                                    res.json({
                                        success: true,
                                        productinfo: product,
                                        user: user,
                                        numero_produtos: cnt,
                                        pages: Math.ceil(cnt / perPage),
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
ROUTE PARA ACEDER PRODUTOS VENDIDOS DO UTILIZADOR
*-------------------------------------------------------------------*/
router.get('/produtosVendaConcluida/:page', function(req, res) {
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
                        Product.find({
                            $or: [{
                                vendedor_id: user.accountNumber,
                                productStatus: "concluido"
                            }, {
                                vendedor_id: user.accountNumber,
                                productStatus: "devolucao_concluida"
                            }, {
                                vendedor_id: user.accountNumber,
                                productStatus: "removido"
                            }]
                        }).count(function(err, cnt) {
                            console.log(cnt)
                            Product.find({
                                $or: [{
                                    vendedor_id: user.accountNumber,
                                    productStatus: "concluido"
                                }, {
                                    vendedor_id: user.accountNumber,
                                    productStatus: "devolucao_concluida"
                                }, {
                                    vendedor_id: user.accountNumber,
                                    productStatus: "removido"
                                }]
                            }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, product) {
                                if (err) throw err;
                                if (!product) {
                                    return res.status(403).send({ success: false, msg: 'Product not found.' });
                                }
                                else {
                                    res.json({
                                        success: true,
                                        productinfo: product,
                                        user: user,
                                        numero_produtos: cnt,
                                        pages: Math.ceil(cnt / perPage),
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
/*---------------------------------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM DETERMINADO PRODUTO PARA ADICIONAR AO CARRINHO 
*--------------------------------------------------------------------------------------------*/
router.get('/productCart/:id_produto', function(req, res) {
    var id_produto = req.params.id_produto;
    db.collection("products").findOne({
        id_produto: id_produto
    }, function(err, product) {
        if (err) throw err;
        if (!product) {
            return res.status(403).send({ success: false, msg: 'Product not found.' });
        }
        else {
            res.json({ success: true, productinfo: product });
        }
    });
});


/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM DETERMINADO PRODUTO 
*-------------------------------------------------------------------*/
/*router.get('/allProducts', function(req, res) {
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
                        Product.find({}, function(err, products) {
                            if (err) throw err;

                            if (!products) {
                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                            }
                            else {
                                res.json({ success: true, products: products });
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
});*/

/*---------------------------------------------------------------------
ROUTE PARA ENVIAR PRODUTOS DA PAGINA INCIAL
*-------------------------------------------------------------------*/
router.get('/productsIndex', function(req, res) {
    var id_gerado = req.headers.authorization;
    if (id_gerado == undefined) {
        Product.aggregate([{ $sample: { size: 8 } }],
            function(err, products) {
                if (err) throw err;
                if (!products) {
                    return res.status(403).send({ success: false, msg: 'ERRO PRODUTOS' });
                }
                else {
                    res.json({ success: true, products: products });
                }
            });
    }
    else {
        Chave.findOne({
            id_gerado: id_gerado
        }, function(err, chave) {
            if (err) throw err;
            if (!chave) {
                return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
            }
            else {
                var decoded = jwt.decode(chave.token, config.secret);
                console.log(chave.token);
                User.findOne({
                    username: decoded.username
                }, function(err, user) {
                    if (err) throw err;
                    if (!user) {
                        return res.status(403).send({ success: false, msg: 'ERRO USER' });
                    }
                    else {
                        Product.aggregate([{

                                $sample: { size: 8 }

                            }],
                            function(err, products) {
                                if (err) throw err;
                                if (!products) {
                                    return res.status(403).send({ success: false, msg: 'ERRO PRODUTOS LOGADO' });
                                }
                                else {
                                    res.json({ success: true, products: products, user: user });
                                }
                            });
                    }
                });
            }
        });
    }
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES DE TODOS OS PRODUTOS 
*-------------------------------------------------------------------*/
router.get('/allProducts/:page', function(req, res) {
    var id_gerado = req.headers.authorization;
    console.log(id_gerado);
    var perPage = 12
    var page = req.params.page || 1
    if (id_gerado == undefined) {
        console.log("VAZIO");
        var cont = db.collection("products").count(function(err, cnt) {
            Product.find({ productStatus: 'venda' }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                if (err) throw err;
                if (!products) {
                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                }
                else {
                    res.json({ success: true, products: products, numero_produtos: cnt, pages: Math.ceil(cnt / perPage), current: page, });
                }
            });
        });
    }
    else {
        Chave.findOne({
            id_gerado: id_gerado
        }, function(err, chave) {
            if (err) throw err;
            if (!chave) {
                return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
            }
            else {
                var decoded = jwt.decode(chave.token, config.secret);
                console.log(chave.token);
                User.findOne({
                    username: decoded.username
                }, function(err, user) {
                    if (err) throw err;

                    if (!user) {
                        return res.status(403).send({ success: false, msg: 'ERRO USER' });
                    }
                    else {
                        var cont = db.collection("products").count(function(err, cnt) {
                            Product.find({ productStatus: { productStatus: 'venda' } }, function(err, products) {
                                if (err) throw err;
                                if (!products) {
                                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                }
                                else {
                                    res.json({ success: true, products: products, numero_produtos: cnt });

                                }
                            });
                        });
                    }
                });
            }
        });
    }
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES DE TODOS OS PRODUTOS com aggregate
*-------------------------------------------------------------------*/
/*  
router.get('/allProducts/:page', function(req, res) {
    var id_gerado = req.headers.authorization;
    console.log(id_gerado);
    var perPage = 12
    var page = req.params.page || 1
    if (id_gerado == undefined) {
        console.log("VAZIO");
        var cont = db.collection("products").count(function(err, cnt) {
            Product.find({}).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                if (err) throw err;
                if (!products) {
                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                }
                else {
                    res.json({ success: true, products: products, numero_produtos: cnt, pages: Math.ceil(cnt / perPage), current: page, });
                }
            });
        });
    }
    else {
        Chave.findOne({
            id_gerado: id_gerado
        }, function(err, chave) {
            if (err) throw err;
            if (!chave) {
                return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
            }
            else {
                var decoded = jwt.decode(chave.token, config.secret);
                console.log(chave.token);
                User.findOne({
                    username: decoded.username
                }, function(err, user) {
                    if (err) throw err;

                    if (!user) {
                        return res.status(403).send({ success: false, msg: 'ERRO USER' });
                    }
                    else {
                        var cont = db.collection("products").count(function(err, cnt) {

                            Product.find({}, function(err, products) {
                                if (err) throw err;
                                if (!products) {
                                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                }
                                else {
                                    Product.aggregate([
                                            { $match: { accountNumber: products.vendedor_id} },
                                            { $lookup: { from: "users", localField: "vendedor_id", foreignField: "accountNumber", as: "user" } },
                                        ],

                                        function(err, teste) {
                                            if (err) throw err;

                                            if (!products) {
                                                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                            }
                                            else {
                                                res.json({ success: true,  numero_produtos: cnt, teste: teste });

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
*/
/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES DE TODOS OS PRODUTOS POR ORDEM ASCENDENTE 
*-------------------------------------------------------------------*/
router.get('/allProducts/preco_ascendente/:page', function(req, res) {
    var id_gerado = req.headers.authorization;
    console.log(id_gerado);
    var perPage = 12
    var page = req.params.page || 1
    if (id_gerado == undefined) {
        console.log("VAZIO");
        var cont = db.collection("products").count(function(err, cnt) {
            Product.find({}).sort({ "preco": 1 }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                if (err) throw err;
                if (!products) {
                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                }
                else {
                    res.json({ success: true, products: products, numero_produtos: cnt, pages: Math.ceil(cnt / perPage), current: page, });
                }
            });
        });
    }
    else {
        Chave.findOne({
            id_gerado: id_gerado
        }, function(err, chave) {
            if (err) throw err;
            if (!chave) {
                return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
            }
            else {
                var decoded = jwt.decode(chave.token, config.secret);
                console.log(chave.token);
                User.findOne({
                    username: decoded.username
                }, function(err, user) {
                    if (err) throw err;

                    if (!user) {
                        return res.status(403).send({ success: false, msg: 'ERRO USER' });
                    }
                    else {
                        var cont = db.collection("products").count(function(err, cnt) {
                            Product.find({}, function(err, products) {
                                if (err) throw err;
                                if (!products) {
                                    return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                }
                                else {
                                    res.json({ success: true, products: products, user: user, numero_produtos: cnt });
                                }
                            });
                        });
                    }
                });
            }
        });
    }
});

router.get('/generate-fake-data', function(req, res, next) {
    for (var i = 300; i < 330; i++) {
        var newProduct = new Product({
            id_produto: i + 1,
            nome_produto: faker.commerce.productName(),
            categoria: "outros",
            subcategoria: "",
            descricao: "Descricao de teste de produto. Produto muito bonito. Como novo",
            preco: faker.commerce.price(),
            negociavel: faker.random.arrayElement(["sim", "nao"]),
            imagem: faker.random.arrayElement(["imagem-1527626748393.png", "imagem-1528046965920.jpg", "product01.jpg", "product02.jpg", "product03.jpg", "product04.jpg", "product05.jpg", "product06.jpg"]),
            vendedor_id: "1",
            cidade: faker.random.arrayElement(["aveiro", "beja", "braga", "braganca", "castelo branco", "coimbra", "evora", "faro", "guarda", "leiria", "lisboa", "portalegre", "porto", "santarem", "setubal", "viana do castelo", "vila real", "viseu"]),
            rating: faker.random.number({ min: 0, max: 5 }),
            productStatus: "venda",
            id_comprador: "",
            nome_vendedor: "afonsocosta",
            nome_comprador: "",
            data_criacao: "16-06-2018",
            data_venda: "",
            valor_transferido: "0",
            valor_atransferir: "0",
            motivoDevolucao: ""
        })
        newProduct.save(function(err, product) {
            if (err) throw err
        });
    }
    res.json({ success: "ok" });
});

router.get('/productsUser/:page', function(req, res) {
    var id_gerado = req.headers.authorization;
    var id_vendedor = req.query.id_vendedor;
    var perPage = 12
    var page = req.params.page || 1
    var negociavel = req.query.negociavel
    var cidade = req.query.cidade
    var sort = req.query.sort
    var de = req.query.de
    var ate = req.query.ate
    var categoria = req.query.categoria
    var subcategoria = req.query.subcategoria
    var vendedor = req.query.rating
    var sortfiltro = ""
    var texto_procura = req.query.texto_procura;
    var precoMaisBarato = 0;
    var precoMaisCaro = 0;
    var ratingpesquisa = ""
    /*---------------------------------------------------------------------
                                POR RELEVANCIA 
        *-------------------------------------------------------------------*/
    if (sort === 'undefined') {
        var sortfiltro = "Relevancia";
        if (id_vendedor === "undefined") {
            var id_vendedor = { $regex: /.*/ }
        }
        else {
            id_vendedor
        }
        if (cidade === "undefined") {
            var cidade = { $regex: /.*/ }
        }
        else {
            var local = 'active';
            var filtrosativos = 'active';
        }
        if (negociavel === "undefined") {
            var negociavel = { $regex: /.*/ }
        }
        else {
            var negociavelsim = 'active';
            var filtrosativos = 'active';
        }
        if (de === "undefined") {
            var de = 0
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (ate === "undefined") {
            var ate = 100000000000000000000000000000000
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (subcategoria === "undefined") {
            var subcategoria = { $regex: /.*/ }
        }
        else {
            var subcategoriafiltro = 'active';
            var filtrosativos = 'active';
        }
        if (vendedor === "undefined") {
            var ratingpesquisa = { $gte: 0, $lte: 5 }
        }
        else {
            if (vendedor === 5) {
                var ratingpesquisa = 5
            }
            else {
                var ratingpesquisa = { $gte: vendedor, $lte: 5 }
            }
            var rating2 = 'active';
            var filtrosativos = 'active';
        }
        if (categoria === "undefined" || categoria === "todas") {
            var categoria = { $regex: /.*/ }
        }
        else {}
        Product.findOne({ productStatus: "venda", rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": 1 }).exec(function(err, produtoMaisCaro) {
            if (err) throw err;
            if (!produtoMaisCaro) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisCaro = produtoMaisCaro.preco

            }
        });
        Product.findOne({ productStatus: "venda", rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": -1 }).exec(function(err, produtoMaisBarato) {
            if (err) throw err;
            if (!produtoMaisBarato) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisBarato = produtoMaisBarato.preco
            }
        });
        if (id_gerado === undefined) {
            Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).count(function(err, cnt) {
                Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                    if (err) throw err;
                    if (!products) {
                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                    }
                    else {
                        res.json({
                            success: true,
                            products: products,
                            numero_produtos: cnt,
                            pages: Math.ceil(cnt / perPage),
                            current: page,
                            local: local,
                            negociavelsim: negociavelsim,
                            filtrosativos: filtrosativos,
                            rating: rating,
                            preco: preco,
                            subcategoriafiltro: subcategoriafiltro,
                            sortfiltro: sortfiltro,
                            precoMaisBarato: precoMaisBarato,
                            precoMaisCaro: precoMaisCaro,
                        });
                    }
                });
            });
        }
        else {
            Chave.findOne({
                id_gerado: id_gerado
            }, function(err, chave) {
                if (err) throw err;
                if (!chave) {
                    return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
                }
                else {
                    var decoded = jwt.decode(chave.token, config.secret);
                    User.findOne({
                        username: decoded.username
                    }, function(err, user) {
                        if (err) throw err;
                        if (!user) {
                            return res.status(403).send({ success: false, msg: 'ERRO USER' });
                        }
                        else {
                            Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).count(function(err, cnt) {
                                Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                                    if (err) throw err;
                                    if (!products) {
                                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                    }
                                    else {
                                        res.json({
                                            success: true,
                                            products: products,
                                            numero_produtos: cnt,
                                            pages: Math.ceil(cnt / perPage),
                                            current: page,
                                            local: local,
                                            negociavelsim: negociavelsim,
                                            filtrosativos: filtrosativos,
                                            rating: rating,
                                            preco: preco,
                                            subcategoriafiltro: subcategoriafiltro,
                                            user: user,
                                            sortfiltro: sortfiltro,
                                            precoMaisBarato: precoMaisBarato,
                                            precoMaisCaro: precoMaisCaro,
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
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
        else {

        }
        if (id_vendedor === "undefined") {
            var id_vendedor = { $regex: /.*/ }
        }
        else {
            id_vendedor
        }
        if (cidade === "undefined") {
            var cidade = { $regex: /.*/ }
        }
        else {
            var local = 'active';
            var filtrosativos = 'active';
        }
        if (negociavel === "undefined") {
            var negociavel = { $regex: /.*/ }
        }
        else {
            var negociavelsim = 'active';
            var filtrosativos = 'active';
        }
        if (de === "undefined") {
            var de = 0
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (ate === "undefined") {
            var ate = 100000000000000000000000000000000
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (subcategoria === "undefined") {
            var subcategoria = { $regex: /.*/ }
        }
        else {
            var subcategoriafiltro = 'active';
            var filtrosativos = 'active';
        }
        if (vendedor === "undefined") {
            var ratingpesquisa = { $gte: 0, $lte: 5 }
        }
        else {
            if (vendedor === 5) {
                var ratingpesquisa = 5
            }
            else {
                var ratingpesquisa = { $gte: vendedor, $lte: 5 }
            }
            var rating2 = 'active';
            var filtrosativos = 'active';
        }
        if (categoria === "undefined") {
            var categoria = { $regex: /.*/ }
        }
        else {}
        Product.findOne({ productStatus: "venda", rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": 1 }).exec(function(err, produtoMaisCaro) {
            if (err) throw err;
            if (!produtoMaisCaro) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisCaro = produtoMaisCaro.preco

            }
        });
        Product.findOne({ productStatus: "venda", rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": -1 }).exec(function(err, produtoMaisBarato) {
            if (err) throw err;
            if (!produtoMaisBarato) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisBarato = produtoMaisBarato.preco
            }
        });
        if (id_gerado === 'undefined') {
            Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).count(function(err, cnt) {
                Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).sort({ "preco": -1 }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                    if (err) throw err;
                    if (!products) {
                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                    }
                    else {
                        res.json({
                            success: true,
                            products: products,
                            numero_produtos: cnt,
                            pages: Math.ceil(cnt / perPage),
                            current: page,
                            local: local,
                            negociavelsim: negociavelsim,
                            filtrosativos: filtrosativos,
                            rating: rating,
                            preco: preco,
                            subcategoriafiltro: subcategoriafiltro,
                            subcategoria: subcategoria,
                            sortfiltro: sortfiltro,
                            precoMaisBarato: precoMaisBarato,
                            precoMaisCaro: precoMaisCaro,
                        });
                    }
                });
            });
        }
        else {
            Chave.findOne({
                id_gerado: id_gerado
            }, function(err, chave) {
                if (err) throw err;
                if (!chave) {
                    return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
                }
                else {
                    var decoded = jwt.decode(chave.token, config.secret);
                    User.findOne({
                        username: decoded.username
                    }, function(err, user) {
                        if (err) throw err;
                        if (!user) {
                            return res.status(403).send({ success: false, msg: 'ERRO USER' });
                        }
                        else {
                            Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).count(function(err, cnt) {
                                Product.find({ productStatus: "venda", negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, vendedor_id: id_vendedor }).sort(sort).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                                    if (err) throw err;
                                    if (!products) {
                                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                    }
                                    else {
                                        res.json({
                                            success: true,
                                            products: products,
                                            numero_produtos: cnt,
                                            pages: Math.ceil(cnt / perPage),
                                            current: page,
                                            local: local,
                                            negociavelsim: negociavelsim,
                                            filtrosativos: filtrosativos,
                                            rating: rating,
                                            preco: preco,
                                            user: user,
                                            subcategoriafiltro: subcategoriafiltro,
                                            subcategoria: subcategoria,
                                            sortfiltro: sortfiltro,
                                            precoMaisBarato: precoMaisBarato,
                                            precoMaisCaro: precoMaisCaro,
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    }
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES DE TODOS OS PRODUTOS 
*-------------------------------------------------------------------*/
router.get('/testeProcurar/:page', function(req, res) {
    var id_gerado = req.headers.authorization;
    var perPage = 12
    var page = req.params.page || 1
    var negociavel = req.query.negociavel
    var cidade = req.query.cidade
    var sort = req.query.sort
    var de = req.query.de
    var ate = req.query.ate
    var categoria = req.query.categoria
    var subcategoria = req.query.subcategoria
    var vendedor = req.query.rating
    var sortfiltro = ""
    var texto_procura = req.query.texto_procura;
    var precoMaisBarato = 0;
    var precoMaisCaro = 0;
    var ratingpesquisa = ""

    /*---------------------------------------------------------------------
                                POR RELEVANCIA 
        *-------------------------------------------------------------------*/
    if (sort === 'undefined') {
        var sortfiltro = "Relevancia";
        if (texto_procura === "" || texto_procura === 'undefined') {
            var texto_procura = { $regex: /.*/ }
        }
        else {
            var texte = new RegExp(req.query.texto_procura);
            var texto_procura = { $regex: texte }
        }
        if (id_vendedor === "undefined") {
            var id_vendedor = { $regex: /.*/ }
        }
        else {
            id_vendedor
        }
        if (cidade === "undefined") {
            var cidade = { $regex: /.*/ }
        }
        else {
            var local = 'active';
            var filtrosativos = 'active';
        }
        if (negociavel === "undefined") {
            var negociavel = { $regex: /.*/ }
        }
        else {
            var negociavelsim = 'active';
            var filtrosativos = 'active';
        }
        if (de === "undefined") {
            var de = 0
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (ate === "undefined") {
            var ate = 100000000000000000000000000000000
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (subcategoria === "undefined") {
            var subcategoria = { $regex: /.*/ }
        }
        else {
            var subcategoriafiltro = 'active';
            var filtrosativos = 'active';
        }
        if (vendedor === "undefined") {
            var ratingpesquisa = { $gte: 0, $lte: 5 }
        }
        else {
            if (vendedor === 5) {
                var ratingpesquisa = 5
            }
            else {
                var ratingpesquisa = { $gte: vendedor, $lte: 5 }
            }
            var rating2 = 'active';
            var filtrosativos = 'active';
        }
        if (categoria === "undefined" || categoria === "todas") {
            var categoria = { $regex: /.*/ }
        }
        else {}
        Product.findOne({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": 1 }).exec(function(err, produtoMaisCaro) {
            if (err) throw err;
            if (!produtoMaisCaro) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisCaro = produtoMaisCaro.preco

            }
        });
        Product.findOne({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": -1 }).exec(function(err, produtoMaisBarato) {
            if (err) throw err;
            if (!produtoMaisBarato) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisBarato = produtoMaisBarato.preco
            }
        });
        if (id_gerado === undefined) {
            Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).count(function(err, cnt) {
                Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                    if (err) throw err;
                    if (!products) {
                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                    }
                    else {
                        res.json({
                            success: true,
                            products: products,
                            numero_produtos: cnt,
                            pages: Math.ceil(cnt / perPage),
                            current: page,
                            local: local,
                            negociavelsim: negociavelsim,
                            filtrosativos: filtrosativos,
                            rating: vendedor,
                            preco: preco,
                            subcategoriafiltro: subcategoriafiltro,
                            sortfiltro: sortfiltro,
                            subcategoria: subcategoria,
                            precoMaisBarato: precoMaisBarato,
                            precoMaisCaro: precoMaisCaro,
                            rating: rating2
                        });
                    }
                });
            });
        }
        else {
            Chave.findOne({
                id_gerado: id_gerado
            }, function(err, chave) {
                if (err) throw err;
                if (!chave) {
                    return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
                }
                else {
                    var decoded = jwt.decode(chave.token, config.secret);
                    User.findOne({
                        username: decoded.username
                    }, function(err, user) {
                        if (err) throw err;
                        if (!user) {
                            return res.status(403).send({ success: false, msg: 'ERRO USER' });
                        }
                        else {
                            Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).count(function(err, cnt) {
                                Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                                    if (err) throw err;
                                    if (!products) {
                                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                    }
                                    else {
                                        res.json({
                                            success: true,
                                            products: products,
                                            numero_produtos: cnt,
                                            pages: Math.ceil(cnt / perPage),
                                            current: page,
                                            local: local,
                                            negociavelsim: negociavelsim,
                                            filtrosativos: filtrosativos,
                                            rating: vendedor,
                                            preco: preco,
                                            subcategoriafiltro: subcategoriafiltro,
                                            user: user,
                                            sortfiltro: sortfiltro,
                                            subcategoria: subcategoria,
                                            precoMaisBarato: precoMaisBarato,
                                            precoMaisCaro: precoMaisCaro
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
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
        else {

        }
        if (texto_procura === "" || texto_procura === 'undefined') {
            var texto_procura = { $regex: /.*/ }
        }
        else {
            var texte = new RegExp(req.query.texto_procura);
            var texto_procura = { $regex: texte }
        }
        if (id_vendedor === "undefined") {
            var id_vendedor = { $regex: /.*/ }
        }
        else {
            id_vendedor
        }
        if (cidade === "undefined") {
            var cidade = { $regex: /.*/ }
        }
        else {
            var local = 'active';
            var filtrosativos = 'active';
        }
        if (negociavel === "undefined") {
            var negociavel = { $regex: /.*/ }
        }
        else {
            var negociavelsim = 'active';
            var filtrosativos = 'active';
        }
        if (de === "undefined") {
            var de = 0
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (ate === "undefined") {
            var ate = 100000000000000000000000000000000
        }
        else {
            var preco = 'active';
            var filtrosativos = 'active';
        }
        if (subcategoria === "undefined") {
            var subcategoria = { $regex: /.*/ }
        }
        else {
            var subcategoriafiltro = 'active';
            var filtrosativos = 'active';
        }
        if (vendedor === "undefined") {
            var ratingpesquisa = { $gte: 0, $lte: 5 }
        }
        else {
            if (vendedor === 5) {
                var ratingpesquisa = 5
            }
            else {
                var ratingpesquisa = { $gte: vendedor, $lte: 5 }
            }
            var rating2 = 'active';
            var filtrosativos = 'active';
        }
        if (categoria === "undefined" || categoria === "todas") {
            var categoria = { $regex: /.*/ }
        }
        else {}
        Product.findOne({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": 1 }).exec(function(err, produtoMaisCaro) {
            if (err) throw err;
            if (!produtoMaisCaro) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisCaro = produtoMaisCaro.preco

            }
        });
        Product.findOne({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort({ "preco": -1 }).exec(function(err, produtoMaisBarato) {
            if (err) throw err;
            if (!produtoMaisBarato) {
                return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
            }
            else {
                precoMaisBarato = produtoMaisBarato.preco
            }
        });
        if (id_gerado === undefined) {
            Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).count(function(err, cnt) {
                Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort(sort).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                    if (err) throw err;
                    if (!products) {
                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                    }
                    else {
                        res.json({
                            success: true,
                            products: products,
                            numero_produtos: cnt,
                            pages: Math.ceil(cnt / perPage),
                            current: page,
                            local: local,
                            negociavelsim: negociavelsim,
                            filtrosativos: filtrosativos,
                            rating: vendedor,
                            preco: preco,
                            subcategoriafiltro: subcategoriafiltro,
                            subcategoria: subcategoria,
                            sortfiltro: sortfiltro,
                            precoMaisBarato: precoMaisBarato,
                            precoMaisCaro: precoMaisCaro
                        });
                    }
                });
            });
        }
        else {
            Chave.findOne({
                id_gerado: id_gerado
            }, function(err, chave) {
                if (err) throw err;
                if (!chave) {
                    return res.status(403).send({ success: false, msg: 'ERRO CHAVE' });
                }
                else {
                    var decoded = jwt.decode(chave.token, config.secret);
                    User.findOne({
                        username: decoded.username
                    }, function(err, user) {
                        if (err) throw err;
                        if (!user) {
                            return res.status(403).send({ success: false, msg: 'ERRO USER' });
                        }
                        else {
                            Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).count(function(err, cnt) {
                                Product.find({ productStatus: 'venda', rating: ratingpesquisa, negociavel: negociavel, preco: { $gte: de, $lte: ate }, categoria: categoria, subcategoria: subcategoria, cidade: cidade, nome_produto: texto_procura }).sort(sort).skip((perPage * page) - perPage).limit(perPage).exec(function(err, products) {
                                    if (err) throw err;
                                    if (!products) {
                                        return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
                                    }
                                    else {
                                        res.json({
                                            success: true,
                                            products: products,
                                            numero_produtos: cnt,
                                            pages: Math.ceil(cnt / perPage),
                                            current: page,
                                            local: local,
                                            negociavelsim: negociavelsim,
                                            filtrosativos: filtrosativos,
                                            rating: vendedor,
                                            preco: preco,
                                            user: user,
                                            subcategoriafiltro: subcategoriafiltro,
                                            subcategoria: subcategoria,
                                            sortfiltro: sortfiltro,
                                            precoMaisBarato: precoMaisBarato,
                                            precoMaisCaro: precoMaisCaro
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    }
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER PRODUTOS COMPRADO
*-------------------------------------------------------------------*/
router.get('/balanco/:page', function(req, res) {
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
                        Product.find({
                            $or: [{
                                id_comprador: user.accountNumber,
                                productStatus: "concluido"
                            }, {
                                id_comprador: user.accountNumber,
                                productStatus: "devolucao_concluida"
                            }]
                        }).exec(function(err, produtosComprados) {
                            if (err) throw err;
                            if (!produtosComprados) {
                                return res.status(403).send({ success: false, msg: 'Product not found.' });
                            }
                            else {
                                var i = 0;
                                var total_gasto = 0;
                                produtosComprados.forEach(function(teste) {
                                    total_gasto += produtosComprados[i].preco
                                    i = +1
                                });

                                Product.find({
                                    $or: [{
                                        vendedor_id: user.accountNumber,
                                        productStatus: "concluido"
                                    }, {
                                        vendedor_id: user.accountNumber,
                                        productStatus: "devolucao_concluida"
                                    }]
                                }).exec(function(err, produtosVendidos) {
                                    if (err) throw err;
                                    if (!produtosVendidos) {
                                        return res.status(403).send({ success: false, msg: 'Product not found.' });
                                    }
                                    else {
                                        var i = 0;
                                        var total_recebido = 0;
                                        produtosVendidos.forEach(function(teste) {
                                            total_recebido += produtosVendidos[i].valor_transferido
                                            i = +1
                                        });
                                        Product.find({
                                            $or: [{
                                                vendedor_id: user.accountNumber,
                                                productStatus: "concluido"
                                            }, {
                                                vendedor_id: user.accountNumber,
                                                productStatus: "devolucao_concluida"
                                            }, {
                                                id_comprador: user.accountNumber,
                                                productStatus: "concluido"
                                            }, {
                                                id_comprador: user.accountNumber,
                                                productStatus: "devolucao_concluida"
                                            }]
                                        }).count(function(err, cnt) {
                                            Product.find({
                                                $or: [{
                                                    vendedor_id: user.accountNumber,
                                                    productStatus: "concluido"
                                                }, {
                                                    vendedor_id: user.accountNumber,
                                                    productStatus: "devolucao_concluida"
                                                }, {
                                                    id_comprador: user.accountNumber,
                                                    productStatus: "concluido"
                                                }, {
                                                    id_comprador: user.accountNumber,
                                                    productStatus: "devolucao_concluida"
                                                }]
                                            }).skip((perPage * page) - perPage).limit(perPage).exec(function(err, tabelaProdutos) {
                                                if (err) throw err;
                                                if (!tabelaProdutos) {
                                                    return res.status(403).send({ success: false, msg: 'Product not found.' });
                                                }
                                                else {
                                                    if (!total_recebido) {
                                                        total_recebido = 0;
                                                    }
                                                    else {}
                                                    if (!total_gasto) {
                                                        total_gasto = 0;
                                                    }
                                                    else {}
                                                    var contador = tabelaProdutos.length;
                                                    console.log(total_gasto);
                                                    console.log(total_recebido);
                                                    res.json({
                                                        success: true,
                                                        produtosComprados: produtosComprados,
                                                        produtosVendidos: produtosVendidos,
                                                        tabelaProdutos: tabelaProdutos,
                                                        pages: Math.ceil(cnt / perPage),
                                                        user: user,
                                                        total_gasto: total_gasto,
                                                        total_recebido: total_recebido,
                                                        contador: contador
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
        });
    }
    else {
        return res.status(403).send({ success: false, msg: 'No token provided.' });
    }
});




module.exports = router;
