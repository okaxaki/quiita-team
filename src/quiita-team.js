(function(definition){
	if (typeof exports === "object") {
		module.exports = definition();
	} else if (typeof define === "function" && define.amd) {
		define(definition);
	} else {
		QuiitaTeam = definition();
	}
})(function(){
	"use strict";

	var fs = require('fs-extra');
	var path = require('path');
	var HTML_EXT = '.html';

	function _each(map, f) {
		for(var key in map) {
			f(key, map[key]);
		}
	}

	function _loadTemplates(fromDir) {
		var files = fs.readdirSync(fromDir);
		var result = [];
		files.forEach(function(file){
			var m = file.match(/^(.*)-tmpl\.html$/);
			if(m) {
				var abs = path.resolve(fromDir,file);
				result[m[1]] = fs.readFileSync(abs,'utf-8');
			}
		});
		return result;
	}

	function _tagToFile(name) {
		return "tag-" + encodeURIComponent(name).replace(/%/g,'_') + ".html";
	}

	function _userToFile(pid) {
		return "user-" + pid + ".html";
	}

	function _resolveOptions(options, defaults) {
		var result = {}
		for(var key in defaults) {
			result[key] = defaults[key];
		}
		for(var key in options) {
			result[key] = options[key];
		}
		return result;
	}

	function _resolveMentionLink(html, userId2Pid) {
		return html.replace(/<a (.*)href=(["'"])\/(\w+)\2(.*)>@(\w+?)<\/a>/g, function(m,pre,q,id,post,name) {
			var pid = userId2Pid(id);
			if(pid) {
				return "<a " + pre + "href=" + q + _userToFile(pid) + q + post + ">@" + name + "</a>";
			}
			return '@' + name;
		});
	}

	function _resolveInterArticleLink(html) {
		return html.replace(/https?:\/\/.*?\.qiita.com\/.+?\/items\/([\w]+)/g, function(m,p) {
			return p + HTML_EXT;
		});
	}

	function _toLocalFileName(url) {
		return 'files/' + url.match(/[^\/]+$/)[0];
	}

	function _resolveFileLink(html, fileMap) {
		return html.replace(/(["'])https?:\/\/.+?\.qiita.com\/files\/.+?\1/g, function(m) {
			var url = m.substr(1,m.length-2);
			var file = _toLocalFileName(url);
			if(fileMap) { fileMap[url] = file; }
			return file;
		});
	}

	function _toLocalImageName(url) {
		var m = url.match(/^https?:\/\/(qiita-image-store\.s3\.amazonaws\.com|.*?.amazonaws\.com\/qiita-image-store)\/([^?]+)/);
		if(m) {
			return 'images/' + m[2].replace(/[\/]/g,'_');	
		} else {
			return url;
		}
	}

	function _resolveImageLink(html, imageMap) {
		return html.replace(/(["'])https?:\/\/(qiita-image-store\.s3\.amazonaws\.com|.*?.amazonaws\.com\/qiita-image-store)\/.+?\1/g, function(m){
			var url = m.substr(1,m.length-2);
			var file = _toLocalImageName(url);
			if(imageMap) { imageMap[url] = file; }
			return file;
		});
	}

	function _resolveVariable(tmpl,map) {
		return tmpl.replace(/(\$\{.+?\})/g, function(m) {
			var path = m.substr(2,m.length-3).split('.');
			var ret = null;
			var key = path.shift();
			while(key!=null) {
				if(ret == null) {
					ret = map[key];
				} else {
					ret = ret[key];
				}
				key = path.shift();
			}
			return ret?ret:'';
		});
	}

	var Q = function(data, options) {
		this.options = _resolveOptions(options, { 
			outdir: path.resolve(process.cwd(), 'qiita-team-html'),
			templateDir: path.resolve(__dirname, '../tmpl')
		});		
		this.templates = _loadTemplates(this.options.templateDir);
		this.json = JSON.parse(data, 'utf-8');			
	};

	Q.prototype = {

		ensureDirectories:function() {
			fs.mkdirsSync(this.options.outdir);
			fs.mkdirsSync(this.options.outdir + '/files');
			fs.mkdirsSync(this.options.outdir + '/images');
		},

		prepareData: function() {

			this.articles = this.json.articles.sort(function(a,b){
				return b.created_at.localeCompare(a.created_at);
			});
			this.projects = this.json.projects.sort(function(a,b){
				return b.created_at.localeCompare(a.created_at);				
			});

			/** Build {tag,user} to article map and make profile image url local. */			
			var self = this;
			this.articles.forEach(function(article) {

				function makeUserProfileImageLocal(user) {
					var src = user.profile_image_url;
					var dst = src;
					var m ;
					if(src.match(/^https?:\/\/qiita-image-store\.s3\.amazonaws\.com\/.+$/)) {
						dst = _toLocalImageName(src);
					}
					if(src!=dst) {
						self.imageMap[src] = dst;
					}
				}

				if(!self.user2articles[article.user.permanent_id]) {
					self.user2articles[article.user.permanent_id] = [];
					self.users.push(article.user);
				}

				self.user2articles[article.user.permanent_id].push(article);
				self.userID2PID[article.user.id] = article.user.permanent_id;
				self.userPID2ID[article.user.permanent_id] = article.user.id;

				makeUserProfileImageLocal(article.user);

				article.comments.forEach(function(comment) {
					makeUserProfileImageLocal(comment.user)
				});

				article.tags.forEach(function(tag){
					if(!self.tag2articles[tag.name]) {
						self.tag2articles[tag.name] = [];
						self.tags.push(tag);
					}
					self.tag2articles[tag.name].push(article);
				});

			});

		},

		compileTemplate: function(name, object) {
			var tmpl = this.templates[name];
			if(!tmpl) throw new Error('Template not found: ' + name);
			var html = _resolveVariable(tmpl, object);
			var self = this;
			html = _resolveMentionLink(html, function(id){ return self.userID2PID[id]; })
			html = _resolveInterArticleLink(html);
			html = _resolveImageLink(html, this.imageMap);
			html = _resolveFileLink(html, this.fileMap);
			return html;
		},

		generateArticleIndexHtml: function(filename, articles, title, users, tags) {
			var buf = [];
			var self = this;
			articles.forEach(function(article) {
				buf.push(self.compileTemplate('index-item', article));
			});
			var html = '<table>' + buf.join('\n') + '</table>';
			fs.writeFileSync(path.resolve(this.options.outdir,filename), this.compileTemplate('index', {
				title:title, 
				num_article:articles.length, 
				tag_cloud:this.createTagCloudHtml(tags),
				user_cloud:this.createUserCloudHtml(users),
				body:html
			}));
		},

		generateProjectIndexHtml: function(filename, projects, title) {
			var buf = [];
			var self = this;
			projects.forEach(function(project) {
				buf.push(self.compileTemplate('project-index-item', project));
			});
			var html = '<table>' + buf.join('\n') + '</table>';
			fs.writeFileSync(path.resolve(this.options.outdir,filename), this.compileTemplate('project-index', {
				title:title, 
				num_project:projects.length, 
				body:html
			}));
		},

		createCommentsHtml: function(comments) {
			var buf = [];
			if(comments) {
				var self = this;
				comments.forEach(function(comment) {
					buf.push(self.compileTemplate('article-comment', comment));
				});
			}
			return buf.join('\n');
		},

		createTagCloudHtml: function(tags) {
			var ret = '';
			if(tags) {
				var self = this;
				tags.forEach(function(tag) {
					var file = _tagToFile(tag.name);
					ret += '<a href="' + file + '">' + tag.name + '(' + (self.tag2articles[tag.name]?self.tag2articles[tag.name].length:0) + ')</a> ';
				});
			}
			return ret;
		},

		createUserCloudHtml: function(users) {
			var ret = '';
			if(users) {
				users.forEach(function(user){
					ret += '<a href="' + _userToFile(user.permanent_id) + '">' + user.id + "</a> ";
				});
			}
			return ret;
		},

		generateArticleHtml: function(filename, article) {
			var html = this.compileTemplate('article', {
				title:article.title,
				rendered_body:article.rendered_body, 
				user:article.user,
				created_at:article.created_at,
				tag_cloud:this.createTagCloudHtml(article.tags),
				comments:this.createCommentsHtml(article.comments)
			});
			fs.writeFileSync(path.resolve(this.options.outdir, filename), html);
		},

		generateProjectHtml: function(filename, project) {
			var html = this.compileTemplate('project', {
				name:project.name,
				rendered_body:project.rendered_body, 
				user:project.user,
				created_at:project.created_at,
				comments:this.createCommentsHtml(project.comments)
			});
			fs.writeFileSync(path.resolve(this.options.outdir, filename), html);
		},

		generateHtml:function() {
			this.imageMap = {};
			this.fileMap = {};
			this.entries = [];
			this.user2articles = {};
			this.tag2articles = {};
			this.tags = [];
			this.users = [];
			this.userID2PID = {};
			this.userPID2ID = {};

			this.ensureDirectories();
			this.prepareData();

			var self = this;

			_each(this.tag2articles, function(name) {
				self.generateArticleIndexHtml(_tagToFile(name), self.tag2articles[name], name);
			});

			_each(this.user2articles, function(pid) {
				self.generateArticleIndexHtml(_userToFile(pid), self.user2articles[pid], self.userPID2ID[pid] + 'の記事');
			});

			this.articles.forEach(function(article){
				self.generateArticleHtml(article.id + HTML_EXT, article);
			});

			this.generateArticleIndexHtml('index.html', this.articles, 'すべての記事', this.users, this.tags);

			this.projects.forEach(function(project){ 
				self.generateProjectHtml("project-" + project.id + HTML_EXT, project); 
			});
			
			this.generateProjectIndexHtml("project.html", this.projects, 'プロジェクト');

		},

		downloadAssets:function() {

			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

			var http = require('https');
			var headers = {};
			if(this.options.cookie) {
				headers = { 'Cookie':this.options.cookie };
			}
			var targets = [];

			for(var key in this.imageMap) {
				targets.push({url:key,file: path.resolve(this.options.outdir, this.imageMap[key])});
			}
			for(var key in this.fileMap) {
				targets.push({url:key,file: path.resolve(this.options.outdir, this.fileMap[key])});
			}

			function downloadNext() {

				if(0<targets.length) {
					var target = targets.shift();
					var url = target.url;
					var file = target.file; 

					if(fs.existsSync(file)) {
						console.log('[' + targets.length + '] ' + url);
						console.log(' ... already downloaded.');
						downloadNext();
						return;
					}

					console.log('[' + targets.length + '] ' + url);

					if(file) {
						var u = require('url').parse(url);
						var options = {
							protocol: u.protocol,
							hostname: u.hostname,
							path: u.path,
							headers: headers
						};

						var req = http.get(options, function(res) {
							if(res.statusCode==200) {
								var ws = fs.createWriteStream(file);
								res.pipe(ws);
								res.on('end', function() {
									console.log("->" + file);
									downloadNext();
								});
							} else {
								res.on('data', function(chunk) {
								});
								res.on('end', function() {
									console.log("Failed to download asset (StatusCode:" + res.statusCode + "). Make sure your login cookie is given and valid.");
									downloadNext();
								});
							}

						});
						req.on('error', function(e) {
							console.log('Failed to download asset: ', e);
						});
					} else {
						console.log('Invalid url:' + url);
					}
				}
			}

			downloadNext();

		},		

	};

	return Q;
});

