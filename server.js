'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var urlRegex = require('url-regex');

var cors = require('cors');

var app = express();
var Schema = mongoose.Schema;

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI);
app.use(cors());

/** Counter **/
var linkSchema = new Schema({
  url: String,
  id: {
    type: Number,
    unique: true
  }
});

var Link = mongoose.model('Link', linkSchema);


/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));
        
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function(req, res){
  // We check if there is no url or if is invalid
  if(req.body.url != null && req.body.url != "" && urlRegex({exact: true}).test(req.body.url)){
    // We check if the domain has a A or AAAA record
    dns.lookup(req.body.url.replace("https://", "").replace("http://", ""), function(err, data){
      if(err) res.json({"error": "invalid URL"});
      else{
       // We count the links to know the next id
       Link.count().exec(function(err, c){
         if(err) res.json({"error": "internal error"});
         // We create the document and assign it an unique id
         Link.create({url: req.body.url, id: c}, function(err, data){
            if(err) res.json({"error": "internal error"});
            else res.json({"original_url": req.body.url, "short_url": c});
          });
       });
      }
    });
  }else{
    res.json({"error": "invalid URL"});
  }
});

app.get("/api/shorturl/:id", function(req, res){
  Link.findOne({id: req.params.id}, function(err, data){
    if(err) res.redirect("https://potent-llama.glitch.me/");
    else{
      if(data) res.redirect(data.url);
      else res.redirect("https://potent-llama.glitch.me/");
    }
  });
});




app.listen(port, function () {
  console.log('Node.js listening ...');
});
