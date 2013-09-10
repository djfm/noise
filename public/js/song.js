var Song = function(options)
{
	var my = this;

	my.tracks = options.tracks;

	my.serialize = function()
	{
		return JSON.stringify(this);
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