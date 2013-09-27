var PatternView = function(options)
{
	this.drawGrid = function()
	{
		/*
		* Draw the rows
		*/
		var y = 0;
		var height = this.getHeight();
		var width  = this.getWidth();

		for(var o=this.model.maxOctave; o>=this.model.minOctave; o--)
		{
			for(var s=11; s>=0; s--)
			{
				this.backgroundLayer.add(new Kinetic.Rect({
					x: 0,
					y: y,
					width: width,
					height: this.noteHeight,
					fill: this.getNoteColor(NoteNames[s]),
					listening: false
				}));

				y += this.noteHeight;

				var line = new Kinetic.Line({
					points: [0, y, width, y],
					stroke: '#CCC'
				});
				this.backgroundLayer.add(line);
				
			}
		};

		/*
		* Draw the vertical lines
		*/
		var x = 1;
		for(var m=0; m<this.model.measureCount; m++)
		{
			this.backgroundLayer.add(new Kinetic.Line({
				points:[x, 0, x, height],
				stroke: 'black',
				strokeWidth: 2,
				listening: false
			}));

			for(var b=0; b<this.model.beatsPerMeasure; b++)
			{
				if(b!=0)
				{
					this.backgroundLayer.add(new Kinetic.Line({
						points:[x, 0, x, height],
						stroke: '#777',
						strokeWidth: 1,
						listening: false
					}));
				}
				for(var n=0; n<this.model.notesPerBeat; n++)
				{
					if(n!=0)
					{
						this.backgroundLayer.add(new Kinetic.Line({
							points:[x, 0, x, height],
							stroke: '#BBB',
							strokeWidth: 1,
							listening: false
						}));
					}
					x += this.noteWidth;
				}
			}
		}
		this.backgroundLayer.draw();
	};

	this.getNoteColor = function(name)
	{
		switch(name)
		{
			case 'C': return '#CCC';
			case 'E': return '#DDD';
			case 'G': return '#EEE';
			default: return 'white';
		}
	};

	this.makeSnapshot = function(options)
	{
		if(options === undefined)
		{
			options = {};
		}

		if(options.operationId)
		{
			if(my.snapshotsTaken[options.operationId])
			{
				// One snapshot per operation only!!
				return;
			}
			else
			{
				my.snapshotsTaken[options.operationId] = true;
			}
		}

		if(my.history)
		{
			my.makeSnapshotBeforeLoad = true;

			var selection = {};
			my.eachSelectedMark(function(i, j){
				my.set2DArrayAt(selection, i, j, true);
			});

			var container = $('#pattern-view-container');

			var data = my.marksLayer.toDataURL({
				mimeType: 'image/png',
				quality: 0,
				x: container.scrollLeft(),
				y: container.scrollTop(),
				width: container.width(),
				height: container.height()
			});

			var topLeftVisible = my.XYtoRowCol(container.scrollLeft(), container.scrollTop());

			var h = {
				notes: JSON.stringify(my.model.notes),
				selection: JSON.stringify(selection),
				image: data,
				topLeftVisible: topLeftVisible,
				controller: 'PatternView'
			};

			my.history.record(h, options);
		}
	};

	options.getCellsPerRowCount = function(track){
		return track.measureCount * track.beatsPerMeasure * track.notesPerBeat;
	};

	options.getRowCount = function(track)
	{
		return (track.maxOctave - track.minOctave + 1) * 12;
	};

	options.onMarksAdded = function(marks, operationId){
		my.makeSnapshot({operationId: operationId});
	};

	options.onMarksRemoved = function(marks, operationId){
		my.makeSnapshot({operationId: operationId});
	};

	options.onSelectionChanged = function(
		currentSelection,
		newlySelected,
		deselected, 
		operationId
		){
		my.makeSnapshot({operationId: operationId});
	};

	var my = this;

	this.snapshotsTaken = {};

	this.noteWidth 	= options.cellWidth  = 30;
	this.noteHeight = options.cellHeight = 18;

	this.history = options.history;

	this.init(options);
	this.drawGrid();
};

PatternView.prototype = new Grid();
PatternView.prototype.constructor = PatternView;