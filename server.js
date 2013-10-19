var express    		= require('express'),
	winston    		= require('winston'),
	cons 			= require('consolidate'),
	fs				= require('fs'),
	db				= require('jugglingdb'),
	passport		= require('passport'),
	LocalStrategy 	= require('passport-local').Strategy,
	bcrypt			= require('bcrypt')

/*************************/
//   Setup the database   /
/*************************/

var dbConf  = JSON.parse(fs.readFileSync(__dirname+'/db.json'));

var schema 	= new db.Schema('mysql', dbConf);

var User = schema.define('User', {
	email: 			{type: String, index: true},
	username: 		{type: String, index: true},
	joinedAt: 		Date,
	password: 		String
});

User.validatesUniquenessOf('email'		, {message: 'Email is not unique.'});
User.validatesUniquenessOf('username'	, {message: 'Username is not unique.'});

User.prototype.validPassword = function(password)
{
	return bcrypt.compareSync(password, this.password);
};

var Song = schema.define('Song', {
	name: {type: String, index: true},
	createdAt: Date,
	updatedAt: Date,
	jsonData: {type: String, dataType: 'longtext'}
});

User.hasMany(Song, {as: 'songs', foreignKey: 'userId'});
Song.belongsTo(User, {as: 'user', foreignKey: 'userId'});

schema.autoupdate();

/*************************/
// Some ORM related funcs /
/*************************/

function withSong(username, songname, callback)
{
	User.findOne({where: {username: username}}, function(err, user){
		if(user)
		{
			Song.findOne({where: {userId: user.id, name: songname}}, function(err, song){
				if(song)
				{
					callback({success: true, song: song});
				}
				else
				{
					callback({success: false, message: "No such song for user."});
				}
			});
		}
		else
		{
			callback({success: false, message: "No such user."});
		}
	});
}


/*************************/
//  Setup authentication  /
/*************************/

passport.use(new LocalStrategy(function(username, password, done){
	User.findOne({where: {username: username}}, function(err, user){
		if(err)
		{
			return done(err); }
			if (!user) {
			return done(null, false, { message: 'Incorrect username.' });
		}
		if (!user.validPassword(password))
		{
			return done(null, false, { message: 'Incorrect password.' });
		}
		return done(null, user);
	});
}));

passport.serializeUser(function(user, done){
	done(null, user.id);
});

passport.deserializeUser(function(id, done){
	User.find(id, function(err, user){
		done(err, user);
	});
});

/*************************/
//      Setup app         /
/*************************/

var app     = express();

app.use(express.limit('16mb'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret: '198FDBVSDLFHEGJ}}}}}MABYBZS'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


/*************************/
//      Setup routes      /
/*************************/

app.get('/', function(req, res){
	var params = {
		username: (req.user ? req.user.username : ''),
		listenTo: 'null'
	};
	cons.mustache(__dirname + '/views/index.html', params, function(err, html){
		if(err) throw err;
		res.send(html);
	});
});

app.get('/:user/:song/listen', function(req, res){

	withSong(req.params.user, req.params.song, function(maybeSong){
		var params = {
			username: (req.user ? req.user.username : ''),
			listenTo: (maybeSong.success ? maybeSong.song.jsonData : 'null')
		};
		cons.mustache(__dirname + '/views/index.html', params, function(err, html){
			if(err) throw err;
			res.send(html);
		});
	});
});

app.get('/synth', function(req, res){
	res.sendfile(__dirname + '/views/instrument.html');
});

app.get('/username/available/:username', function(req, res){
	User.findOne({where: {username: req.params.username}}, function(err, user){
		res.send({available: user === null});
	});
});

app.get('/email/available/:email', function(req, res){
	User.findOne({where: {email: req.params.email}}, function(err, user){
		res.send({available: user === null});
	});
});

app.post('/login', function(req, res){
	passport.authenticate('local', function(err, user, info){
		if(err)
		{
			res.send({success: false, err: err});
		}
		else if(!user)
		{
			res.send({success: false, message: 'Could not find user.'});
		}
		else
		{
			req.login(user, function(){

			});
			res.send({success: true});
		}
	})(req, res);
});

app.get('/logout', function(req, res){
	req.logout();
	res.send({success: true});
});

app.post('/register', function(req, res){
	var user = new User();

	user.email 		= req.body.email;
	user.username 	= req.body.username;
	user.joinedAt	= Date.now();
	
	bcrypt.genSalt(10, function(err, salt){
		if(err)
		{
			res.send({success: false, message: "Bcrypt could not generate salt."});
		}
		else
		{
			bcrypt.hash(req.body.password, salt, function(err, hash){
				if(err)
				{
					res.send({success: false, message: "Bcrypt could not make hash."});
				}
				else
				{
					user.password = hash;
					user.save(function(err){
						if(err)
						{
							res.send({success: false, message: "Username / email already exists (most likely cause)."});
						}
						else
						{
							req.login(user, function(){});
							res.send({success: true});
						}
					});
				}
			});
		}
	});

});

app.post('/songs', function(req, res){
	if(req.user)
	{
		Song.findOne({where: {name: req.body.name, userId: req.user.id}}, function(err, song){
			if(song === null)
			{
				song = req.user.songs.build();
				song.createdAt = Date.now();
				song.name 	   = req.body.name;
			}



			song.updatedAt 	= Date.now();
			song.jsonData 	= req.body.data;

			song.save(function(err, song){
				res.send({success: err===null});
			});
		});

	}
	else
	{
		res.send({success: false, message: 'You are not logged in!'});
	}
});

app.get('/my-songs', function(req, res){
	if(req.user)
	{
		Song.all({where: {userId: req.user.id}}, function(err, songs){
			var names = [];
			for(var s in songs)
			{
				names.push(songs[s].name);
			}
			res.send(names);
		});
	}
	else
	{
		res.send([]);
	}
});

app.get('/my-songs/:name', function(req, res){
	if(req.user)
	{
		Song.findOne({where: {userId: req.user.id, name: req.params.name}}, function(err, song){
			res.send(song);
		});
	}
	else
	{
		res.send(null);
	}
});

app.get('/:username/:song/play', function(req, res){
	User.findOne({where: {username: req.params.username}}, function(err, user){
		if(user)
		{
			Song.findOne({where: {userId: user.id, name: req.params.song}}, function(err, song){
				if(song)
				{
					var params = {
						song: song
					};
					cons.mustache(__dirname + '/views/play.html', params, function(err, html){
						if(err) throw err;
						res.send(html);
					});
				}
				else
				{
					res.send("No such song for user: "+req.params.song);
				}
			});
		}
		else
		{
			res.send("No such user: "+req.params.username);
		}
	});
});

/*************************/
//      Rock on           /
/*************************/

app.listen(7654);