var express = require('express');
var router = express.Router();
var User = require('../models/user');
var UserImage = require('../models/userImage');
const multer = require("multer");
var nodemailer = require('nodemailer');

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
					req.session.file_name=imageData.file_name;
					req.session.username=data.username;
					return res.render('data.ejs', { "name": data.username, "email": data.email, "filePath": imageData.file_name });
				} else {
					req.session.file_name="";
					req.session.username=data.username;
					return res.render('data.ejs', { "name": data.username, "email": data.email, "filePath": "" });
				}

			});
		}
	});
});

router.get('/uploadImage', function (req, res, next) {
	UserImage.findOne({ user_id: req.session.userId }, function (err, data) {
		if (!data) {
			return res.render('uploadImage.ejs', { "filePath": "" , "name": req.session.username, "filePath": req.session.file_name});
		} else {
			return res.render('uploadImage.ejs', { "filePath": data.file_name , "name": req.session.username, "filePath": req.session.file_name});
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
	res.render("forget.ejs",{"name": req.session.username, "filePath": req.session.file_name});
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
					else
					{
						mailOptions.to=req.body.email;
						mailOptions.subject="Your password changed";
						mailOptions.text="Password changed to = "+req.body.password;
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
			console.log("req.session.userId", res)
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
					res.status(400).send("Not Record Found")
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
			return res.render('updateProfile.ejs', { "username": "", "email": "", "name": req.session.username, "filePath": req.session.file_name });
		} else {
			return res.render('updateProfile.ejs', { "username": data.username, "email": data.email, "name": req.session.username, "filePath": req.session.file_name });
		}
	});
});

router.post('/updateprofile', function (req, res, next) {
	User.findOne({ unique_id: req.session.userId }, function (err, data) {
		if (!data) {
			res.send({ "Success": "This Email Is not regestered!" });
		} else {
			User.updateOne({ _id: data._id }, { "email": req.body.email, "username": req.body.username }).then((response) => {
				res.status(200).send(response);
			}).catch((err) => {
				res.status(400).send("Not Record Found")
			})
		}
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
	User.find(function (err, data) {
		if (!data) {
			res.redirect('/');
		} else {
			return res.render('userlist.ejs', { "data": data, "name": req.session.username, "filePath": req.session.file_name });
		}
	}).sort({ _id: -1 });
});


module.exports = router;