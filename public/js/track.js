var Track = function(options)
{
	var my = this;

	my.name = options.name;
	my.measureCount = options.measureCount || 4;
	my.beatsPerMeasure = options.beatsPerMeasure || 4;
	my.notesPerBeat = options.notesPerBeat || 4;
	my.maxOctave = options.maxOctave || 8;
	my.minOctave = options.minOctave || 0;

	my.segments = {};

	my.canAddSegmentAt = function(i, len)
	{
		if(len === undefined)len = my.measureCount;

		for(var s in my.segments)
		{
			s = parseInt(s);
			var slen = my.segments[s];

			if((i < s + slen) && (s < i + len))
			{
				return false;
			}
		}

		return true;
	};

	my.addSegmentAt = function(i, len)
	{
		if(len === undefined)len = my.measureCount;
		my.segments[i] = len;
	};

	my.removeSegmentAt = function(i)
	{
		delete my.segments[i];
	};
};