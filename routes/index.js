var crypto  = require('crypto');
var User    = require('../models/user.js');
var Post    = require('../models/post.js');
var Comment = require('../models/comment.js');
var multer  = require('multer');//文件上传中间件
var upload  = multer({dest: './public/images'});
var router  = function(app){
	//首页
	app.get('/',function(req,res){
		//判断是否是第一页，并把请求的页数转换成number类型
		var page = req.query.p ? parseInt(req.query.p):1;
		//查询并返回第 page 页的 10 篇文章
		Post.getTen(null,page,function(err,posts,total){
			if (err){
				posts = [];
			}
			res.render('index',{
				title: '主页',
				user: req.session.user,
				posts: posts,
				page:page,
				isFirstPage: (page-1) == 0,
				isLastPage: ((page-1)*10+posts.length)==total,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		});
	});

	//登陆页
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	//登陆表单
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
			console.log(password);

			
			User.get(req.body.name,function(err,user){

				//检查用户是否存在
				if (!user){
					req.flash('error','用户不存在！');
					return res.redirect('/login');//用户不存在则跳转到登录页
				}
				//检查密码是否一致
				if (user.password != password){
					req.flash('error','密码不正确');
					return res.redirect('/login');
				}

				req.session.user = user;
				req.flash('success','登录成功');
				res.redirect('/');
			});	
	})

	//注册页
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){

		res.render('reg',{
			title:'注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});

	});

	//注册表单
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){

		var name 		= req.body.name,
			password 	= req.body.password,
			password_re = req.body['password-repeat'];
		//检验用户两次输入的密码是否一致
		if (password_re != password){
			req.flash('error','两次输入的密码不一致');
			return res.redirect('/reg')
		}

		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');


		var newUser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});

		//检查用户名是否存在
		User.get(newUser.name,function(err,user){

			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}

			if(user){
				req.flash('error','用户已存在！');
				return res.redirect('/reg');
			}

			//用户名可用
			newUser.save(function(err,user){
				if (err){
					req.flash('error',err);
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success','注册成功!');
				res.redirect('/');

			});
		});
	});

	//发表文章
	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res){
			res.render('upload',{
			title:'上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	app.post('/upload',checkLogin);
	app.post('/upload',function(req,res){
		req.flash('success','文件上传成功');
		res.redirect('/upload');
	});

	app.get('/search', function(req, res){
		Post.search(req.query.keyword, function(err, posts){
			if (err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('search',{
				title: "SEARCH:" + req.query.keyword,
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/u/:name', function(req,res){
		var page = req.query.p ? parseInt(req.query.p):1;
		//检查用户是否存在
		User.get(req.params.name, function(err,user){
			if (!user){
				req.flash('error','用户不存在!');
				return res.redirect('/');//用户不存在则跳转到主页
			}
			//查询并返回该用户的所有文章
			Post.getTen(user.name,page, function(err,posts,total){
				if (err){
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title: user.name,
					posts: posts,
					page: page,
					isFirstPage:(page-1) == 0,
					isLastPage:((page-1)*10 + posts.length)==total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title',function(req,res){
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
			if (err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	//留言
	app.post('/u/:name/:day/:title',function(req,res){
		console.log('留言路由器:')
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() + "" + date.getHours() + ":" + (date.getMinutes() < 10 ?'0'+date.getMinutes() : date.getMinutes());
		console.log('时间:' + time);
		var comment = {
			name: 		req.body.name,
			email: 		req.body.email,
			website: 	req.body.website,
			time: 		time,
			content: 	req.body.content
		}
		console.log('req.params.name' + req.params.name)
		console.log('req.params.day' + req.params.day)
		console.log('req.params.title' + req.params.title)
		console.log(comment);
		var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
			newComment.save(function(err){
			if (err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','留言成功!');
			res.redirect('back');
		})
	});

	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
			if (err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title: '编辑',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		})
	})

	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if (err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功！');
			res.redirect(url);
		});
	});

	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
			if (err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','删除成功');
			res.redirect('/');
		})
	});

	//登出
	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){

		//清空session
		req.session.user = null;
		//设置消息
		req.flash('success','登出成功');
		//页面重定向
		res.redirect('/');
	});

	//发表表单
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){

		var currentUser = req.session.user,
		tags = [req.body.tag1, req.body.tag2, req.body.tag3];
		post = new Post( currentUser.name, req.body.title, tags, req.body.post );
		console.log(post);

		post.save(function(err){
			if (err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发布成功！');
			res.redirect('/');
		});
	})

	app.get('/archive',function(req,res){
		Post.getArchive(function(err,posts){
			if (err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('archive',{
				title:'存档',
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		})
	})

	app.get('/tags',function(req,res){
		Post.getTags(function(err,posts){
			if (err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tags',{
				title:'标签',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		})
	})

	app.get('/tags/:tag',function(req,res){
		Post.getTag(req.params.tag, function(err, posts){
			if (err) {
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tag', {
				title: 'TAG:' + req.params.tag,
				posts : posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		})
	})

	app.get('/links', function(req, res){
		res.render('links', {
			title: '友情链接',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});

}



function checkLogin(req,res,next){
	if (!req.session.user){
		req.flash('error','未登录');
		res.redirect('/login');
	}
	next();
}

function checkNotLogin(req,res,next){
	if (req.session.user){
		req.flash('error','已登录！');
		res.redirect('back');
	}
	next();
}

module.exports = router;












































