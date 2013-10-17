var Grid = function()
{
	var my;

	this.initGrid = function(options)
	{
		my = this;

		if(!my.model)return;

		this.markColor = options.markColor || 'blue';

		this.container = options.container;

		this.model = options.model;

		this.cellWidth  = options.cellWidth;
		this.cellHeight = options.cellHeight;

		this.penSize = options.penSize || 4;

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

		if(this.eventsLayer)
		{
			this.eventsLayer.remove();
		}

		if(this.marksLayer)
		{
			this.marksLayer.remove();
		}

		if(this.selectionLayer)
		{
			this.selectionLayer.remove();
		}

		if(this.backgroundLayer)
		{
			this.backgroundLayer.remove();
		}

		this.backgroundLayer = new Kinetic.Layer();
		this.stage.add(this.backgroundLayer);

		this.eventsLayer = new Kinetic.Layer();
		this.eventsReceiver = new Kinetic.Rect({
			x: 0,
			y: 0,
			width: this.getWidth(),
			height: this.getHeight(),
			opacity: 0
		});
		this.eventsLayer.add(this.eventsReceiver);
		this.stage.add(this.eventsLayer);

		this.marksLayer = new Kinetic.Layer();

		this.stage.add(this.marksLayer);

		this.selectionLayer = new Kinetic.Layer();
		this.stage.add(this.selectionLayer);

		this.wireDND();

		this.useMap 	 	= {};
		this.marksMap 	 	= {};
		this.selectionMap 	= {};

		this.selectionId = 0;
		this.operationId = 0;

		this.draw();
	};

	this.set2DArrayAt = function(arr, row, col, value)
	{
		if(!arr[row])arr[row]={};
		arr[row][col] = value;
		return value;
	}

	this.get2DArrayAt = function(arr, row, col)
	{
		if(!arr || !arr[row])return undefined;
		return arr[row][col];
	}

	this.iterate2DArray = function(arr, callback)
	{
		for(var i in arr)
		{
			for(var j in arr[i])
			{
				if(arr[i][j] !== undefined)
				{
					var cntn = callback(i, j, arr[i][j]);
					if(cntn === false)return;
				}
			}
		}
	}

	this.getInt2DArrayKeys = function(arr)
	{
		var keys = [];
		this.iterate2DArray(arr, function(i,j){
			keys.push([parseInt(i), parseInt(j)]);
		});
		return keys;
	};

	this.map2DArray = function(arr, callback)
	{
		if(!callback)
		{
			callback = function(v){return v;};
		}
		var res = {};
		this.iterate2DArray(arr, function(i, j, value){
			my.set2DArrayAt(res, i, j, callback(value));
		});
		return res;
	};

	this.diff2DArrayKeys = function(a, b)
	{
		var res = {};

		this.iterate2DArray(a, function(i, j, v){
			if(my.get2DArrayAt(b, i, j) === undefined)
			{
				my.set2DArrayAt(res, i, j, v);
			}
		});

		return res;
	};

	this.setUseMapAt = function(row, col, value)
	{
		return this.set2DArrayAt(this.useMap, row, col, value);
	};

	this.getUseMapAt = function(row, col)
	{
		return this.get2DArrayAt(this.useMap, row, col);
	};

	this.setMarksMapAt = function(row, col, value)
	{
		return this.set2DArrayAt(this.marksMap, row, col, value);
	};

	this.getMarksMapAt = function(row, col)
	{
		return this.get2DArrayAt(this.marksMap, row, col);
	}

	this.setSelectionMapAt = function(row, col, value)
	{
		return this.set2DArrayAt(this.selectionMap, row, col, value);
	};

	this.getSelectionMapAt = function(row, col)
	{
		return this.get2DArrayAt(this.selectionMap, row, col);
	};

	this.eachMark = function(callback)
	{
		this.iterate2DArray(this.marksMap, callback);
	};

	this.eachSelectedMark = function(callback)
	{
		this.iterate2DArray(this.selectionMap, callback);
	};

	this.eachUseMapCell = function(callback)
	{
		this.iterate2DArray(this.useMap, callback);
	};

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

		this.eventsReceiver.on('mousedown', function(e){

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

		this.eventsReceiver.on('mousemove', function(e){
			if(my.mightDrag === true)
			{
				my.dragging 	= true;
				my.mightDrag	= false;
				my.eventsReceiver.moveToTop();
				my.eventsLayer.draw();

				my.dragStart(info(e));
				lastPos  = {x: e.layerX, y: e.layerY};
			}
			else if(my.dragging)
			{
				my.dragMove(info(e));
				lastPos  = {x: e.layerX, y: e.layerY};
			}
		});

		this.eventsReceiver.on('mouseup', function(e){			
			if(my.mightDrag === true)
			{
				my.mightDrag = false;
				my.click(e);
			}
			else if(my.dragging === true)
			{
				my.dragging  = false;
				my.eventsReceiver.moveToBottom();
				my.eventsLayer.draw();

				my.dragEnd(info(e));
			}
		});
	};

	this.dragStart = function(e)
	{
		var rc = this.XYtoRowCol(e.startPos.x, e.startPos.y);
		var rowcol = this.getUseMapAt(rc.row, rc.col);
		if(!rowcol)
		{
			this.dragStartOnGrid(e);
		}
		else
		{
			this.dragStartOnMark(rowcol.row, rowcol.col, this.getMarksMapAt(rowcol.row, rowcol.col), e);
		}
	};

	this.dragEnd = function(e)
	{
		if(this.selecting === true)
		{
			this.removeSelectionRect(e);
			this.selecting = false;
			this.areaSelectionEnded(e);
		}
		else if(this.movingSelection === true)
		{
			this.movingSelection = false;
			this.endMoveOperation(e);
		}
		else if(this.resizingSelection === true)
		{
			this.endResizeOperation(e);
		}
	};

	this.dragMove = function(e)
	{
		if(this.selecting === true)
		{
			this.updateSelectionRect(e);
			this.areaSelectionChanged(e);
		}
		else if(this.movingSelection === true)
		{
			this.moveSelection(e);
		}
		else if(this.resizingSelection === true)
		{
			this.resizeSelection(e);
		}
	};

	this.dragStartOnGrid = function(e)
	{
		this.selecting = true;
		this.drawSelectionRect(e);
		this.areaSelectionStarted(e);
	};

	this.dragStartOnMark = function(row, col, mark, e)
	{
		if(!mark.isSelected)
		{
			var deSelected = this.getInt2DArrayKeys(this.selectionMap);
			this.clearSelection();
			this.selectMark(row, col);
			this.selectionId++;
			this.onSelectionChanged([parseInt(row), parseInt(col)], [parseInt(row), parseInt(col)], deSelected);
		}

		if(mark.shape.getX()+mark.shape.getWidth() - e.currentPos.x < 15)
		{
			mark.isRootOfResizeOperation = true;
			this.initiateResizeOperation(row, col, mark, e);
		}
		else
		{
			this.initiateMoveOperation(row, col, mark, e);
		}
	};

	this.initiateResizeOperation = function(row, col, mark, e)
	{
		this.resizingSelection = true;

		this.eachSelectedMark(function(i, j)
		{
			var mark = my.getMarksMapAt(i, j);

			var shadow = new Kinetic.Rect({
				x: mark.shape.getX(),
				y: mark.shape.getY(),
				width: mark.shape.getWidth(),
				height: mark.shape.getHeight(),
				fill: 'green',
				opacity: 1,
				stroke: 'black',
				strokeWidth: 1
			});

			mark.resizeShadow = shadow;
			mark.originalWidth = mark.shape.getWidth();
			
			mark.resizeShadow.setListening(false);
			my.selectionLayer.add(mark.resizeShadow);

			mark.newLength = mark.length;
		});

		this.resizeSelection(e);
		this.selectionLayer.draw();
	};

	this.resizeSelection = function(e)
	{
		var need_update = false;

		var tmpUseMap = {};
		var changedMarks = {};

		var dLength = Math.floor((e.currentPos.x - e.startPos.x)/my.cellWidth);

		this.eachSelectedMark(function(i, j){
			var mark = my.getMarksMapAt(i, j);
			var newLength;

			if((newLength = mark.length + dLength) > 0)
			{
				mark.newLength 	= newLength;
				var newWidth 	= newLength*my.cellWidth -1;

				for(var k=0; k<newLength; k++)
				{
					my.set2DArrayAt(tmpUseMap, i, parseInt(j)+k, {row: i, col:j});
				}

				my.set2DArrayAt(changedMarks, i, j, newLength);

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

			this.iterate2DArray(changedMarks, function(i, j, length){
				var mark 	= my.getMarksMapAt(i, j);

				var ignore 	= {};
				my.set2DArrayAt(ignore, i, j, true);

				if(my.canAddMarkAt(i, j, length, ignore, changedMarks, tmpUseMap))
				{
					if(mark.resizeAllowed === false)
					{
						mark.resizeAllowed = true;
						mark.resizeShadow.setFill(mark.resizeShadow.oldFill);
						mark.resizeShadow.setOpacity(mark.resizeShadow.oldOpacity);
					}
				}
				else
				{
					if(mark.resizeAllowed !== false)
					{
						mark.resizeAllowed = false;
						mark.resizeShadow.oldFill 	 = mark.resizeShadow.getFill();
						mark.resizeShadow.oldOpacity = mark.resizeShadow.getOpacity();

						mark.resizeShadow.setFill('red');
						mark.resizeShadow.setOpacity(0.6);
					}

					my.selectionResizeAllowed = false;
				}
			});

			this.selectionLayer.draw();
		}

	};

	this.endResizeOperation = function(e)
	{
		this.resizingSelection = false;

		var newSelection = {};
		var addedMarks 	 = [];
		var removedMarks = [];

		this.eachSelectedMark(function(i, j){
			var mark = my.getMarksMapAt(i, j);

			if((my.selectionResizeAllowed === true) && (mark.newLength != mark.length))
			{
				my.set2DArrayAt(newSelection, i, j, mark.newLength);
				if(mark.isRootOfResizeOperation === true)
				{
					my.penSize = mark.newLength;
				}
				my.removeMarkAt(i, j);
				removedMarks.push({row: i, col: j, length: mark.length});
			}

			mark.resizeShadow.remove();
			mark.resizeShadow 				= undefined;
			mark.originalWidth 				= undefined;
			mark.newLength					= undefined;
			mark.isRootOfResizeOperation 	= undefined;
		});

		this.iterate2DArray(newSelection, function(i, j, length){
			my.addMarkAt(i, j, length);
			my.selectMark(i, j);
			addedMarks.push({row: i, col: j, length: length});
		});

		my.selectionLayer.draw();
		my.marksLayer.draw();

		this.onMarksRemoved(removedMarks);
		this.onMarksAdded(addedMarks);
		this.onOperationCompleted();

		this.operationId++;
	};

	this.initiateMoveOperation = function(row, col, mark, e)
	{
		this.selectionMoveIsCopy = e.mouseEvent.ctrlKey;

		if(this.selectionMoveIsCopy)
		{
			this.selectionMayChange();
		}

		this.movingSelection = true;

		this.eachSelectedMark(function(i, j){
			var mark = my.getMarksMapAt(i, j);

			var shadow = new Kinetic.Rect({
				x: mark.shape.getX(),
				y: mark.shape.getY(),
				width: mark.shape.getWidth(),
				height: mark.shape.getHeight(),
				fill: mark.shape.getFill(),
				opacity: 0.4,
				stroke: 'black',
				strokeWidth: 1
			});

			shadow.setListening(false);

			mark.moveShadow = shadow;
			mark.freeMoveX  = mark.shape.getX();
			mark.freeMoveY  = mark.shape.getY();

			
			my.selectionLayer.add(mark.moveShadow);

		});

		this.moveSelection(e);
	};

	this.moveSelection = function(e)
	{
		var needDraw 	= false;
		var dropAllowed = true;

		this.eachSelectedMark(function(i, j)
		{
			var mark 	= my.getMarksMapAt(i, j);

			var shadow = mark.moveShadow;

			mark.freeMoveX += e.delta.x;
			mark.freeMoveY += e.delta.y;

			var targetLogicalPos 	= my.XYtoRowCol(mark.freeMoveX, mark.freeMoveY);
			var targetPos 		 	= my.RowColToXY(targetLogicalPos.row, targetLogicalPos.col);
			mark.targetLogicalPos 	= targetLogicalPos;

			targetPos.x += 1;

			if((shadow.getX() != targetPos.x || shadow.getY() != targetPos.y))
			{
				needDraw = true;
			}

			shadow.setPosition(targetPos);

			// Check if we can drop
			if(my.canAddMarkAt(
					targetLogicalPos.row, 
					targetLogicalPos.col,
					mark.length,
					(my.selectionMoveIsCopy ? undefined : my.selectionMap)
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

	this.endMoveOperation = function(e)
	{
		var addedMarks 	 = [];
		var removedMarks = [];

		var newSelection = {};

		this.eachSelectedMark(function(i, j)
		{
			var mark = my.getMarksMapAt(i, j);

			mark.moveShadow.remove();
			mark.moveShadow = undefined;
			mark.freeMoveX  = undefined;
			mark.freeMoveY  = undefined;

			if(my.selectionDropAllowed)
			{
				var row = mark.targetLogicalPos.row;
				var col = mark.targetLogicalPos.col;

				if(my.selectionMoveIsCopy)
				{
					my.unselectMark(i, j);
				}
				else
				{
					my.removeMarkAt(i, j);
					removedMarks.push({row: i, col: j, length: mark.length});
				}

				my.set2DArrayAt(newSelection, row, col, mark.length);
			}
		});

		this.iterate2DArray(newSelection, function(i, j, length){
			my.addMarkAt(i, j, length);
			my.selectMark(i, j);
			addedMarks.push({row: i, col: j, length: length});
		});
		
		this.onMarksRemoved(removedMarks);		
		this.onMarksAdded(addedMarks);
		this.onOperationCompleted();

		if(this.selectionMoveIsCopy)
		{
			this.maybeFireSelectionChangeEvent();
		}

		my.selectionLayer.draw();
		my.marksLayer.draw();

		this.operationId++;
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
		this.selectionMayChange();
		this.selectionAtStart = this.map2DArray(this.selectionMap);

		if(!e.mouseEvent.ctrlKey)
		{
			this.clearSelection();
			this.marksLayer.draw();
		}
	};

	this.selectionMayChange = function()
	{
		this.selectionAtStart = this.map2DArray(this.selectionMap);
	};

	this.areaSelectionChanged = function(e)
	{
		this.computeSelection(e.topLeft.x, e.topLeft.y, e.size.width, e.size.height);
	};

	this.areaSelectionEnded = function(e)
	{
		this.selectionId++;
		if(this.maybeFireSelectionChangeEvent())
		{
			this.onOperationCompleted();
		}
		this.operationId++;
	};

	this.clearSelection = function()
	{
		this.eachSelectedMark(function(i, j){
			my.unselectMark(i, j);
		});
	};

	this.maybeFireSelectionChangeEvent = function()
	{
		var newlySelected 	= this.getInt2DArrayKeys(
								this.diff2DArrayKeys(this.selectionMap, this.selectionAtStart)
							);

		var deSelected 		= this.getInt2DArrayKeys(
								this.diff2DArrayKeys(this.selectionAtStart, this.selectionMap)
							); 
 		
 		var ret = false;
		if(newlySelected.length !== 0 || deSelected.length !== 0)
		{
			ret = true;
			this.onSelectionChanged(this.getInt2DArrayKeys(this.selectionMap), newlySelected, deSelected);
		}

		this.selectionAtStart = undefined;
		return ret;
	};

	this.computeSelection = function(x, y, width, height)
	{
		var selectionChanged = false;

		this.eachMark(function(i, j, mark){
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
					mark.selectionId = my.selectionId;
				}
				
			}
			else
			{
				// Selection does not intersect mark
				if(mark.isSelected && mark.selectionId == my.selectionId)
				{
					my.unselectMark(i, j, mark);
					selectionChanged = true;
				}
			}
		});

		if(selectionChanged)
		{
			this.marksLayer.draw();
		}
	}

	this.selectMark = function(row, col, mark)
	{
		if(mark == undefined)
		{
			mark = this.getMarksMapAt(row, col);
		}

		this.setSelectionMapAt(row, col, true);

		mark.isSelected = true;
		mark.selectionId = this.selectionId;

		mark.shape.previousOpacity 	= mark.shape.getOpacity();
		mark.shape.previousFill  	= mark.shape.getFill();
		mark.shape.setOpacity(0.9);
		mark.shape.setFill('yellow');
	};

	this.unselectMark = function(row, col, mark)
	{
		if(mark === undefined)
		{
			mark = this.getMarksMapAt(row, col);
			if(mark === undefined)return;
		}

		this.setSelectionMapAt(row, col, undefined);

		mark.isSelected 	= false;
		mark.selectionId 	= undefined;

		mark.shape.setOpacity(mark.shape.previousOpacity);
		mark.shape.setFill(mark.shape.previousFill);
	};

	this.click = function(e)
	{
		var rc = this.XYtoRowCol(e.layerX, e.layerY);
		this.gridClicked(rc.row, rc.col, e);
	};

	this.markClicked = function(row, col, mark, e)
	{
		this.selectionMayChange();

		if(e.button === 0)
		{
			if(!e.ctrlKey)
			{
				this.clearSelection();
			}

			if(mark.isSelected)
			{
				this.unselectMark(row, col, mark);
			}
			else
			{
				this.selectMark(row, col);
				this.selectionId++;
			}

			this.marksLayer.draw();
		}
		else if(e.button === 2)
		{
			this.removeMarkAt(row, col);
			this.marksLayer.draw();
			this.onMarksRemoved([{row: row, col: col, length: mark.length}]);
		}

		this.maybeFireSelectionChangeEvent();
		this.onOperationCompleted();
		this.operationId++;
	};

	this.gridClicked = function(row, col, e)
	{
		var rc;
		if(rc=this.getUseMapAt(row, col))
		{
			this.markClicked(rc.row, rc.col, this.getMarksMapAt(rc.row, rc.col), e);
		}
		else
		{
			if(this.addMarkAt(row, col, this.penSize))
			{
				this.marksLayer.draw();	
				this.onMarksAdded([{row: row, col: col, length: this.penSize}]);
				this.onOperationCompleted();
				this.operationId++;
			}
		}

	};

	/*
	* Check if we can add a mark at ('row', 'col') with length 'length'
	* - ignore collisions with marks in 'ignore' [2DArray]
	* - user 'overriddenUseMap' instead of default one to detect collisions with things in 'overriddenMarks'
	*/

	this.canAddMarkAt = function(row, col, length, ignore, overriddenMarks, overriddenUseMap)
	{
		for(var c=0; c<length; c++)
		{
			var rc = this.getUseMapAt(row, parseInt(col)+c);

			if(rc)
			{
				// We have a collision
				var overriden = this.get2DArrayAt(overriddenMarks, rc.row, rc.col);
				if(overriden)
				{
					// For this mark, we need to use the overridenUseMap
					rc = this.get2DArrayAt(overriddenUseMap, row, parseInt(col)+c);
				}
				if(!ignore || !ignore[rc.row] || !ignore[rc.row][rc.col])
				{
					// We have a collision in the correct map and we don't want to ignore it: return false
					return false;
				}
			}
		}
		return true;
	};

	this.addMarkAt = function(row, col, length)
	{
		if(!this.canAddMarkAt(row, col, length))
		{
			return false;
		}
		
		for(var c=0; c<length; c++)
		{
			this.setUseMapAt(row, parseInt(col)+c, {row: row, col: col});
		}

		var xy = this.RowColToXY(row, col);

		var rect = new Kinetic.Rect({
			x: xy.x + 1,
			y: xy.y + 1,
			width: this.cellWidth*length - 2,
			height: this.cellHeight - 2,
			fill: this.markColor,
			opacity: 0.7,
			stroke: 'black',
			strokeWidth: 1
		});

		rect.setListening(false);

		this.setMarksMapAt(row, col, {
			length: length,
			shape: rect
		});

		this.marksLayer.add(rect);

		return true;
	};

	this.removeMarkAt = function(row, col)
	{
		var mark = this.getMarksMapAt(row, col);

		this.unselectMark(row, col, mark);

		for(var c=0; c<mark.length; c++)
		{
			this.setUseMapAt(row, parseInt(col)+c, false);
		}

		mark.shape.remove();
		this.setMarksMapAt(row, col, undefined);
	};

	this.XYtoRowCol = function(x, y)
	{
		return {row: Math.floor(y/this.cellHeight), col: Math.floor(x/this.cellWidth)};
	};

	this.RowColToXY = function(r, c)
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
		this.eventsLayer.draw();
		this.marksLayer.draw();
		this.selectionLayer.draw();
	};

	this.removeAllMarks = function()
	{
		this.eachMark(function(i, j, mark)
		{
			my.removeMarkAt(i, j, mark);
		});
	};

	if(!this.onMarksAdded)
	{
		this.onMarksAdded = function(){};
	}

	if(!this.onMarksRemoved)
	{
		this.onMarksRemoved = function(){};
	}

	if(!this.onSelectionChanged)
	{
		this.onSelectionChanged = function(){};
	}

	if(!this.onOperationCompleted)
	{
		this.onOperationCompleted = function(){};
	}

	this.makeSnapshot = function(options)
	{		
		if(options === undefined)
		{
			options = {};
		}

		if(my.model.history)
		{
			var selection = {};
			my.eachSelectedMark(function(i, j){
				my.set2DArrayAt(selection, i, j, true);
			});

			var container = $('#' + this.container);

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
				data: JSON.stringify(my.getModelData()),
				selection: JSON.stringify(selection),
				image: data,
				topLeftVisible: topLeftVisible,
			};

			if(this.onSnapshot)
			{
				this.onSnapshot(h, options);
			}

			var r = my.model.history.record(h, options);

			if(this.postSnapshot)
			{
				this.postSnapshot(r, options);
			}
		}
	};

	this.loadSnapshot = function(h)
	{
		my.removeAllMarks();

		my.setModelData(JSON.parse(h.data));
		my.addModelDataToView();


		my.iterate2DArray(JSON.parse(h.selection), function(i, j){
			my.selectMark(i, j);
		});

		my.marksLayer.draw();
		my.selectionLayer.draw();
		var scrollTo = my.RowColToXY(h.topLeftVisible.row, h.topLeftVisible.col);
		$('#'+my.container).scrollTo({top: scrollTo.y, left: scrollTo.x}, 500);
	};

};
