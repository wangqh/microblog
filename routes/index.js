var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');
/*
 * routes.
 */

exports.index = function(req, res){
  Post.get(null, function(err, posts){
    if(err){
      posts = [];
    }
    res.render('index', {
      title: '首页',
      posts: posts
    });
  });
  //throw new Error('An error for test purposes.');
}

exports.user = function(req, res){
  User.get(req.params.user, function(err, user){
    if(!user){
      req.flash('error', '用户不存在');
      return res.redirect('/');
    }
    Post.get(user.name, function(err, posts){
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('user', {
        title: user.name,
        posts: posts
      });
    });
  });
}

exports.reg = function(req, res){
  res.render('reg', { title: '用户注册' });
}

exports.doReg = function(req, res){
  //检验用户两次输入的口令是否一致
  if(req.body['password-repeat'] != req.body['password']){
    req.flash("error", "两次输入的口令不一致");
    return res.redirect('/reg');
  }

  //生成口令的散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');

  var newUser = new User({
    name: req.body.username,
    password: password
  });

  //检查用户名是否已经存在
  User.get(newUser.name,function(err,user){
    if(user){
      err = "用户名已经存在。";
    }
    if(err){
      req.flash("error", err);
      return res.redirect('/reg');
    }
    //如果不存在则新增用户
    newUser.save(function(err){
      if(err){
        req.flash('error', err);
        return res.redirect('/reg');
      }
      req.session.user = newUser;
      req.flash("success", "注册成功");
      res.redirect('/');
    });
  });

}

exports.login = function(req, res){
  res.render("login",{
    title: '用户登录'
  });
}

exports.doLogin = function(req, res){
  //生成口令的散列值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('base64');

  User.get(req.body.username, function(err, user){
    if (!user){
      req.flash('error', '用户不存在');
      return res.redirect("/login");
    }
    if(user.password != password) {
      req.flash('error', "用户密码错误");
      return res.redirect("/login");
    }
    req.session.user = user;
    req.flash('success', "登录成功");
    res.redirect('/');
  });
}

exports.logout = function(req, res){
  req.session.user = null;
  req.flash('success', '退出成功');
  res.redirect('/');
}

exports.post = function(req, res){
  var currentUser = req.session.user;
  var post = new Post(currentUser.name, req.body.post);
  post.save(function(err){
    if(err){
      req.flash('error', err);
      return res.redirect('/');
    }
    req.flash('success', '发布成功 !');
    res.redirect('/u/' + currentUser.name);
  });
}

exports.checkNotLogin = function(req, res, next){
  if(req.session.user){
    req.flash('error', req.session.user.name + ', 已登录 ！');
    return res.redirect('/');
  }
  next();
}

exports.checkLogin = function(req, res, next){
  if(!req.session.user){
    req.flash('error', '未登录 ！');
    return res.redirect('/login');
  }
  next();
}
