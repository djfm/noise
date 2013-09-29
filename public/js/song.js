var Song = function(options)
{
	if(options === undefined)
	{
		options = {};
	}

	var my = this;

	my.name   = options.name || 'untitled';
	my.tracks = options.tracks || {
		'lead': new Track({name: 'lead'}),
		'verse': new Track({name: 'verse'}),
		'chorus': new Track({name: 'chorus'})
	};

	my.serialize = function()
	{
		return JSON.stringify(this);
	};

	my.getMeasureCount = function()
	{
		return 120;
	};

	my.getTrackCount = function()
	{
		return Object.keys(my.tracks).length;
	};

	my.getTrackConfigs = function()
	{
		var configs = [];

		for(var i in my.tracks)
		{
			configs.push(my.tracks[i].config);
		}

		return configs;
	};
};

Song.deserialize = function(json)
{
	var s = new Song({});

	var songObj = JSON.parse(json);

	for(var p in songObj)
	{
		s[p] = songObj[p];
	}

	for(var t in s.tracks)
	{
		var trackObj = s.tracks[t];
		s.tracks[t] = new Track({});

		for(var p in trackObj)
		{
			s.tracks[t][p] = trackObj[p];
		}
	}

	return s;
};