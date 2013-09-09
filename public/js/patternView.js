var PatternView = function(options)
{
	var my = this;

	my.updatePenSize = function()
	{
		my.penSize = my.penMeasuresCount * my.model.beatsPerMeasure * my.model.notesPerBeat
					+ my.penBeatsCount * my.model.notesPerBeat
					+ my.penNotesCount;

	};

	my.init = function(options)
	{
		my.width  = options.width;
		my.height = options.height;
		my.x 	  = options.x || 0;
		my.y 	  = options.y || 0;

		my.menuHeight = 30;
		my.menuMargin = 3;
		my.infoWidth  = 40;
		my.horizontalScrollBarHeight = 20;
		my.horizontalScrollBarMargin = 3;
		my.verticalScrollBarWidth = 20;
		my.verticalScrollBarMargin = 3;
		my.noteHeight = 15;
		my.measureWidth = (my.width - my.verticalScrollBarWidth - 2*my.verticalScrollBarMargin - my.infoWidth)/4;
		
		my.penMeasuresCount = options.penMeasuresCount || 0;
		my.penBeatsCount = options.penBeatsCount || 1;
		my.penNotesCount = options.penNotesCount || 0;

		my.penSize = 1;

		my.stage = options.stage;
		
	};


	my.setModel = function(track)
	{
		if(my.layer)my.layer.remove();
		if(my.gridLayer)my.gridLayer.remove();

		my.layer = new Kinetic.Layer();
		my.gridLayer = new Kinetic.Layer({clip:[
			my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin,
			my.y + my.menuHeight + my.menuMargin + 2,
			my.width - my.verticalScrollBarWidth - 2*my.verticalScrollBarMargin - 2*my.horizontalScrollBarMargin,
			my.height - my.horizontalScrollBarHeight - 2*my.horizontalScrollBarMargin - my.menuHeight - 3
		]});
		my.stage.add(my.layer);
		my.stage.add(my.gridLayer);
		
		my.model = track;
		my.penSize = my.penSize || my.model.notesPerBeat; 
		my.setupUI();
	};

	my.setupUI = function()
	{
		my.updatePenSize();

		my.verticalScrollBar = new ScrollBar({
			direction: 'vertical',
			layer: my.layer,
			x: my.x + my.verticalScrollBarMargin,
			y: my.y + my.verticalScrollBarMargin,
			width: my.verticalScrollBarWidth,
			height: my.height - 2*my.verticalScrollBarMargin,
			minValue: 0,
			maxValue: (my.model.maxOctave - my.model.minOctave + 1) * 12 * my.noteHeight - my.height + my.menuHeight + my.horizontalScrollBarHeight + 2 * my.horizontalScrollBarMargin + 2,
			onScroll: function(move){
				my.gridLayer.move(0,-move.delta);
				var clip = my.gridLayer.getClip();
				clip.y += move.delta;
				my.gridLayer.setClip(clip);
				my.gridLayer.draw();
			}
		});

		my.horizontalScrollBar = new ScrollBar({
			direction: 'horizontal',
			layer: my.layer,
			x: my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin,
			y: my.height - my.horizontalScrollBarMargin - my.horizontalScrollBarHeight,
			width: my.width - 2*my.horizontalScrollBarMargin - 2*my.verticalScrollBarMargin - my.verticalScrollBarWidth,
			height: my.horizontalScrollBarHeight,
			minValue: 0,
			maxValue: 200 + my.model.measureCount * my.measureWidth + my.infoWidth - my.width - 2*my.verticalScrollBarMargin - my.verticalScrollBarWidth,
			onScroll: function(move){
				my.gridLayer.move(-move.delta, 0);
				var clip = my.gridLayer.getClip();
				clip.x += move.delta;
				my.gridLayer.setClip(clip);
				my.gridLayer.draw();
			}
		});

		var menuX = my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin;
		var menuY = my.y + my.menuMargin;
		var menuW = my.width - 2*my.menuMargin - 2*my.verticalScrollBarMargin - my.verticalScrollBarWidth;
		
		my.menu = new Kinetic.Rect({
			x: menuX,
			y: menuY,
			width: menuW,
			height: my.menuHeight,
			stroke: 'black',
			strokeWidth: 1
		});

		my.layer.add(my.menu);

		var mx = menuX + my.menuMargin;
		var mh = my.menuHeight - 2*my.menuMargin;

		/*
		* Put buttons in the menu, 
		* they are used to select pen width in Measures, Beats and Notes
		*/

		var drawButtons = function(n, fill, onClick, onConstructed)
		{
			var rects = {};
			for(var i=0; i<=n; i+=1)
			{
				var rect = new Kinetic.Rect({
					x: mx,
					y: menuY + my.menuMargin,
					width: mh,
					height: mh,
					stroke: 'black',
					fill: fill,
					strokeWidth: 1
				});

				rects[i] = rect;

				var text = new Kinetic.Text({
					text: i,
					fontSize: 12,
					fontFamily: 'sans-serif',
					fill: 'black'
				});

				rect.oldFill = fill;

				text.setListening(false);

				rect.on('mouseover', function(){
						document.body.style.cursor = 'pointer';
					});
				rect.on('mouseout', function(){
					document.body.style.cursor = 'default';
				});

				rect.on('click', (function(i, rect, rects){return function(){
					if(onClick){
						onClick(i, rect, rects);
					}
				};})(i, rect, rects));

				if(onConstructed)onConstructed(i, rect);

				text.setAbsolutePosition({x: mx + (mh - text.getWidth())/2, y: menuY + my.menuMargin + (mh - text.getHeight()) /2});

				my.layer.add(rect);
				my.layer.add(text);
				mx += mh + my.menuMargin;
			}

			mx += 2*my.menuMargin;
		};

		drawButtons(my.model.measureCount, '#CCFF33', function(i, rect, rects){
			if(my.penMeasures)
			{
				my.penMeasures.setFill(my.penMeasures.oldFill);
			}
			rect.oldFill = rect.getFill();
			rect.setFill('#33CCFF');
			my.penMeasures = rect;
			my.layer.draw();
			my.penMeasuresCount = i;
			my.updatePenSize();
		}, function(i, rect){if(i == my.penMeasuresCount){rect.setFill('#33CCFF'); my.penMeasures = rect;}});
		drawButtons(my.model.beatsPerMeasure, '#FFCC33', function(i, rect, rects){
			if(my.penBeats)
			{
				my.penBeats.setFill(my.penBeats.oldFill);
			}
			rect.oldFill = rect.getFill();
			rect.setFill('#33CCFF');
			my.penBeats = rect;
			my.layer.draw();
			my.penBeatsCount = i;
			my.updatePenSize();
		}, function(i, rect){if(i == my.penBeatsCount){rect.setFill('#33CCFF'); my.penBeats = rect;}});
		drawButtons(my.model.notesPerBeat, '#FF6633', function(i, rect, rects){
			if(my.penNotes)
			{
				my.penNotes.setFill(my.penNotes.oldFill);
			}
			rect.oldFill = rect.getFill();
			rect.setFill('#33CCFF');
			my.penNotes = rect;
			my.layer.draw();
			my.penNotesCount = i;
			my.updatePenSize();
		}, function(i, rect){if(i == my.penNotesCount){rect.setFill('#33CCFF'); my.penNotes = rect;}});

		/*
		* Happily draw the grid, bear with me
		*/

		var w  = my.model.measureCount * my.measureWidth;
		var wx = my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin + my.infoWidth;
		for(var i=my.model.maxOctave; i>=my.model.minOctave; i-=1)
		{
			for(var j=0; j<12; j+=1)
			{
				var y = my.y + my.menuHeight + my.menuMargin + ((my.model.maxOctave - i)*12 + j) * my.noteHeight;

				var semitone = 11 - j;

				
				var color = 'white';
				if(semitone == 0)
				{
					color = '#CCC';
				}
				else if(semitone == 4)
				{
					color = '#DDD';
				}
				else if(semitone == 7)
				{
					color = '#EEE';
				}

				var rect = new Kinetic.Rect({
					x: wx,
					y: y,
					width: w,
					height: my.noteHeight,
					fill: color
				});
				my.gridLayer.add(rect);
				

				var line = new Kinetic.Line({
					points: [wx, y, wx+w, y],
					stroke: 'lightgray',
					strokeWidth: 1
				});


				my.gridLayer.add(line);

				var noteName = NoteNames[semitone]+i;
				var text = new Kinetic.Text({
					x: my.x + my.verticalScrollBarWidth + 3*my.verticalScrollBarMargin,
					y: y + my.verticalScrollBarMargin,
					text: noteName,
					fontSize: 10,
					fontFamily: 'sans-serif',
					fill: 'black'
				});

				my.gridLayer.add(text);


				rect.on('click', (function(i, noteName, semitone){
					return function(event){
						var nth = Math.floor((event.x - event.targetNode.getAbsolutePosition().x) / my.measureWidth * my.model.notesPerBeat * my.model.beatsPerMeasure);
						my.onGridClicked({
							note: nth,
							octave: i,
							semitone: semitone,
							name: noteName
						});
					};
				})(i, noteName, semitone));

			}
		}

		for(var i=0; i<my.model.measureCount; i++)
		{
			var x = my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin + my.infoWidth + i*my.measureWidth;
			var y = my.y + my.menuHeight + my.menuMargin + 1;
			var h = (my.model.maxOctave - my.model.minOctave + 1) * 12 * my.noteHeight;

			for(var j=0; j<my.model.beatsPerMeasure; j++)
			{
				var xx = x + j * my.measureWidth / my.model.beatsPerMeasure;
				
				for(var k=1; k<my.model.notesPerBeat; k++)
				{
					var xxx = xx + k * my.measureWidth / my.model.beatsPerMeasure / my.model.notesPerBeat;

					var noteLine = new Kinetic.Line({
						points: [xxx, y, xxx, y + h],
						stroke: 'lightgray',
						strokeWidth: 1
					});

				my.gridLayer.add(noteLine); 

				}

				var beatLine = new Kinetic.Line({
					points: [xx, y, xx, y + h],
					stroke: 'gray',
					strokeWidth: 1
				});

				my.gridLayer.add(beatLine); 
			}

			var measureLine = new Kinetic.Line({
				points: [x, y, x, y + h],
				stroke: 'black',
				strokeWidth: 2
			});

			my.gridLayer.add(measureLine);

		}

		for(var i in my.model.notes)
		{
			var note = parseInt(i);
			for(var j in my.model.notes[i])
			{
				var semitone = parseInt(j);
				var length = my.model.notes[i][j];
				my.drawNote(note, semitone, length);
			}
		}

		my.layer.draw();
		my.gridLayer.draw();
	};

	my.drawNote = function(note, semitone, length)
	{
		var w = my.measureWidth / my.model.notesPerBeat / my.model.beatsPerMeasure;

		var noteRect = new Kinetic.Rect({
				x: my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin + my.infoWidth + note*w,
				y: my.y + my.menuHeight + my.menuMargin + ((my.model.maxOctave - my.model.minOctave + 1) * 12  - 1 - semitone) * my.noteHeight,
				width: w*length,
				height: my.noteHeight,
				fill: "blue",
				stroke: "black",
				strokeWidth: 2,
				opacity: 0.7,
			});

			noteRect.on('click', function(){
				my.model.removeNoteAt(note,semitone);
				noteRect.remove();
				my.gridLayer.draw();
			});

			my.gridLayer.add(noteRect);
			my.gridLayer.draw();
	};

	my.onGridClicked = function(event){
		
		var n = my.penSize;

		var semitone = 12*event.octave + event.semitone;

		if(my.model.canAddNoteAt(event.note, semitone, n))
		{
			my.model.addNoteAt(event.note, semitone, n);
			my.drawNote(event.note, semitone, n);
		}

		
	};

	my.init(options);
};