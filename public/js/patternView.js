var PatternView = function(options)
{
	var my = this;

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

		my.stage = options.stage;
		my.layer = new Kinetic.Layer();
		my.gridLayer = new Kinetic.Layer({clip:[
			my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin,
			my.y + my.menuHeight + my.menuMargin + 2,
			my.width - my.verticalScrollBarWidth - 2*my.verticalScrollBarMargin - 2*my.horizontalScrollBarMargin,
			my.height - my.horizontalScrollBarHeight - 2*my.horizontalScrollBarMargin - my.menuHeight - 3
		]});
		my.stage.add(my.layer);
		my.stage.add(my.gridLayer);
	};


	my.setModel = function(track)
	{
		my.model = track;
		my.setupUI();
	};

	my.setupUI = function()
	{
		my.verticalScrollBar = new ScrollBar({
			direction: 'vertical',
			layer: my.layer,
			x: my.x + my.verticalScrollBarMargin,
			y: my.y + my.verticalScrollBarMargin,
			width: my.verticalScrollBarWidth,
			height: my.height - 2*my.verticalScrollBarMargin,
			minValue: 0,
			maxValue: (my.model.maxOctave - my.model.minOctave) * 12 * my.noteHeight - my.height + my.menuHeight + my.horizontalScrollBarHeight + 2 * my.horizontalScrollBarMargin + 2,
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

		my.menu = new Kinetic.Rect({
			x: my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin,
			y: my.y + my.menuMargin,
			width: my.width - 2*my.menuMargin - 2*my.verticalScrollBarMargin - my.verticalScrollBarWidth,
			height: my.menuHeight,
			stroke: 'black',
			strokeWidth: 1
		});

		my.layer.add(my.menu);

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
			var h = (my.model.maxOctave - my.model.minOctave) * 12 * my.noteHeight;

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

		my.layer.draw();
		my.gridLayer.draw();
	};

	my.onGridClicked = function(event){
		var w = my.measureWidth / my.model.notesPerBeat / my.model.beatsPerMeasure;
		var note = new Kinetic.Rect({
			x: my.x + my.verticalScrollBarWidth + 2*my.verticalScrollBarMargin + my.infoWidth + event.note *w,
			y: my.y + my.menuHeight + my.menuMargin + ((my.model.maxOctave - event.octave) * 12 + 11 -event.semitone) * my.noteHeight,
			width: w,
			height: my.noteHeight,
			fill: "black"
		});

		my.gridLayer.add(note);
		my.gridLayer.draw();
	};

	my.init(options);
};