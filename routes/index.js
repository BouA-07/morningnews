var express = require('express');
var router = express.Router();

var uid2 = require('uid2')
var SHA256 = require('crypto-js/sha256')
var encBase64 = require('crypto-js/enc-base64')
var wishlistModel = require('../models/wishlist')
var userModel = require('../models/users')

router.post('/wishlist', async function(req,res,next){

  var wishlistExist= await wishlistModel.findOne({title: req.body.title})
  if(wishlistExist === null){
  var newwishlist= new wishlistModel({
    title: req.body.title,
    description: req.body.description,
    url: req.body.url,
    urlToImage: req.body.urlToImage,
    content: req.body.content,
    country: req.body.country
  })}

  saveWishList = await newwishlist.save()

  var user = await userModel.findOne({token: req.body.token}).populate('wishlist').exec();
  var userwishlist = user.wishlist
  userwishlist.push(user)

  await userModel.updateOne(
  {token: req.body.token},
  {wishlist: userwishlist}
);
res.json({result: true})
});






router.post('/sign-up', async function(req,res,next){

  var error = []
  var result = false
  var saveUser = null
  var token = null

  const data = await userModel.findOne({
    email: req.body.emailFromFront
  })

  if(data != null){
    error.push('utilisateur déjà présent')
  }

  if(req.body.usernameFromFront == ''
  || req.body.emailFromFront == ''
  || req.body.passwordFromFront == ''
  ){
    error.push('champs vides')
  }


  if(error.length == 0){

    var salt = uid2(32)
    var newUser = new userModel({
      username: req.body.usernameFromFront,
      email: req.body.emailFromFront,
      password: SHA256(req.body.passwordFromFront+salt).toString(encBase64),
      token: uid2(32),
      salt: salt,
    })
  
    saveUser = await newUser.save()
  
    
    if(saveUser){
      result = true
      token = saveUser.token
    }
  }
  

  res.json({result, saveUser, error, token})
});

router.post('/sign-in', async function(req,res,next){

  var result = false
  var user = null
  var error = []
  var token = null
  
  if(req.body.emailFromFront == ''
  || req.body.passwordFromFront == ''
  ){
    error.push('champs vides')
  }

  if(error.length == 0){
    const user = await userModel.findOne({
      email: req.body.emailFromFront,
    })
  
    
    if(user){
      const passwordEncrypt = SHA256(req.body.passwordFromFront + user.salt).toString(encBase64)

      if(passwordEncrypt == user.password){
        result = true
        token = user.token
      } else {
        result = false
        error.push('mot de passe incorrect')
      }
      
    } else {
      error.push('email incorrect')
    }
  }
  

  res.json({result, user, error, token})


})

module.exports = router;
