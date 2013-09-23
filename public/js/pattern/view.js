var PatternView = function(options)
{
	var my = this;

	this.init = function(options)
	{
		this.model = options.model;
		this.marks = {};
		this.selection = {};
		this.selectionId = 0;

		this.history = options.history;

		this._penSize = options.penSize || 4;

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

		if(this.marksLayer)
		{
			this.marksLayer.remove();
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

		this.marksLayer = new Kinetic.Layer();
		this.stage.add(this.marksLayer);

		this.selectionLayer = new Kinetic.Layer();
		this.stage.add(this.selectionLayer);

		this.draw();

		this.addModelNotesToView();
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
		if(mark == undefined)
		{
			mark = my.marks[note][semitone];
		}

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
		if(mark == undefined)
		{
			if(my.selection[note])
			{
				mark = my.selection[note][semitone];
			}
		}

		if(mark == undefined)
		{
			return;
		}

		mark.isSelected = false;
		mark.setOpacity(mark.previousOpacity);
		mark.setFill(mark.previousFill);
		mark.selectionId = undefined;

		delete my.selection[note][semitone];
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
						(mark.getY() > e.topLeft.y + e.size.height)
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
			this.marksLayer.draw();
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
		this.marksLayer.draw();
	};

	this.setMarksListening = function(bool)
	{
		for(var i in this.marks)
		{
			for(var j in this.marks[i])
			{
				this.marks[i][j].setListening(bool);
			}
		}
		// Changes to listening prop. are not
		// taken into account until the layer is
		// redrawn
		this.marksLayer.draw();
	};

	this.selectionStarted = function(e)
	{
		this.setMarksListening(false);

		if(!e.mouseEvent.ctrlKey)
		{
			this.clearSelection();
		}
	};

	this.selectionEnded = function(e)
	{

		my.eachSelectedMark(function(i, j){
			my.makeSnapshot();
			return false;
		});

		this.selectionRect.remove();
		this.selectionRect = undefined;

		this.selectionLayer.draw();

		this.selectionId += 1;

		this.setMarksListening(true);
	};

	this.draw = function()
	{
		this.drawGrid();

		this.layer.draw();
		this.marksLayer.draw();
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

	this.getNoteAndSemitone = function(x, y)
	{
		return {
			note: Math.floor(x / my.noteWidth),
			semitone: (my.model.maxOctave + my.model.minOctave) * 12 - Math.ceil(y / my.noteHeight)
		};
	};

	this.rowClicked = function(event)
	{
		if(event.button == 0)
		{
			var ns = my.getNoteAndSemitone(event.layerX, event.layerY);
			my.gridClicked(ns.note, ns.semitone);
		}
	};

	this.penSize = function()
	{
		return my._penSize;
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
			this.makeSnapshot();
			this.model.addNoteAt(note, semitone, this.penSize());
			this.addNoteToViewAt(note, semitone);
		}
	};

	this.addNoteToViewAt = function(note, semitone, options)
	{
		if(options === undefined)
		{
			options = {};
		}

		var tl = this.noteTopLeft(note, semitone);

		var mark = new Kinetic.Rect({
			x: tl.x+1,
			y: tl.y,
			width: my.model.notes[note][semitone] * this.noteWidth - 1,
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
				my.makeSnapshot();
				my.removeNote(note, semitone, mark);
			}
			else if(e.button == 0)
			{
				my.makeSnapshot();
				if(!e.ctrlKey)
				{
					my.clearSelection();
				}
				my.selectMark(note, semitone, mark);
				this.selectionId += 1;
			}
			my.marksLayer.draw();
		});

		KineticUtil.onDrag(mark, {
			onStart: function(e){

				var onTheEdge = Math.abs(e.current.x - mark.getX() - mark.getWidth()) < 10;
				
				if(e.mouseEvent.shiftKey || onTheEdge)
				{
					mark.isRootOfResizeOperation = true;
					my.initiateSelectionResize(e);
				}
				else
				{
					my.movingSelection = true;
					my.initiateSelectionMove(e);
				}
			},
			onMove: function(e)
			{	
				if(my.movingSelection)
				{
					my.moveSelection(e);
				}
				else
				{
					my.resizeSelection(e);
				}
			},
			onEnd: function(e)
			{
				if(my.movingSelection)
				{
					my.endSelectionMove(e);
					my.movingSelection = false;
				}
				else
				{
					my.endSelectionResize();	
				}
			},
			relayFrom: my.layer
		});

		if(!this.marks[note])
		{
			this.marks[note] = {};
		}

		this.marks[note][semitone] = mark;

		this.marksLayer.add(mark);

		if(options.draw !== false)
		{
			this.marksLayer.draw();
		}
	};

	this.removeNote = function(note, semitone, mark)
	{
		if(mark == undefined)
		{
			mark = my.marks[note][semitone];
		}

		mark.remove();

		my.model.removeNoteAt(note, semitone);
		delete my.marks[note][semitone];

		my.unselectMark(note, semitone);		
	};

	this.initiateSelectionMove = function(e)
	{
		my.selectionMoveIsCopy = e.mouseEvent.ctrlKey;

		my.setMarksListening(false);

		my.eachSelectedMark(function(i, j, mark)
		{
			var shadow = new Kinetic.Rect({
				x: mark.getX(),
				y: mark.getY(),
				width: mark.getWidth(),
				height: mark.getHeight(),
				fill: mark.getFill(),
				opacity: 0.4,
				stroke: 'black',
				strokeWidth: 1
			});

			mark.moveShadow = shadow;
			mark.freeMoveX  = mark.getX();
			mark.freeMoveY  = mark.getY();

			shadow.setListening(false);
			my.selectionLayer.add(shadow);
		});

		my.selectionLayer.draw();
	};

	this.moveSelection = function(e)
	{
		var needDraw 	= false;
		var dropAllowed = true;

		my.eachSelectedMark(function(i, j, mark)
		{
			var shadow = mark.moveShadow;

			mark.freeMoveX += e.delta.x;
			mark.freeMoveY += e.delta.y;

			var targetLogicalPos = my.getNoteAndSemitone(mark.freeMoveX, mark.freeMoveY);
			var targetPos = my.noteTopLeft(targetLogicalPos.note, targetLogicalPos.semitone);

			mark.targetLogicalPos = targetLogicalPos;

			targetPos.x += 1;

			if((mark.getX() != targetPos.x || mark.getY() != targetPos.y))
			{
				needDraw = true;
			}

			shadow.setPosition(targetPos);

			// Check if we can drop
			if(my.model.canAddNoteAt(
					targetLogicalPos.note, 
					targetLogicalPos.semitone,
					my.model.notes[i][j],
					(my.selectionMoveIsCopy ? undefined : my.selection)
				)
			)
			{
				if(shadow.moveDropAllowed === false)
				{
					needDraw = true;
					shadow.setFill(shadow.oldFill);
				}
				shadow.moveDropAllowed = true;
			}
			else
			{
				if(shadow.moveDropAllowed !== false)
				{
					needDraw = true;
					shadow.oldFill = shadow.getFill();
					shadow.setFill('red');
				}
				shadow.moveDropAllowed = false;
				dropAllowed = false;
			}
		});

		if(needDraw)
		{
			my.selectionLayer.draw();
		}

		my.selectionDropAllowed = dropAllowed;
	};

	this.endSelectionMove = function(e)
	{
		var newSelection = {};

		if(my.selectionDropAllowed)
		{
			this.makeSnapshot();
		}

		my.eachSelectedMark(function(i, j, mark)
		{
			mark.moveShadow.remove();
			mark.moveShadow = undefined;
			mark.freeMoveX  = undefined;
			mark.freeMoveY  = undefined;

			if(my.selectionDropAllowed)
			{
				var note = mark.targetLogicalPos.note;
				var semitone = mark.targetLogicalPos.semitone;

				var len = my.model.notes[i][j];

				if(my.selectionMoveIsCopy)
				{
					my.unselectMark(i, j);
				}
				else
				{
					my.removeNote(i, j);
				}

				// Can't both remove and add from the array we are looping on!!
				if(!newSelection[note])
				{
					newSelection[note] = {};
				}

				newSelection[note][semitone] = len;
			}
		});

		for(var i in newSelection)
		{
			for(var j in newSelection[i])
			{
				my.model.addNoteAt(i, j, newSelection[i][j]);
				my.addNoteToViewAt(i, j);
				my.selectMark(i, j);
			}
		}

		my.selectionLayer.draw();
		my.setMarksListening(true);
	};

	this.initiateSelectionResize = function(e)
	{
		my.setMarksListening(false);

		my.eachSelectedMark(function(i, j, mark)
		{
			var shadow = new Kinetic.Rect({
				x: mark.getX(),
				y: mark.getY(),
				width: mark.getWidth(),
				height: mark.getHeight(),
				fill: 'green',
				opacity: 1,
				stroke: 'black',
				strokeWidth: 1
			});

			mark.resizeShadow = shadow;
			mark.originalWidth = mark.getWidth();
			
			shadow.setListening(false);
			my.selectionLayer.add(shadow);
		});

		my.selectionLayer.draw();
	};

	this.resizeSelection = function(e)
	{
		var need_update = false;

		var newLengths = {};

		var ds = Math.floor((e.current.x - e.start.x)/my.noteWidth);
		var dx = ds*my.noteWidth;

		my.eachSelectedMark(function(i, j, mark)
		{
			
			var newWidth = mark.originalWidth + dx;

			if(newWidth > 0)
			{
				var len = Math.round(newWidth / my.noteWidth);

				if(!newLengths[i])
				{
					newLengths[i] = {};
				}

				newLengths[i][j] = len;

				mark.newLength = len;

				if(newWidth != mark.resizeShadow.getWidth())
				{
					need_update = true;
					mark.resizeShadow.setWidth(newWidth);
				}
			}
		});

		if(need_update)
		{
			my.selectionResizeAllowed = true;

			for(var i in newLengths)
			{
				for(var j in newLengths[i])
				{
					var except 		= {};
					except[i] 		= {};
					except[i][j] 	= true;
					if(my.model.canAddNoteAt(i, j, newLengths[i][j], except, newLengths))
					{
						if(my.marks[i][j].resizeAllowed === false)
						{
							my.marks[i][j].resizeAllowed = true;
							
							var shadow = my.marks[i][j].resizeShadow;

							shadow.setFill(shadow.oldFill);
							shadow.setOpacity(shadow.oldOpacity);
						}
					}
					else
					{
						if(my.marks[i][j].resizeAllowed !== false)
						{
							my.marks[i][j].resizeAllowed = false;

							var shadow = my.marks[i][j].resizeShadow;

							shadow.oldFill = shadow.getFill();
							shadow.oldOpacity = shadow.getOpacity();

							shadow.setFill('red');
							shadow.setOpacity(0.6);
						}

						my.selectionResizeAllowed = false;
					}
				}
			}
		}

		if(need_update)
		{
			my.selectionLayer.draw();
		}
	};

	this.endSelectionResize = function(e)
	{
		var newSelection = {};

		if(my.selectionResizeAllowed)
		{
			my.makeSnapshot();
		}

		my.eachSelectedMark(function(i, j, mark)
		{
			if(my.selectionResizeAllowed)
			{			
				// Can't both remove and add from the array we are looping on!!
				if(!newSelection[i])
				{
					newSelection[i] = {};
				}

				newSelection[i][j] = mark.newLength;

				if(mark.isRootOfResizeOperation)
				{
					my._penSize = mark.newLength;
				}


				my.removeNote(i, j);
			}

			if(mark.resizeShadow)
			{
				mark.resizeShadow.remove();
				mark.resizeShadow = undefined;
			}
			mark.originalWidth  = undefined;
			mark.resizeAllowed  = undefined;
			mark.newLength 		= undefined;
			mark.isRootOfResizeOperation = undefined;

		});

		for(var i in newSelection)
		{
			for(var j in newSelection[i])
			{
				my.model.addNoteAt(i, j, newSelection[i][j]);
				my.addNoteToViewAt(i, j);
				my.selectMark(i, j);
			}
		}

		my.selectionLayer.draw();
		my.setMarksListening(true);
	};

	this.makeSnapshot = function(options)
	{
		if(options === undefined)
		{
			options = {};
		}

		if(my.history)
		{
			my.makeSnapshotBeforeLoad = true;

			var selection = {};
			my.eachSelectedMark(function(i, j){
				if(my.selection[i][j])
				{
					if(!selection[i])
					{
						selection[i] = {};
					}
					selection[i][j] = true;
				}
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

			var topLeftVisible = my.getNoteAndSemitone(container.scrollLeft(), container.scrollTop());

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

	this.removeAllFromGrid = function()
	{
		this.eachNote(function(i, j){
			my.removeNote(i, j);
		});
	};

	this.addModelNotesToView = function()
	{
		this.eachNote(function(i, j){
			my.addNoteToViewAt(i, j, {draw: false});
		});

		this.marksLayer.draw();
	};

	this.loadSnapshot = function(h)
	{
		if(my.makeSnapshotBeforeLoad === true)
		{
			my.makeSnapshot({apply: false});
			my.makeSnapshotBeforeLoad = false;
		}

		my.removeAllFromGrid();

		my.model.notes = JSON.parse(h.notes);
		my.addModelNotesToView();

		var selection = JSON.parse(h.selection);

		for(var i in selection)
		{
			for(var j in selection[i])
			{
				if(selection[i][j])
				{
					my.selectMark(i, j);
				}
			}
		}

		my.marksLayer.draw();
		my.selectionLayer.draw();
		var scrollTo = my.noteTopLeft(h.topLeftVisible.note, h.topLeftVisible.semitone);
		console.log(h.topLeftVisible, scrollTo);
		$('#pattern-view-container').scrollTo({top: scrollTo.y, left: scrollTo.x}, 500);
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

	this.eachSelectedMark = function(callback)
	{
		for(var i in my.selection)
		{
			for(var j in my.selection[i])
			{
				if(my.selection[i][j])
				{
					var do_continue = callback(i, j, my.selection[i][j]);
					if(do_continue === false)
					{
						return;
					}
				}
			}
		}
	};

	this.eachNote = function(callback)
	{
		for(var i in my.model.notes)
		{
			for(var j in my.model.notes[i])
			{
				if(my.model.notes[i][j])
				{
					var do_continue = callback(i, j, my.model.notes[i][j]);
					if(do_continue === false)
					{
						return;
					}
				}
			}
		}
	};

	this.init(options);
};