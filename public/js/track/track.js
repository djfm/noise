var Track = function(options)
{
	var my = this;

	my.config = {};

	my.config.name = options.name;
	my.config.measureCount = options.measureCount || 4;
	my.config.beatsPerMeasure = options.beatsPerMeasure || 4;
	my.config.notesPerBeat = options.notesPerBeat || 8;
	my.config.maxOctave = options.maxOctave || 8;
	my.config.minOctave = options.minOctave || 0;

	my.history = options.history || new History();

	my.history.onRecord = function()
	{
		$('div.pattern-history.selected').removeClass('selected');
	};

	my.notes = {};

	my.config.instrument = options.instrument;

	my.addNoteAt = function(pos, semitone, len)
	{
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

	my.prepare = function(segments, startAt, measureDuration)
	{
		my.forEachNote(segments, startAt, measureDuration, function(freq, msDuration, msWhen){
			var instrument = getInstrument(my.config.instrument);
			if(instrument.prepare)
			{
				instrument.prepare(audioContext, freq, msDuration, msWhen);
			}
		});
	};

	my.play = function(segments, startAt, measureDuration)
	{
		my.handles = [];
		my.forEachNote(segments, startAt, measureDuration, function(freq, msDuration, msWhen){
			var play   = (function(freq, msDuration){
				return function(){
					my.playSound(freq, msDuration);
				};
			})(freq, msDuration);

			var handle = setTimeout(play, msWhen);
			my.handles.push(handle);
		});
	};

	my.forEachNote = function(segments, startAt, measureDuration, callback)
	{	

		var noteDuration = measureDuration/(my.config.beatsPerMeasure*my.config.notesPerBeat);

		for(var s in segments)
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

						callback(freq, duration, noteTime);
					}
				}
			}
		}
	};

	my.stop = function()
	{
		for(var i in my.handles)
		{
			clearTimeout(my.handles[i]);
		}

		my.handles = [];
	};

	my.playSound  = function(freq, duration)
	{

		var instrument = new (getInstrument(my.config.instrument))(audioContext);

		instrument.getOutput().connect(audioContext.destination);		

		instrument.play(freq, duration);

		setTimeout(function(){
			instrument.stop();
		}, duration);
	};

	my.octaveCount = function()
	{
		return my.config.maxOctave - my.config.minOctave + 1;
	}

	my.preSerializeConfig = function()
	{
		var config = {};
		for(var i in my.config)
		{
			if(!/^\$\$/.exec(i))
			{
				config[i] = my.config[i];
			}
		}

		return config;
	};

	my.preSerialize = function()
	{
		return {notes: my.notes, config: my.preSerializeConfig(), history: my.history.preSerialize()};
	};

};