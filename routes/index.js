var express = require('express');
var router = express.Router();
var User = require('../models/user');
var UserImage = require('../models/userImage');
var OtherInfo = require('../models/otherInfo');
const multer = require("multer");
var nodemailer = require('nodemailer');
const reader = require('xlsx')
var fs = require('fs');

router.get('/', function (req, res, next) {
	return res.render('index.ejs');
});


router.post('/', function (req, res, next) {
	var personInfo = req.body;


	if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({ email: personInfo.email }, function (err, data) {
				if (!data) {
					var c;
					User.findOne({}, function (err, data) {

						if (data) {
							c = data.unique_id + 1;
						} else {
							c = 1;
						}

						var newPerson = new User({
							unique_id: c,
							email: personInfo.email,
							username: personInfo.username,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf
						});

						newPerson.save(function (err, Person) {
							if (err)
								console.log(err);
							else
								console.log('Registerd Successfully');
						});

					}).sort({ _id: -1 }).limit(1);
					res.send({ "Success": "You are regestered,You can login now." });
				} else {
					res.send({ "Success": "Email is already used." });
				}

			});
		} else {
			res.send({ "Success": "password is not matched" });
		}
	}
});

router.get('/login', function (req, res, next) {
	return res.render('login.ejs');
});

router.post('/login', function (req, res, next) {
	User.findOne({ email: req.body.email }, function (err, data) {
		if (data) {

			if (data.password == req.body.password) {
				req.session.userId = data.unique_id;
				res.send({ "Success": "Success!" });

			} else {
				res.send({ "Success": "Wrong password!" });
			}
		} else {
			res.send({ "Success": "This Email Is not regestered!" });
		}
	});
});

router.get('/profile', function (req, res, next) {
	User.findOne({ unique_id: req.session.userId }, function (err, data) {
		if (!data) {
			res.redirect('/');
		} else {
			UserImage.findOne({ user_id: req.session.userId }, function (err, imageData) {
				if (imageData) {
					req.session.file_name = imageData.file_name;
					req.session.username = data.username;
					OtherInfo.findOne({ users: data._id }, function (othererr, otherData) {
						if (otherData) {
							req.session.file_name = imageData.file_name;
							req.session.username = data.username;
							return res.render('data.ejs', { "name": data.username, "email": data.email, "filePath": imageData.file_name, "address": otherData.address, "phone": otherData.phone, "postalcode": otherData.postalcode });
						} else {
							req.session.file_name = "";
							req.session.username = data.username;
							return res.render('data.ejs', { "name": data.username, "email": data.email, "filePath": imageData.file_name, "address": "N/A", "phone": "N/A", "postalcode": "N/A" });
						}
					});
				} else {
					req.session.file_name = "";
					req.session.username = data.username;
					OtherInfo.findOne({ users: data._id }, function (othererr, otherData) {
						if (otherData) {
							req.session.file_name = "";
							req.session.username = data.username;
							return res.render('data.ejs', { "name": data.username, "email": data.email, "filePath": "", "address": otherData.address, "phone": otherData.phone, "postalcode": otherData.postalcode });
						} else {
							req.session.file_name = "";
							req.session.username = data.username;
							return res.render('data.ejs', { "name": data.username, "email": data.email, "filePath": "", "address": "N/A", "phone": "N/A", "postalcode": "N/A" });
						}
					});
				}

			});
		}
	});
});

router.get('/uploadImage', function (req, res, next) {
	UserImage.findOne({ user_id: req.session.userId }, function (err, data) {
		if (!data) {
			return res.render('uploadImage.ejs', { "filePath": "", "name": req.session.username, "filePath": req.session.file_name });
		} else {
			return res.render('uploadImage.ejs', { "filePath": data.file_name, "name": req.session.username, "filePath": req.session.file_name });
		}
	});
});

router.get('/logout', function (req, res, next) {
	if (req.session) {
		// delete session object
		req.session.destroy(function (err) {
			if (err) {
				return next(err);
			} else {
				return res.redirect('/login');
			}
		});
	}
});
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'jimmyantech@gmail.com',
		pass: 'tczglejsetfwehpa'
	}
});

var mailOptions = {
	from: 'jimmyantech@gmail.com',
	to: 'jimmy.kumar@antiersolutions.com',
	subject: 'Sending Email using Node.js',
	text: 'That was easy!'
};

router.get('/forgetpass', function (req, res, next) {
	res.render("forget.ejs", { "name": req.session.username, "filePath": req.session.file_name });
});

router.post('/forgetpass', function (req, res, next) {
	User.findOne({ email: req.body.email }, function (err, data) {
		if (!data) {
			res.send({ "Success": "This Email Is not regestered!" });
		} else {
			// res.send({"Success":"Success!"});
			if (req.body.password == req.body.passwordConf) {
				data.password = req.body.password;
				data.passwordConf = req.body.passwordConf;
				data.save(function (err, Person) {
					if (err)
						console.log(err);
					else {
						mailOptions.to = req.body.email;
						mailOptions.subject = "Your password changed";
						mailOptions.text = "Password changed to = " + req.body.password;
						transporter.sendMail(mailOptions, function (error, info) {
							if (error) {
								console.log(error);
							} else {
								console.log('Email sent: ' + info.response);
							}
						});
					}
					res.send({ "Success": "Password changed!" });
				});
			} else {
				res.send({ "Success": "Password does not matched! Both Password should be same." });
			}
		}
	});

});

// SET STORAGE

var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './uploads');
	},
	filename: function (req, file, callback) {
		let fileName = Date.now() + '-' + file.originalname;
		callback(null, fileName);
		UserImage.findOne({ user_id: req.session.userId }, function (err, res, data) {
			if (res === null) {
				data = new UserImage();
				data.file_name = fileName;
				data.original_name = file.originalname;
				data.user_id = req.session.userId;
				data.folder_name = "uploads";
				data.save(function (err, Person) {
					if (err)
						console.log(err);
					else {
						console.log('Success');
					}
				});
			} else {
				UserImage.updateOne({ _id: res._id }, { "file_name": fileName, "original_name": file.originalname }).then((response) => {
					res.status(200).send(response);
				}).catch((err) => {
					console.log("Not Record Found")
				})
			}
		});
	}
});

var upload = multer({ storage: storage }).single('userPhoto');

router.post('/api/photo', function (req, res) {
	upload(req, res, function (err) {
		if (err) {
			return res.end("Error uploading file.");
		}
		return res.redirect('/profile');
	});
});

router.get('/updateprofile', function (req, res, next) {
	User.findOne({ unique_id: req.session.userId }, function (err, data) {
		if (!data) {
			OtherInfo.findOne({ unique_id: req.session.userId }, function (othererr, otherdata) {
				if (!otherdata) {
					return res.render('updateProfile.ejs', { "username": "", "email": "", "name": req.session.username, "filePath": req.session.file_name, "address": "", "phone": "", "postalcode": "" });
				} else {
					return res.render('updateProfile.ejs', { "username": "", "email": "", "name": req.session.username, "filePath": req.session.file_name, "address": otherdata.address, "phone": otherdata.phone, "postalcode": otherdata.postalcode });
				}
			});
		} else {
			OtherInfo.findOne({ users: data._id }, function (othererr, otherdata) {
				if (!otherdata) {
					return res.render('updateProfile.ejs', { "username": data.username, "email": data.email, "name": req.session.username, "filePath": req.session.file_name, "address": "", "phone": "", "postalcode": "" });
				} else {
					return res.render('updateProfile.ejs', { "username": data.username, "email": data.email, "name": req.session.username, "filePath": req.session.file_name, "address": otherdata.address, "phone": otherdata.phone, "postalcode": otherdata.postalcode });
				}
			});
		}
	});
});

router.post('/updateprofile', function (req, res, next) {
	User.findOne({ unique_id: req.session.userId }, function (err, data) {
		if (!data) {
			res.send({ "Success": "This Email Is not regestered!" });
		} else {
			User.updateOne({ _id: data._id }, { "email": req.body.email, "username": req.body.username, "address": req.body.address, "phone": req.body.phone, "postalcode": req.body.postalcode }).then((response) => {
				res.status(200).send(response);
			}).catch((err) => {
				res.status(400).send("Not Record Found")
			});

		}

		OtherInfo.findOne({ unique_id: req.session.userId }, function (err, otherdata) {
			if (!otherdata) {
				otherdata = new OtherInfo();
				otherdata.users = data._id;
				otherdata.address = req.body.address;
				otherdata.phone = req.body.phone;
				otherdata.postalcode = req.body.postalcode;
				otherdata.save(function (err, Person) {
					if (err)
						console.log(err);
					else {
						console.log('Success');
					}
				});
			} else {
				// update other info
				OtherInfo.updateOne({ unique_id: req.session.userId }, { "address": req.body.address, "phone": req.body.phone, "postalcode": req.body.postalcode }).then((response) => {
					console.log("Update");
				}).catch((err) => {
					console.log("Not Record Found")
				});
			}
		});
	});


});

router.post('/sendmail', function (req, res, next) {
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
			res.status(200).send(info);
		}
	});
});

router.get('/userlist', function (req, res, next) {
	var perPage = 4
	var page = req.query.page || 1
	var concatdata = [];
	User
		.find({})
		.skip((perPage * page) - perPage)
		.limit(perPage)
		.exec(function (err, data) {
			User.count().exec(function (err, count) {
				if (err) return next(err)
				OtherInfo.find(function (oerr, otherdata) {
					data.forEach(element => {
						var _othd = otherdata.find(d => d.users.toString() == element._id.toString());
						var obj = new Object();
						obj.id = element._id;
						obj.email = element.email;
						obj.username = element.username;
						obj.address = _othd ? _othd.address : "N/A";
						obj.phone = _othd ? _othd.phone : "N/A";
						obj.postalcode = _othd ? _othd.postalcode : "N/A";
						concatdata.push(obj);
					});
					res.render('userlist.ejs', {
						data: concatdata,
						current: page,
						name: req.session.username,
						filePath: req.session.file_name,
						pages: Math.ceil(count / perPage),
						count: count
					})
				})
			})
			// User.find(function (err, data) {
			// 	if (!data) {
			// 		res.redirect('/');
			// 	} else {
			// 		OtherInfo.find(function (oerr, otherdata) {
			// 			var concatdata = [];
			// 			data.forEach(element => {
			// 				var _othd = otherdata.find(d => d.users.toString()==element._id.toString());
			// 				var obj = new Object();
			// 				obj.id = element._id;
			// 				obj.email = element.email;
			// 				obj.username = element.username;
			// 				obj.address = _othd ? _othd.address : "N/A";
			// 				obj.phone = _othd ? _othd.phone : "N/A";
			// 				obj.postalcode = _othd ? _othd.postalcode : "N/A";
			// 				concatdata.push(obj);
			// 			});
			// 			return res.render('userlist.ejs', { "data": concatdata, "name": req.session.username, "filePath": req.session.file_name });
			// 		});
			// 	}
			// }).sort({ _id: -1 });
		});
	});

	router.post('/import', function (req, res, next) {
		User.find(function (err, data) {
			if (!data) {
				res.redirect('/');
			} else {
				OtherInfo.find(function (oerr, otherdata) {
					var concatdata = [];
					data.forEach(element => {
						var _othd = otherdata.find(d => d.users.toString() == element._id.toString());
						var obj = new Object();
						obj.email = element.email;
						obj.username = element.username;
						obj.address = _othd ? _othd.address : "N/A";
						obj.phone = _othd ? _othd.phone : "N/A";
						obj.postalcode = _othd ? _othd.postalcode : "N/A";
						concatdata.push(obj);
					});
					const file = reader.readFile('./uploads/test.xlsx')
					const ws = reader.utils.json_to_sheet(concatdata)
					reader.utils.book_append_sheet(file, ws, "mysheet" + Math.random(0, 5))
					// Writing to our file
					reader.writeFile(file, './uploads/test.xlsx');
					res.send(otherdata)
				});
			}
		}).sort({ _id: -1 });
	});

	router.get('/profileDetail', function (req, res, next) {
		User.findOne({ _id: req.query.id }, function (err, data) {
			if (!data) {
				res.redirect('/');
			} else {
				UserImage.findOne({ user_id: data.unique_id }, function (err, imageData) {
					if (imageData) {
						OtherInfo.findOne({ users: data._id }, function (othererr, otherData) {
							if (otherData) {
								return res.render('profileDetail.ejs', { "name": req.session.username, "detailname": data.username, "email": data.email, "image_profile": imageData.file_name, "filePath": req.session.file_name, "address": otherData.address, "phone": otherData.phone, "postalcode": otherData.postalcode });
							} else {
								return res.render('profileDetail.ejs', { "name": req.session.username, "detailname": data.username, "email": data.email, "image_profile": imageData.file_name, "filePath": req.session.file_name, "address": "N/A", "phone": "N/A", "postalcode": "N/A" });
							}
						});
					} else {
						OtherInfo.findOne({ users: data._id }, function (othererr, otherData) {
							if (otherData) {
								return res.render('profileDetail.ejs', { "name": req.session.username, "detailname": data.username, "email": data.email, "image_profile": "", "filePath": req.session.file_name, "address": otherData.address, "phone": otherData.phone, "postalcode": otherData.postalcode });
							} else {
								return res.render('profileDetail.ejs', { "name": req.session.username, "detailname": data.username, "email": data.email, "image_profile": "", "filePath": req.session.file_name, "address": "N/A", "phone": "N/A", "postalcode": "N/A" });
							}
						});
					}

				});
			}
		});
	});

	router.post('/deleteProfile', function (req, res, next) {
		User.deleteOne({ _id: req.body.id }, function (err, data) {
			if (err) {
				res.send(err);
			} else {
				res.send(data);
			}
		});
	});

	module.exports = router;