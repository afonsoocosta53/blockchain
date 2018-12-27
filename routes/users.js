var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database'); // get db config file
var User = require('../models/user'); // get the mongoose model
var Chave = require('../models/chave'); // get the mongoose model
var Feedback = require('../models/feedback'); // get the mongoose model
var Conversation = require('../models/conversation'); // get the mongoose model
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
ROUTE PARA CRIAR UM USER (POST http://localhost:8080/api/signup)
 *-------------------------------------------------------------------*/
router.post('/signup', function(req, res) {
  var password = req.body.password;
  if (!req.body.username || !req.body.password || !req.body.email) {
    res.json({ success: false, msg: 'Please pass name and password.' });
  }
  else {
    User.findOne({
      username: req.body.username
    }, function(err, user) {
      if (err) throw err;
      if (user) {
        return res.status(403).send({ success: false, msg: 'Username já registado.' });
      }
      else {
        User.findOne({
          email: req.body.email
        }, function(err, user) {
          if (err) throw err;
          if (user) {
            return res.status(403).send({ success: false, msg: 'Email já registado.' });
          }
          else {
            bcrypt.genSalt(11, function(err, salt) {
              if (err) {
                return err;
              }
              bcrypt.hash(req.body.password, salt, function(err, hash) {
                if (err) {
                  return err;
                }
                req.body.password = hash;
                var cont = db.collection("users").count(function(err, cnt) {
                  var date = new Date()
                  var dt = dateTime.create();
                  var formatted = dt.format('Y-m-d H:M:S');
                  var formatted2 = dt.format('Y-m-d');
                  var id_gerado = randomstring.generate();
                  var newUser = new User({
                    username: req.body.username,
                    password: password,
                    email: req.body.email,
                    name: '',
                    lastName: '',
                    accCreatedOn: formatted2,
                    lastSignedIn: '',
                    lastAccIp: ip.address(),
                    accountNumber: cnt + 1,
                    accountPoint: 'conta_incompleta',
                    account_state: 'Pending',
                    id_gerado: id_gerado,
                    rating: 0,
                    numFeedbacks: 0,
                    imagem: 'user1.png',
                    address: '',
                    phone: '',
                    country: '',
                    postalCode: '',  
                    address2: '',
                    country2: '',
                    postalCode2: '',
                    addressConta: req.body.addressConta,
                    chavePrivada: req.body.privatekey,
                    pedirMoeda: "Nao"
                  });
                  var token = jwt.encode(newUser, config.secret);
                  var token_uniq = jwt.encode(newUser, config.secret2);
                  // save the user
                  newUser.save(function(err, user) {
                    if (err) {
                      return res.json({ success: false, msg: 'Username already exists.' });
                    }
                    var newChave = new Chave({
                      id_gerado: id_gerado,
                      token: token,
                      token_uniq: token_uniq
                    });
                    newChave.save(function(err, chave) {
                      if (err) {
                        return res.json({ success: false, msg: 'Erro ao gerar chave' });
                      }
                      var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: config.email,
                          pass: config.email_password
                        }
                      });

                      var mailOptions = {
                        from: config.email,
                        to: req.body.email,
                        subject: 'Ourkartal Confirmação de conta',
                        text: 'https://ourkartal-afonsoocosta53.c9users.io/user/confirmarconta/' + id_gerado
                      };

                      transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                          console.log(error);
                        }
                        else {
                          console.log('Email sent: ' + info.response);
                          res.json({ success: true, msg: 'Successful created new user. ', message: user });
                        }
                      });
                    });
                  });
                });
              });
            });
          }
        });
      }
    });
  }
});
/*---------------------------------------------------------------------
ROUTE PARA EDITAR UM USER (POST http://localhost:8080/api/signup)
*-------------------------------------------------------------------*/
router.post('/pedirMoeda', function(req, res) {
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
            if (user.pedirMoeda = "Nao") {
              var cont = db.collection("users").count(function(err, cnt) {
                var editPedirMoeda = {
                  $set: {
                    pedirMoeda: "Sim",
                  }
                };
                var myquery = { id_gerado: user.id_gerado };
                db.collection("users").updateOne(myquery, editPedirMoeda, function(err, dbb) {
                  if (err) {
                    return res.json({ success: false, msg: 'Business already exists.' });
                  }
                  else {
                    return res.json({ success: true, msg: 'Moeda pedida com sucesso.' });
                  }
                });
              });
            }
            else {
              return res.json({ success: false, msg: 'Moeda ja pedida.' });

            }
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
ROUTE PARA RECUPERAR PASSWORD
 *-------------------------------------------------------------------*/
router.post('/recuperarPassword', function(req, res) {
  var email = req.body.email;
  var username = req.body.username;
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email,
      pass: config.email_password
    }
  });
  var mailOptions = {
    from: config.email,
    to: email,
    subject: 'Ourkartal Recuperar Password',
    text: 'https://ourkartal-afonsoocosta53.c9users.io/user/novaPassword/' + username + '&' + email
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    }
    else {
      console.log('Email sent: ' + info.response);
      res.json({ success: true, message: info });
    }
  });
});

/*---------------------------------------------------------------------
ROUTE PARA ESCREVER NOVA PASSWORD
*-------------------------------------------------------------------*/
router.post('/novaPassword/:username&:email', function(req, res) {
  /*var id_gerado = req.params.id_gerado;
  var id_g = id_gerado.replace("id_gerado=", "");
  console.log(id_g);*/
  var email = req.params.email;
  var username = req.params.username;
  var password = req.body.password;
  var password2 = req.body.password2
  if (username && email) {
    User.findOne({
      username: username,
      email: email
    }, function(err, user) {
      if (!user) {
        res.send({ success: false, msg: 'User não encontrado.' });
      }
      else {
        if (password == password2) {
          bcrypt.genSalt(11, function(err, salt) {
            if (err) {
              return err;
            }
            bcrypt.hash(password, salt, function(err, hash) {
              if (err) {
                return err;
              }
              password = hash;
              var nova_password = { $set: { password: password } };
              var myquery = { username: username };
              db.collection("users").updateOne(myquery, nova_password, function(err, rp) {
                if (err) throw err;

                if (!rp) {
                  res.send({ success: false, msg: 'User não encontrado.' });
                }
                else {
                  User.findOne({
                    username: username,
                    email: email
                  }, function(err, user2) {
                    if (!user) {
                      res.send({ success: false, msg: 'User não encontrado.' });
                    }
                    else {

                      res.json({ success: true, user: user2 });
                    }
                  });
                }

              });
            });
          });
        }
      }
    });
  }
  else {
    return res.status(403).send({ success: false, msg: 'No token provided.' });
  }
});
/*---------------------------------------------------------------------
ROUTE PARA AUTENTICAR UM USER (POST http://localhost:8080/api/authenticate)
*-------------------------------------------------------------------*/
router.post('/authenticate', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.send({ success: false, msg: 'Authentication failed. User not found.' });
    }
    else {
      console.log(user)
      console.log(user.password)
      user.comparePassword(req.body.password, function(err, isMatch) {
        console.log(isMatch)
        if (isMatch && !err) {

          // if user is found and password is right create a token
          var myquery = { username: req.body.username };
          var formatted = dateTime.create();
          var timeNow = formatted.format('Y-m-d H:M:S');
          var newvalues = { $set: { lastSignedIn: timeNow } };
          db.collection("users").updateOne(myquery, newvalues, function(err, rep) {
            if (err) throw err;
          });
          console.log(user.id_gerado);
          console.log(user)
          // return the information including token as JSON
          res.json({ success: true, id_gerado: user.id_gerado });
        }
        else {
          res.send({ success: false, msg: 'Authentication failed. Wrong password.' });
        }
      });
    }
  });
});

/*---------------------------------------------------------------------
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM USER (GET http://localhost:8080/api/memberinfo)
*-------------------------------------------------------------------*/
router.get('/activate/:id_gerado', function(req, res) {
  /*var id_gerado = req.params.id_gerado;
  var id_g = id_gerado.replace("id_gerado=", "");
  console.log(id_g);*/
  var id_gerado = req.params.id_gerado;
  if (id_gerado) {
    Chave.findOne({
      id_gerado: id_gerado
    }, function(err, chave) {
      if (!chave) {
        res.send({ success: false, msg: 'Authentication failed. Wrong password.' });
      }
      else {
        var decoded = jwt.decode(chave.token_uniq, config.secret2);
        if (err) throw err;

        var myquery = { username: decoded.username };
        var formatted = dateTime.create();
        var timeNow = formatted.format('Y-m-d H:M:S');
        var newvalues = { $set: { account_state: 'Finished' } };
        var id_chave = { id_gerado: id_gerado };
        var chave_uniq = { $set: { token_uniq: '' } };
        db.collection("users").updateOne(myquery, newvalues, function(err, res) {
          if (err) throw err;
        });
        db.collection("chaves").updateOne(id_chave, chave_uniq, function(err, rp) {
          if (err) throw err;
        });
        res.json({ success: true, msg: 'Welcome in the member area ' });
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
router.get('/memberinfo' /* , passport.authenticate('jwt', { session: false }) */ , function(req, res) {
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
            res.json({ success: true, user: user });
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
ROUTE PARA ACEDER AS INFORMACOES RESTRITAS DE UM USER (GET http://localhost:8080/api/memberinfo)
  *-------------------------------------------------------------------*/
router.get('/vendedorInfo/:id_vendedor' /* , passport.authenticate('jwt', { session: false }) */ , function(req, res) {
  var id_vendedor = req.params.id_vendedor;
  User.findOne({
    accountNumber: id_vendedor,
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
    }
    else {
      res.json({ success: true, user: user });
    }
  });



});

/*---------------------------------------------------------------------
ROUTE PARA EDITAR UM USER (POST http://localhost:8080/api/signup)
*-------------------------------------------------------------------*/
router.post('/editUser', function(req, res) {
  var id_gerado = req.headers.authorization;
  var postalCode = req.body.postalCode;
  var postalCode2 = req.body.postalCode2;
  var cidade = req.body.country;
  var cidade2 = req.body.country2;
  var morada2 = req.body.address2;
  var morada1 = req.body.address;
  var password = req.body.password;
  var password2 = req.body.password2;
  var estadoConta = ''
  console.log(morada1)

  if (morada1 != '' || postalCode != '') {
    estadoConta = 'conta_completa'
  }
  else {
    estadoConta = 'conta_incompleta'
  }
  if (morada2 == 'undefined') {
    morada2 = morada1
  }
  if (cidade2 == 'undefined') {
    cidade2 = cidade
  }
  if (postalCode2 == 'undefined') {
    postalCode2 = postalCode
  }
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
            console.log(user);
            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
          }
          else {
            if (password == password2) {
              bcrypt.genSalt(11, function(err, salt) {
                if (err) {
                  return err;
                }
                bcrypt.hash(req.body.password, salt, function(err, hash) {
                  if (err) {
                    return err;
                  }
                  req.body.password = hash;
                  var dt = dateTime.create();
                  var formatted = dt.format('Y-m-d H:M:S');
                  var newUser = {
                    $set: {
                      password: req.body.password,
                      email: req.body.email,
                      name: req.body.name,
                      lastName: req.body.lastName,
                      phone: req.body.phone,
                      accountPoint: estadoConta,
                      address: morada1,
                      address2: morada2,
                      country: cidade,
                      country2: cidade2,
                      postalCode: postalCode,
                      postalCode2: postalCode2,
                      imagem: 'user1.png',
                      descricao: ''
                    }
                  };
                  var myquery = { username: decoded.username };
                  db.collection("users").updateOne(myquery, newUser, function(err, dbb) {
                    if (err) {
                      return res.json({ success: false, msg: 'Business already exists.' });
                    }
                    else {
                      return res.json({ success: true, msg: 'User Editado.' });
                    }
                  });
                });
              });

            }
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
ROUTE PARA EDITAR UM USER (POST http://localhost:8080/api/signup)
*-------------------------------------------------------------------*/
router.post('/editarPerfil', function(req, res) {
  var id_gerado = req.headers.authorization;
  var imagem = req.body.imagem;
  var email = req.body.email;
  var password = req.body.password;
  var password2 = req.body.password2;
  var descricao = req.body.descricao;
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
            console.log(user);
            return res.status(403).send({ success: false, msg: 'Authentication failed. User not found.' });
          }
          else {
            if (password == password2) {
              bcrypt.genSalt(11, function(err, salt) {
                if (err) {
                  return err;
                }
                bcrypt.hash(req.body.password, salt, function(err, hash) {
                  if (err) {
                    return err;
                  }
                  req.body.password = hash;
                  var dt = dateTime.create();
                  var formatted = dt.format('Y-m-d H:M:S');
                  var newUser = {
                    $set: {
                      password: req.body.password,
                      email: email,
                      imagem: imagem,
                      descricao: descricao
                    }
                  };
                  var myquery = { username: decoded.username };
                  db.collection("users").updateOne(myquery, newUser, function(err, dbb) {
                    if (err) {
                      return res.json({ success: false, msg: 'Business already exists.' });
                    }
                    else {
                      return res.json({ success: true, msg: 'User Editado.' });
                    }
                  });
                });
              });

            }
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
router.post('/addLastProduct', function(req, res) {
  var id_produto = req.body.id_produto;
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
            if (user.procurado.length == 5) {

              var editArrayProcurado = {
                $set: {
                  procurado: user.procurado.splice(0, 1) && user.procurado.concat(id_produto)
                }
              };
            }
            else {
              var editArrayProcurado = {
                $set: {
                  procurado: user.procurado.concat(id_produto)
                }
              };
            }
            var myquery = { accountNumber: user.accountNumber };
            db.collection("users").updateOne(myquery, editArrayProcurado, function(err, dbb) {
              if (err) {
                return res.json({ success: false, msg: 'Business already exists.' });
              }
              else {
                res.json({ success: true, msg: 'Adicionado ultimo produto procurado com sucesso' });
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

/*---------------------------------------------
ROUTE PARA VERIFICAR SE UM USER VERIFICOU EMAIL 
  *--------------------------------------------*/
router.get('/emailVerified', function(req, res) {
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
            if (user.account_state == 'Pending') {
              return res.status(403).send({ msg: 'Por favor, verifique a conta no seu e-mail.' });
            }
            else {
              return res.status(403).send({ success: true, msg: 'Bem Vindo.' + user });
            }
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
router.get('/userInfo/:id_vendedor', function(req, res) {
  var id_vendedor = req.params.id_vendedor;
  var id_gerado = req.headers.authorization;
  if (id_gerado == undefined) {
    db.collection("users").findOne({ accountNumber: id_vendedor }, function(err, vendedor) {
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
            db.collection("products").aggregate([{ $match: { vendedor_id: id_vendedor } }, { $sample: { size: 4 } }], function(err, produtos) {
              if (err) throw err;
              if (!produtos) {
                return res.status(403).send({ success: false, msg: 'Seller not found.' });
              }
              else {
                res.json({ success: true, vendedor: vendedor, feedback: feedback, produtos4: produtos });
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
            db.collection("users").findOne({ accountNumber: id_vendedor }, function(err, vendedor) {
              if (err) throw err;
              if (!vendedor) {
                return res.status(403).send({ success: false, msg: 'Seller not found.' });
              }
              else {
                Feedback.find({ id_vendedor: id_vendedor }, function(err, feedback) {
                  if (err) throw err;
                  if (!feedback) {
                    return res.status(403).send({ success: false, msg: 'Seller not found.' });
                  }
                  else {
                    db.collection("products").aggregate([{ $match: { vendedor_id: id_vendedor } }, { $sample: { size: 4 } }], function(err, produtos) {
                      if (err) throw err;
                      if (!produtos) {
                        return res.status(403).send({ success: false, msg: 'Seller not found.' });
                      }
                      else {
                        res.json({ success: true, vendedor: vendedor, feedback: feedback, produtos4: produtos, user: user });
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

module.exports = router;
