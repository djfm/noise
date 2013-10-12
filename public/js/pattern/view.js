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

	this.setModel = function(model)
	{
		var needToRedrawGrid = 
				model.notesPerBeat != this.model.notesPerBeat
			|| 	model.beatsPerMeasure != this.model.beatsPerMeasure
			|| 	model.measureCount != this.model.measureCount;

		var scope = this.model.history.scope;

		this.model = model;

		if(this.model.history && this.model.history.history.length > 0)
		{
			this.loadSnapshot(this.model.history.history[0]);
		}
		else
		{
			this.removeAllMarks();
			if(needToRedrawGrid)
			{
				this.drawGrid();
			}
			this.addModelDataToView();
			this.marksLayer.draw();
		}

		scope.history = this.model.history;
		this.model.history.scope = scope;
		my.history = this.model.history;
	};

	this.addModelDataToView = function()
	{
		this.iterate2DArray(this.getModelData(), function(note, semitone, length){
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

	this.getCellsPerRowCount = function(){
		return my.model.config.measureCount * my.model.config.beatsPerMeasure * my.model.config.notesPerBeat;
	};

	this.getRowCount = function()
	{
		return (my.model.config.maxOctave - my.model.config.minOctave + 1) * 12;
	};

	this.onMarksAdded = function(marks, operationId){
		for(var i in marks)
		{
			var ns = my.rowColToNoteSemitone(marks[i].row, marks[i].col);
			my.model.addNoteAt(ns.note, ns.semitone, marks[i].length);
		}
	};

	this.onMarksRemoved = function(marks, operationId){
		for(var i in marks)
		{
			var ns = my.rowColToNoteSemitone(marks[i].row, marks[i].col);
			my.model.removeNoteAt(ns.note, ns.semitone);
		}
	};

	this.onOperationCompleted = function()
	{
		my.makeSnapshot();
	};

	this.getModelData = function()
	{
		return my.model.notes;
	};

	this.setModelData = function(data)
	{
		my.model.notes = data;
	};

	this.onSelectionChanged = function(
		currentSelection,
		newlySelected,
		deselected, 
		operationId
		){
	};

	var my = this;

	this.noteWidth 	= options.cellWidth  = 30;
	this.noteHeight = options.cellHeight = 18;

	this.initGrid(options);
	this.drawGrid();

	this.addModelDataToView();
	this.marksLayer.draw();
};

PatternView.prototype = new Grid();
PatternView.prototype.constructor = PatternView;