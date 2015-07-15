var express = require('express');
var app = express();
app.use('/',express.static('./public')).listen(8080);
console.log("client server listening on port 8080...");