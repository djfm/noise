var Song = function(options)
{
	if(options === undefined)
	{
		options = {};
	}

	var my = this;

	my.name   = options.name || 'untitled';
	my.tracks = options.tracks || {'default': new Track({name: 'default'})};

	my.serialize = function()
	{
		return JSON.stringify(this);
	};

	my.getMeasureCount = function()
	{
		return 100;
	};

	my.getTrackCount = function()
	{
		return 10;
	}
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