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
router.post('/newContact', function(req, res) {
    var email = req.body.email;
    var nome = req.body.nome;
    var motivo = req.body.motivo;
    var mensagem = req.body.mensagem;
    var anexo = req.body.anexo;
    if (!anexo) {
        anexo = ''
    }

    var cont = db.collection("contactos").count(function(err, cnt) {
        var newContacto = new Contacto({
            id_contacto: cnt + 1,
            nome: nome,
            email: email,
            motivo: motivo,
            mensagem: mensagem,
            anexo: anexo
        });
        newContacto.save(function(err, contacto) {
            if (err) {
                res.json({ sucess: false })
            }
            else {
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
                    text: 'Contacto Recebido com sucesso. '+  
                             ' Nome: '+ nome  +
                            ' Motivo: '+ motivo +
                            ' Mensagem: '+ mensagem 
                      };
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                        res.json({ sucess: true, contacto: contacto })
                    }
                });
            }
        });
    });

});


module.exports = router;
