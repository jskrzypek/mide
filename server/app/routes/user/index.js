// 'use strict';
var router = require('express').Router();
var UserModel = require('mongoose').model('User');
var _ = require('lodash');
var path = require('path');
var SESSION_SECRET = require(path.join(__dirname, '../../../env')).SESSION_SECRET;
var jwt = require('jsonwebtoken'); //encoded json object (token), token sends it back on each request

module.exports = router;

function authenticate(req,res,next){
    var body = req.body;
    if (!body.username || !body.password) {
        res.status(400).end('Must provide username and/or password');
    }

    UserModel.findOne({userName:body.username}).exec().then(userFound,userNotFound);

    function userFound(user){
        console.log('userFound',user,body.password,body.username);
        console.log('correctPassword check',user.correctPassword(body.password));
        if(user.correctPassword(body.password)){
            req.user = user;
            next();
        } else {
          //res.status(401).end('Username or password incorrect');
          userNotFound(user);
        }
    }

    function userNotFound(response){
        res.status(401).end('Username or password incorrect');
    }
}

//TODO: figure out what to include
router.post('/login', authenticate, function(req,res){ // api/login
    var token = jwt.sign({
        userId: req.user._id
    },SESSION_SECRET);
    res.send({
        token:token,
        username: req.user.userName
    });
});


//TODO: Based on receiving a user via jwt
router.get('/token', function(req,res){
   console.log('api/user/token',req.user);
    //res.send()
    if(req.user){ //TODO: Can't req.user be faked? or is this decoded info?
        res.send({
            user:req.user
        });
    } else {
        res.status(401).send('No Authenticated user.');
    }
});

router.post('/signup', function(req, res, next) { // api/signup

	UserModel.create(req.body).then(userCreated, userNotCreated);

	//TODO: Currently you can create multiple non-unique users
	function userCreated(userdata){
		//console.log('userCreated',userdata);
        var token = jwt.sign({
            userId : userdata._id
        },SESSION_SECRET);
        res.send({
            token:token,
            username: userdata.userName
        });
	}
	function userNotCreated(){
		res.send(401).end('User was not created');
	}
});

