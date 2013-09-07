var express    	= require('express'),
	winston    	= require('winston'),
	cons 		= require('consolidate'),
	fs			= require('fs');

var app     = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	/*cons.mustache(__dirname + '/views/index.html', {}, function(err, html){
		if(err) throw err;
		res.send(html);
	});*/
	res.sendfile(__dirname + '/views/index.html');
});

app.get('/track', function(req, res){
	res.sendfile(__dirname + '/views/track.html');
});

app.listen(7654);