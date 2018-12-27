var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database'); // get db config file
var User = require('../models/user'); // get the mongoose model
var Chave = require('../models/chave'); // get the mongoose model
var Newsletter = require('../models/newsletter'); // get the mongoose model
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
ROUTE PARA CRIAR UM PRODUTO (POST http://localhost:8080/api/signup)
*-------------------------------------------------------------------*/
router.post('/newNewsletter', function(req, res) {
    Newsletter.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) throw err;
        if (user) {
                    res.json({ sucess: false })
        }
        else {

            var newNewsletter = new Newsletter({
                email: req.body.email
            });
            newNewsletter.save(function(err, newsletter) {
                if (err) {
                    res.json({ sucess: false })
                }
                else {
                    res.json({ sucess: true, newsletter: newsletter })
                }
            });
        }
    });
});





module.exports = router;
