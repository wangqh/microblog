
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoStore = require('connect-mongo')(express)
  , settings = require('./settings')
  , flash = require('connect-flash')
  , fs = require('fs')
  , accessLogfile = fs.createWriteStream('access.log', {flags: 'a'})
  , errorLogfile = fs.createWriteStream('error.log', {flags: 'a'})

var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(flash());
  app.use(express.session({
    secret: settings.cookieSecret,
    store: new mongoStore({
      db: settings.db
    })
  })); 

  app.use(function(req, res, next){
    var err = req.flash("error");
    var succ = req.flash("success");
    res.locals.user = req.session.user;
    res.locals.success = succ.length ? succ : null;
    res.locals.error = err.length ? err : null;
    next();
  });
  app.use(app.router);
  app.use(express.logger({stream: accessLogfile}));
  app.use(express.static(path.join(__dirname, 'public')));
});


//routes

app.get('/', routes.index);
app.get('/u/:user', routes.user);
app.post('/post', routes.checkLogin);
app.post('/post', routes.post);
app.get('/reg', routes.checkNotLogin);
app.get('/reg', routes.reg);
app.post('/reg', routes.checkNotLogin);
app.post('/reg', routes.doReg);
app.get('/login', routes.checkNotLogin);
app.get('/login', routes.login);
app.post('/login', routes.checkNotLogin);
app.post('/login', routes.doLogin);
app.get('/logout', routes.checkLogin);
app.get('/logout', routes.logout);

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.configure('production', function(){
  app.use(function(err, req, res, next){
    var meta = '[' + new Date() +']' + req.url + '\n';
    errorLogfile.write(meta + err.stack + '\n');
    next();
  });
});

if(!module.parent){
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
  });
}

