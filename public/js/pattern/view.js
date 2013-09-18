var PatternView = function(options)
{
	var my = this;

	this.init = function(options)
	{
		this.model = options.model;
		this.marks = {};
		this.selection = {};
		this.selectionId = 0;

		this.noteWidth  = options.noteWidth  || 30;
		this.noteHeight = options.noteHeight || 18;

		this.width = this.model.measureCount 
				   * this.model.beatsPerMeasure
				   * this.model.notesPerBeat
				   * this.noteWidth;

		
		this.height = this.model.octaveCount()
					* 12
					* this.noteHeight;

		if(!this.stage)
		{
			this.stage = new Kinetic.Stage({
				container: options.container,
				width: this.width,
				height: this.height
			});

			$('#'+options.container).on('contextmenu', function(e){
			  e.preventDefault();
			});
		}

		if(this.layer)
		{
			this.layer.remove();
		}

		if(this.selectionLayer)
		{
			this.selectionLayer.remove();
		}

		this.layer = new Kinetic.Layer();

		KineticUtil.onDrag(this.layer, {
			onMove: function(e){
				my.selectedAreaChanged(e);
			},
			onEnd: function(e){
				my.selectionEnded(e);
			},
			onStart: function(e)
			{
				my.selectionStarted(e);
			}
		});

		this.stage.add(this.layer);

		this.selectionLayer = new Kinetic.Layer();

		this.stage.add(this.selectionLayer);

		this.draw();
	};

	this.selectedAreaChanged = function(e)
	{
		if(this.selectionRect)
		{
			this.selectionRect.setPosition(e.topLeft);
			this.selectionRect.setWidth(e.size.width);
			this.selectionRect.setHeight(e.size.height);
		}
		else
		{
			this.selectionRect = new Kinetic.Rect({
				x: e.topLeft.x,
				y: e.topLeft.y,
				width: e.size.width,
				height: e.size.width,
				stroke: 'black',
				fill: 'green',
				opacity: 0.1,
				strokeWidth: 1
			});

			this.selectionRect.setListening(false);

			this.selectionLayer.add(this.selectionRect);
		}
		
		this.selectionLayer.draw();

		this.computeSelection(e);
	};


	this.selectMark = function(note, semitone, mark)
	{

		mark.isSelected = true;
		mark.previousOpacity = mark.getOpacity();
		mark.previousFill  = mark.getFill();
		mark.setOpacity(1);
		mark.setFill('yellow');
		mark.selectionId = this.selectionId;

		if(!this.selection[note])
		{
			this.selection[note] = {};
		}
		this.selection[note][semitone] = mark;
	};

	this.unselectMark = function(note, semitone, mark)
	{
		mark.isSelected = false;
		mark.setOpacity(mark.previousOpacity);
		mark.setFill(mark.previousFill);
		delete this.selection[note][semitone];
		mark.selectionId = undefined;
	};

	this.computeSelection = function(e)
	{
		var selectionChanged = false;

		for(var i in my.marks)
		{
			for(var j in my.marks[i])
			{
				var mark = my.marks[i][j];
				if(!// <- note this NOT
					// Mark is outside selection
					(
						// Completely outside laterally
						(mark.getX() + mark.getWidth() < e.topLeft.x)
							||
						(mark.getX() > e.topLeft.x + e.size.width)

							||
						
						// Completely outside vertically
						(mark.getY() + mark.getHeight() < e.topLeft.y)
							||
						(mark.getY() > e.topLeft.x + e.size.height)
					)
				)
				{
					// Selection intersects mark
					if(!mark.isSelected)
					{
						my.selectMark(i, j, mark);
						selectionChanged = true;
					}
					else
					{
						mark.selectionId = this.selectionId;
					}
					
				}
				else
				{
					// Selection does not intersect mark
					if(mark.isSelected && mark.selectionId == this.selectionId)
					{
						my.unselectMark(i, j, mark);
						selectionChanged = true;
					}
				}

			}
		}

		if(selectionChanged)
		{
			this.layer.draw();
		}
	};

	this.clearSelection = function()
	{
		for(var i in this.selection)
		{
			for(var j in this.selection[i])
			{
				this.unselectMark(i, j, this.selection[i][j]);
			}
		}
		this.layer.draw();
	};

	this.selectionStarted = function(e)
	{
		if(!e.mouseEvent.ctrlKey)
		{
			this.clearSelection();
		}
	};

	this.selectionEnded = function(e)
	{
		this.selectionRect.remove();
		this.selectionRect = undefined;

		this.selectionLayer.draw();

		this.selectionId += 1;
	};

	this.draw = function()
	{
		this.drawGrid();

		this.layer.draw();
	};

	this.drawGrid = function()
	{
		/*
		* Draw the rows
		*/
		var y = 0;

		for(var o=this.model.maxOctave; o>=this.model.minOctave; o--)
		{
			for(var s=11; s>=0; s--)
			{
				var rect = new Kinetic.Rect({
					x: 0,
					y: y,
					width: this.width,
					height: this.noteHeight,
					fill: this.getNoteColor(NoteNames[s])
				});
				this.layer.add(rect);

				rect.on('click', function(e){my.rowClicked(e)});

				y += this.noteHeight;

				var line = new Kinetic.Line({
					points: [0, y, this.width, y],
					stroke: '#CCC'
				});
				this.layer.add(line);
				
			}
		};

		/*
		* Draw the vertical lines
		*/
		var x = 1;
		for(var m=0; m<this.model.measureCount; m++)
		{
			this.layer.add(new Kinetic.Line({
				points:[x, 0, x, this.height],
				stroke: 'black',
				strokeWidth: 2
			}));

			for(var b=0; b<this.model.beatsPerMeasure; b++)
			{
				if(b!=0)
				{
					this.layer.add(new Kinetic.Line({
						points:[x, 0, x, this.height],
						stroke: '#777',
						strokeWidth: 1
					}));
				}
				for(var n=0; n<this.model.notesPerBeat; n++)
				{
					if(n!=0)
					{
						this.layer.add(new Kinetic.Line({
							points:[x, 0, x, this.height],
							stroke: '#BBB',
							strokeWidth: 1
						}));
					}
					x += this.noteWidth;
				}
			}
		}

	};

	this.rowClicked = function(event)
	{
		if(event.button == 0)
		{
			var note 	 = Math.floor(event.layerX / my.noteWidth);
			var semitone = (my.model.maxOctave + my.model.minOctave) * 12 - Math.ceil(event.layerY / my.noteHeight);
			my.gridClicked(note, semitone);
		}
	};

	this.penSize = function()
	{
		return 4;
	};

	this.noteTopLeft = function(note, semitone)
	{
		var x = note * my.noteWidth;
		var y = ((my.model.maxOctave + my.model.minOctave) * 12 - semitone - 1) * my.noteHeight;
		return {x: x, y: y};
	};

	this.gridClicked = function(note, semitone)
	{
		if(this.model.canAddNoteAt(note, semitone, this.penSize()))
		{
			this.model.addNoteAt(note, semitone, this.penSize());

			this.addNoteToViewAt(note, semitone);
		}
	};

	this.addNoteToViewAt = function(note, semitone)
	{
		var tl = this.noteTopLeft(note, semitone);

		var mark = new Kinetic.Rect({
			x: tl.x+1,
			y: tl.y,
			width: this.penSize() * this.noteWidth - 1,
			height: this.noteHeight - 1,
			fill: 'blue',
			opacity: 0.7,
			stroke: 'black',
			strokeWidth: 1,
			draggable: false 
		});

		mark.on('click', function(e){
			if(e.button == 2)
			{
				mark.remove();
				my.model.removeNoteAt(note, semitone);
				delete my.marks[note][semitone];
				if(my.selection[note] && my.selection[note][semitone])
				{
					my.unselectMark(note, semitone, my.selection[note][semitone]);
				}
			}
			else if(e.button == 0)
			{
				if(!e.ctrlKey)
				{
					my.clearSelection();
				}
				my.selectMark(note, semitone, mark);
				this.selectionId += 1;
			}
			my.layer.draw();
		});

		KineticUtil.onDrag(mark, {
			onStart: function(){
				console.log("hey!");
			}
		});

		if(!this.marks[note])
		{
			this.marks[note] = {};
		}

		this.marks[note][semitone] = mark;

		this.layer.add(mark);
		this.layer.draw();
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


	this.init(options);
};