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

	my.notes = {};

	my.instrument = options.instrument || new DummyInstrument();

	my.viewData = {
		penMeasuresCount: options.penMeasuresCount || 0,
		penBeatsCount: options.penBeatsCount || 1,
		penNotesCount: options.penNotesCount || 0
	};

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

	my.canAddNoteAt = function(pos, semitone, len)
	{
		if(len === undefined)len = my.notesPerBeat;

		for(var n in my.notes)
		{
			var t = parseInt(n);
			var tlen;
			if(tlen = my.notes[n][semitone])
			{
				if((pos < t + tlen) && (t < pos + len))
				{
					return false;
				}
			}
		}

		return true;
	};

	my.addNoteAt = function(pos, semitone, len)
	{
		//console.log("Adding note at", pos, semitone, "with len", len);
		
		if(len === undefined)len = my.notesPerBeat;
		if(!my.notes[pos])my.notes[pos] = {};
		my.notes[pos][semitone] = len;
	};

	my.removeNoteAt = function(pos, semitone)
	{
		//console.log("Removing note at", pos, semitone);

		if(my.notes[pos] && my.notes[pos][semitone])
		{
			delete my.notes[pos][semitone];
		}
	};

	my.play = function(startAt, measureDuration)
	{	
		my.handles = [];

		var noteDuration = measureDuration/(my.beatsPerMeasure*my.notesPerBeat);

		for(var s in my.segments)
		{
			var segmentTime = parseInt(s) * measureDuration;
			
			for(var n in my.notes)
			{
				var noteTime = segmentTime 
					+ parseInt(n) * noteDuration;

				if(noteTime >= startAt)
				{
					for(var h in my.notes[n])
					{
						var semitone = parseInt(h);
						var durationInNotes = my.notes[n][h];

						var duration = durationInNotes * noteDuration;

						var offset = semitone % 12;
						var octave = (semitone - offset) / 12;
						var freq   = NoteFreqs[NoteNames[offset]] * Math.pow(2, octave);

						//console.log("Queuing freq", freq+"Hz at", noteTime+'ms', "for", duration+'ms');
						
						var play   = (function(freq, duration){
							return function(){
								console.log(freq, duration);
							};
						})(freq, duration);

						var handle = setTimeout(play, noteTime);
						my.handles.push(handle);
					}
				}
			}
		}
	};
};