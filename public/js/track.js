var Track = function(options)
{
	var my = this;

	my.config = {};

	my.config.name = options.name;
	my.config.measureCount = options.measureCount || 4;
	my.config.beatsPerMeasure = options.beatsPerMeasure || 4;
	my.config.notesPerBeat = options.notesPerBeat || 4;
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
								my.playSound(freq, duration);
							};
						})(freq, duration);

						var handle = setTimeout(play, noteTime);
						my.handles.push(handle);
					}
				}
			}
		}
	};

	my.playSound  = function(freq, duration)
	{
		//console.log("Playing sound at ", freq+"Hz", "for", duration+"ms");

		var instrument = new TestStrument(audioContext);

		var killNode = getKillNode(audioContext, function(kill){
			instrument.clean();
			kill.disconnect();
		});

		instrument.getOutput().connect(killNode);
		killNode.connect(audioContext.destination);

		instrument.play(freq, duration);

		setTimeout(function(){
			instrument.stop();
		}, duration);

	};

	my.octaveCount = function()
	{
		return my.maxOctave - my.minOctave + 1;
	}

};