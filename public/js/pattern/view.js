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

		for(var o=this.model.config.maxOctave; o>=this.model.config.minOctave; o--)
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
		for(var m=0; m<this.model.config.measureCount; m++)
		{
			this.backgroundLayer.add(new Kinetic.Line({
				points:[x, 0, x, height],
				stroke: 'black',
				strokeWidth: 1,
				listening: false
			}));

			for(var b=0; b<this.model.config.beatsPerMeasure; b++)
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
				for(var n=0; n<this.model.config.notesPerBeat; n++)
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

		if(my.history)
		{
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

	this.loadSnapshot = function(h)
	{
		my.removeAllMarks();

		my.model.notes = JSON.parse(h.notes);
		my.addModelNotesToView();


		my.iterate2DArray(JSON.parse(h.selection), function(i, j){
			my.selectMark(i, j);
		});

		my.marksLayer.draw();
		my.selectionLayer.draw();
		var scrollTo = my.RowColToXY(h.topLeftVisible.row, h.topLeftVisible.col);
		$('#pattern-view-container').scrollTo({top: scrollTo.y, left: scrollTo.x}, 500);
	};

	this.addModelNotesToView = function()
	{
		this.iterate2DArray(this.model.notes, function(note, semitone, length){
			var rc = my.noteSemitoneToRowCol(note, semitone);
			my.addMarkAt(rc.row, rc.col, length);
		});
	};

	this.noteSemitoneToRowCol = function(note, semitone)
	{
		return {
			row: (my.model.config.maxOctave + my.model.config.minOctave) * 12 - 1 - semitone,
			col: note
		};
	};

	this.rowColToNoteSemitone = function(row, col)
	{
		return {
			note: col,
			semitone: (my.model.config.maxOctave + my.model.config.minOctave) * 12 - 1 - row
		};
	};

	options.getCellsPerRowCount = function(track){
		return track.config.measureCount * track.config.beatsPerMeasure * track.config.notesPerBeat;
	};

	options.getRowCount = function(track)
	{
		return (track.config.maxOctave - track.config.minOctave + 1) * 12;
	};

	options.onMarksAdded = function(marks, operationId){
		for(var i in marks)
		{
			var ns = my.rowColToNoteSemitone(marks[i].row, marks[i].col);
			my.model.addNoteAt(ns.note, ns.semitone, marks[i].length);
		}
	};

	options.onMarksRemoved = function(marks, operationId){
		for(var i in marks)
		{
			var ns = my.rowColToNoteSemitone(marks[i].row, marks[i].col);
			my.model.removeNoteAt(ns.note, ns.semitone);
		}
	};

	options.onOperationCompleted = function()
	{
		my.makeSnapshot();
	};

	options.onSelectionChanged = function(
		currentSelection,
		newlySelected,
		deselected, 
		operationId
		){
	};

	var my = this;

	this.snapshotsTaken = {};

	this.noteWidth 	= options.cellWidth  = 30;
	this.noteHeight = options.cellHeight = 18;

	this.history = options.history;

	this.init(options);
	this.drawGrid();

	this.addModelNotesToView();
	this.marksLayer.draw();
};

PatternView.prototype = new Grid();
PatternView.prototype.constructor = PatternView;