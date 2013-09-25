var Grid = function()
{
	var my;

	this.init = function(options)
	{
		my = this;

		this.container = options.container;

		this.model = options.model;

		this.cellWidth  = options.cellWidth;
		this.cellHeight = options.cellHeight;

		this.penSize = options.penSize || 4;

		this.getCellsPerRowCount = function()
		{
			return options.getCellsPerRowCount(this.model);
		};

		this.getRowCount = function()
		{
			return options.getRowCount(this.model);
		};

		if(!this.stage)
		{
			this.stage = new Kinetic.Stage({
				container: options.container,
				width: this.getWidth(),
				height: this.getHeight()
			});

			$('#'+options.container).on('contextmenu', function(e){
			  e.preventDefault();
			});
		}

		if(this.backgroundLayer)
		{
			this.backgroundLayer.remove();
		}

		if(this.marksLayer)
		{
			this.marksLayer.remove();
		}

		if(this.selectionLayer)
		{
			this.selectionLayer.remove();
		}

		this.backgroundLayer = new Kinetic.Layer();
		this.background = new Kinetic.Rect({
			x: 0,
			y: 0,
			width: this.getWidth(),
			height: this.getHeight(),
			opacity: 0
		});
		this.backgroundLayer.add(this.background);
		this.stage.add(this.backgroundLayer);

		this.marksLayer = new Kinetic.Layer();

		this.stage.add(this.marksLayer);

		this.selectionLayer = new Kinetic.Layer();
		this.stage.add(this.selectionLayer);

		this.wireDND();

		this.useMap 	 = {};
		this.marksMap 	 = {};
		this.selectionId = 0;

		this.draw();
	};

	this.markArrayAt = function(arr, row, column, value)
	{
		if(!arr[row])arr[row]={};
		arr[row][column] = value;
		return value;
	}

	this.getArrayMarkAt = function(arr, row, column)
	{
		if(!arr[row])return undefined;
		return arr[row][column];
	}

	this.markUseMapAt = function(row, column, value)
	{
		return this.markArrayAt(this.useMap, row, column, value);
	};

	this.getUseMapAt = function(row, column)
	{
		return this.getArrayMarkAt(this.useMap, row, column);
	}

	this.setMarkAt = function(row, column, value)
	{
		return this.markArrayAt(this.marksMap, row, column, value);
	};

	this.getMarkAt = function(row, column)
	{
		return this.getArrayMarkAt(this.marksMap, row, column);
	}

	this.wireDND = function()
	{
		this.mightDrag = false;
		this.dragging  = false;

		var startPos;
		var lastPos;

		var info = function(event)
		{
			return {
				startPos: startPos,
				currentPos: {x: event.layerX, y: event.layerY},
				delta: {x: event.layerX - lastPos.x, y: event.layerY - lastPos.y},
				size: {
					width: Math.abs(event.layerX - startPos.x),
					height: Math.abs(event.layerY - startPos.y)
				},
				topLeft: {
					x: Math.min(event.layerX, startPos.x),
					y: Math.min(event.layerY, startPos.y)
				},
				mouseEvent: event
			};
		};

		this.background.on('mousedown', function(e){

			startPos = {x: e.layerX, y: e.layerY};
			lastPos  = {x: e.layerX, y: e.layerY};

			if(my.dragging === true)
			{
				my.dragging = false;
				my.dragEnd(info(e));
			}
			else
			{
				my.mightDrag = true;
			}
		});

		this.background.on('mousemove', function(e){
			if(my.mightDrag === true)
			{
				my.dragging 	= true;
				my.mightDrag	= false;
				my.background.moveToTop();
				my.backgroundLayer.draw();

				my.dragStart(info(e));
				lastPos  = {x: e.layerX, y: e.layerY};
			}
			else if(my.dragging)
			{
				my.dragMove(info(e));
				lastPos  = {x: e.layerX, y: e.layerY};
			}
		});

		this.background.on('mouseup', function(e){			
			if(my.mightDrag === true)
			{
				my.mightDrag = false;
				my.click(e);
			}
			else if(my.dragging === true)
			{
				my.dragging  = false;
				my.background.moveToBottom();
				my.backgroundLayer.draw();

				my.dragEnd(info(e));
			}
		});
	};

	this.dragStart = function(e)
	{
		console.log("dragStart!", e);
		var rc = this.XYtoRC(e.startPos.x, e.startPos.y);
		var rowcol = this.getUseMapAt(rc.r, rc.c);
		if(!rowcol)
		{
			this.dragStartOnGrid(e);
		}
	};

	this.dragEnd = function(e)
	{
		console.log("dragEnd!", e);
		if(this.selecting === true)
		{
			this.removeSelectionRect(e);
			this.selecting = false;
			this.areaSelectionEnded(e);
		}
	};

	this.dragMove = function(e)
	{
		console.log("dragMove!");
		if(this.selecting === true)
		{
			this.updateSelectionRect(e);
			this.areaSelectionChanged(e);
		}
	};

	this.dragStartOnGrid = function(e)
	{
		this.selecting = true;
		this.drawSelectionRect(e);
		this.areaSelectionStarted(e);
	};

	this.drawSelectionRect = function(e)
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
		this.selectionLayer.draw();
	};

	this.updateSelectionRect = function(e)
	{
		this.selectionRect.setPosition(e.topLeft);
		this.selectionRect.setWidth(e.size.width);
		this.selectionRect.setHeight(e.size.height);
		this.selectionLayer.draw();
	}

	this.removeSelectionRect = function(e)
	{
		this.selectionRect.remove();
		this.selectionRect = undefined;
		this.selectionLayer.draw();
	};

	this.areaSelectionStarted = function(e)
	{

	};

	this.areaSelectionChanged = function(e)
	{
		this.computeSelection(e.topLeft.x, e.topLeft.y, e.size.width, e.size.height);
	};

	this.areaSelectionEnded = function(e)
	{

	};

	this.computeSelection = function(x, y, width, height)
	{
		var selectionChanged = false;

		for(var i in my.marksMap)
		{
			for(var j in my.marksMap[i])
			{
				var mark;
				if(mark = my.marksMap[i][j])
				{
					if(!// <- note this NOT
						// Mark is outside selection
						(
							// Completely outside laterally
							(mark.shape.getX() + mark.shape.getWidth() < x)
								||
							(mark.shape.getX() > x + width)

								||
							
							// Completely outside vertically
							(mark.shape.getY() + mark.shape.getHeight() < y)
								||
							(mark.shape.getY() > y + height)
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
		}

		if(selectionChanged)
		{
			this.marksLayer.draw();
		}
	};

	this.selectMark = function(row, col, mark)
	{
		if(mark == undefined)
		{
			mark = this.getMarkAt(row, col);
		}

		mark.isSelected = true;
		mark.selectionId = this.selectionId;

		mark.shape.previousOpacity 	= mark.shape.getOpacity();
		mark.shape.previousFill  	= mark.shape.getFill();
		mark.shape.setOpacity(1);
		mark.shape.setFill('yellow');
	};

	this.unselectMark = function(row, col, mark)
	{
		if(mark == undefined)
		{
			mark = this.getMarkAt(row, col);
		}

		mark.isSelected 	= false;
		mark.selectionId 	= undefined;

		mark.shape.setOpacity(mark.shape.previousOpacity);
		mark.shape.setFill(mark.shape.previousFill);
	};

	this.click = function(e)
	{
		var rc = this.XYtoRC(e.layerX, e.layerY);
		this.gridClicked(rc.r, rc.c, e);
	};

	this.gridClicked = function(row, column, e)
	{
		var rc;
		if(rc=this.getUseMapAt(row, column))
		{
			if(e.button === 2)
			{
				this.removeMarkAt(rc.row, rc.column);
				this.marksLayer.draw();
			}
		}
		else
		{
			this.addMarkAt(row, column, this.penSize);
			this.marksLayer.draw();	
		}
	};

	this.canAddMarkAt = function(row, column, length)
	{
		for(var c=0; c<length; c++)
		{
			if(this.getUseMapAt(row, column+c))
			{
				return false;
			}
		}
		return true;
	};

	this.addMarkAt = function(row, column, length)
	{
		if(!this.canAddMarkAt(row, column, length))
		{
			return false;
		}
		
		for(var c=0; c<length; c++)
		{
			this.markUseMapAt(row, column+c, {row: row, column: column});
		}

		var xy = this.RCtoXY(row, column);

		var rect = new Kinetic.Rect({
			x: xy.x,
			y: xy.y,
			width: this.cellWidth*length,
			height: this.cellHeight,
			fill: 'blue' 
		});

		rect.setListening(false);

		this.setMarkAt(row, column, {
			length: length,
			shape: rect
		});

		this.marksLayer.add(rect);

		return true;
	};

	this.removeMarkAt = function(row, column)
	{
		var mark = this.getMarkAt(row, column);

		for(var c=0; c<mark.length; c++)
		{
			this.markUseMapAt(row, column+c, false);
		}

		mark.shape.remove();
		this.setMarkAt(row, column, undefined);
	};

	this.XYtoRC = function(x, y)
	{
		return {r: Math.floor(y/this.cellHeight), c: Math.floor(x/this.cellWidth)};
	};

	this.RCtoXY = function(r, c)
	{
		return {x: c*this.cellWidth, y: r*this.cellHeight};
	}

	this.getWidth = function()
	{
		return this.getCellsPerRowCount() * this.cellWidth;
	};

	this.getHeight = function()
	{
		return this.getRowCount() * this.cellHeight;
	}

	this.draw = function()
	{
		this.backgroundLayer.draw();
		this.marksLayer.draw();
		this.selectionLayer.draw();
	};
};
