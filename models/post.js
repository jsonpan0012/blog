var mongodb   = require('./db');
var markdown  = require('markdown').markdown;
function Post(name,title,tags,post){
	this.name  = name;
	this.title = title;
	this.tags  = tags;
	this.post  = post;
}

module.exports = Post;


Post.prototype.save = function(callback){
	var date = new Date();
	//存储各种时间格式，方便以后扩展
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}

	//要存入数据库的文档
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],	
		pv:0
	}

	//打开数据库
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			collection.insert(post,{safe: true},function(err){
				mongodb.close();
				if (err){
					return classback(err);
				}
				callback(null);
			})
		});
	});
}

//读取文章及其相关信息
Post.getTen = function(name,page,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if (err){
			return callback(err);l
		}
		//读取 posts 集合
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if (name){
				query.name = name;
			}
			//使用count返回特定查询的文档数
			collection.count(query,function(err,total){
				//根据 query 对象查询，并跳过前（page-1）*10个结果，返回之后的10个结果
				collection.find(query,{
					skip:(page-1)*10,
					limit:10
				}).sort({
					time:-1
				}).toArray(function(err,docs){
					mongodb.close();
					if (err){
						return callback(err);
					}
					//解析 markdown 为 html
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null,docs,total);
				});
			});
		});
	});
}

//获取一片文章
Post.getOne = function(name ,day, title, callback){
	//打开数据库
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}

		//读取posts集合
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名、发表日期及文章名进行查询
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			},function(err,doc){
				if (err){
					mongodb.close();
					return callback(err);
				}
				//解析 markdown 为html
				if (doc){
					//每次访问，pv值增加1
					collection.update({
						"name": name,
						"time.day": day,
						"title":title
					},{
						$inc:{"pv":1}
					},function(err){
						mongodb.close();
						if (err){
							return callback(err);
						}
					})

					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content = markdown.toHTML(comment.content);
					})
				}
				callback(null,doc);//返回查询的一片文章
			})
		})
	});
}

//返回原始发表内容（markdown 格式）
Post.edit = function(name,day,title,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名、发表日期、及文章名进行查询
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title,
			},function(err,doc){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null,doc);
			});
		});
	});
}

//提交修改
Post.update = function(name,day,title,post,callback){
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//更新文章内容
			collection.update({
				"name": name,
				"time.day": day,
				"title": title,
			},{
				$set:{post:post}
			},function(err){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null);
			})
		});
	});
}

//删除一篇文章
Post.remove = function(name,day,title,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}

			//根据用户名，日期和标题查找并删除一篇文章
			collection.remove({
				"name": name,
				"time.day": day,
				"title":title
			},{
				w:1
			},function(err){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Post.getArchive = function(callback){
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}
		//读取 posts 集合
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//返回只包含 name、time,title 属性的文档组成的存档数组
			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null,docs);
			})
		})
	});
}

//返回所有标签
Post.getTags = function(callback){
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值
			collection.distinct("tags",function(err,docs){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
}

Post.getTag = function(tag, callback){
	mongodb.open(function(err,db){
		if (err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//查询所有tags数组包含的 tag 的文档
			//并返回只含有name、time、title组成的数组
			collection.find({
				"tags":tag
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null,docs);
			})
		})
	})
}

Post.getTags = function(callback){
	mongodb.open(function(err, db){
		if (err){
			return callback(err);
		}
		db.collection('posts', function(err, collection){
			if (err){
				mongodb.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值
			collection.distinct("tags", function(err,docs){
				mongodb.close();
				if (err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
}

Post.search = function(keyword, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts', function(err,collection){
			if (err){
				mongodb.close();
			}
			var pattern = new RegExp(keyword,"i");
			collection.find({
				"title": pattern
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time: -1
			}).toArray(function (err, docs){
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null,docs);
			})
		})
	})
}





































