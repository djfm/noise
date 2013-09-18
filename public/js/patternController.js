var PatternController = function($scope)
{
	$scope.setPattern = function(pattern)
	{
		/*
		if(!pattern.notes)
		{
			pattern.notes = {};

			for(var m=0; m<pattern.measuresCount; m++)
			{
				for(var b=0; b<pattern.beatsPerMeasure; b++)
				{
					for(var n=0; n<pattern.notesPerBeat; n++)
					{
						var nn = m * pattern.measuresCount * pattern.beatsPerMeasure 
									+ b * pattern.beatsPerMeasure
									+ n;

						pattern.notes[nn] = {};
					}
				}
			}

		}*/

		$scope.pattern		= pattern;

		$scope.semitones 	= [];
		$scope.measures 	= [];
		$scope.beats 		= [];
		$scope.notes 		= [];

		for(var s=pattern.minOctave; s<=12*pattern.maxOctave; s++)
		{
			var realSemitone = (pattern.maxOctave - pattern.minOctave + 1) * 12 - s;
			$scope.semitones.push({
				semitone: realSemitone,
				noteName: NoteNames[realSemitone%12]
			});
		}

		for(var m=0; m<pattern.measuresCount; m++)
		{
			$scope.measures.push({
				n: m
			});
		}

		for(var b=0; b<pattern.beatsPerMeasure; b++)
		{
			$scope.beats.push({
				n: b
			});
		}

		for(var n=0; n<pattern.notesPerBeat; n++)
		{
			$scope.notes.push({
				n: n
			});
		}

	};

	$scope.setPattern({
		measuresCount: 4,
		beatsPerMeasure: 4,
		notesPerBeat: 4,
		minOctave: 0,
		maxOctave: 8,
		notes: {}
	});

	$scope.gridClicked = function(event, semitone, measure, beat, note)
	{
		var n = measure * $scope.pattern.beatsPerMeasure * $scope.pattern.notesPerBeat
				+ beat * $scope.pattern.notesPerBeat
				+ note;

		var l = 4;

		if(!$scope.pattern.notes[n])
		{
			$scope.pattern.notes[n] = {};
		}
		
		$scope.pattern.notes[n][semitone] = l;
	};

};