var Song = function(options)
{
	if(options === undefined)
	{
		options = {};
	}

	var my = this;

	my.name   = options.name || 'untitled';
	my.tracks = options.tracks || [
		new Track({name: 'lead'}),
		new Track({name: 'verse'}),
		new Track({name: 'chorus'})
	];

	my.history  = options.history || new History();

	my.segments = {};

	my.addTrack = function()
	{
		my.tracks.push(new Track({name: '(unnamed)'}));
		return my.tracks.length - 1;
	};

	my.addSegmentAt = function(track, measure, length)
	{
		if(!my.segments[track])my.segments[track] = {};
		my.segments[track][measure] = length;
	};

	my.removeSegmentAt = function(track, measure)
	{
		delete my.segments[track][measure];
	};

	my.serialize = function(options)
	{
		if(options === undefined)
		{
			options = {};
		}

		var tracks = [];
		for(var t in my.tracks)
		{
			tracks.push(my.tracks[t].preSerialize());
		}

		var obj = {
			tracks: tracks,
			activeTrack: this.activeTrack,
			name: my.name,
			segments: my.segments
		};

		if(options.history !== false)
		{
			obj.history = my.history.preSerialize();
		}

		return JSON.stringify(obj);
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

function constructify(constructor, object)
{
	var instance = new constructor(object);
	for(var i in object)
	{
		instance[i] = object[i];
	}
	return instance;
}

function decodeAs(constructor, json)
{
	var object = JSON.parse(json);
	return constructify(constructor, object);
};

Song.deserialize = function(json)
{
	var song = decodeAs(Song, json);

	for(var t in song.tracks)
	{
		song.tracks[t] = constructify(Track, song.tracks[t]);
		song.tracks[t].history = constructify(History, song.tracks[t].history);
		if(song.history)
		{
			song.history = constructify(History, song.history);
		}
	}

	return song;
};