var SequencerView = function(options)
{
	var my = this;
	
	this.drawGrid = function()
	{
		var y = 0;
		var w = this.getWidth();
		var h = this.getHeight();
		var ntracks   = this.model.getTrackCount();
		var nmeasures = this.model.getMeasureCount();

		var fills = ['#DFDFDF', '#EFEFEF'];

		for(var i=0; i<ntracks; i++)
		{
			var rect = new Kinetic.Rect({
				x: 0,
				y: y,
				width: w,
				height: this.cellHeight,
				fill: fills[i % 2],
				listening: false
			});			
			this.backgroundLayer.add(rect);

			var x = 0;
			for(var j=0; j<nmeasures; j++)
			{
				this.backgroundLayer.add(new Kinetic.Line({
					points: [x, 0, x, h],
					stroke: '#CCC',
					strokeWidth: 0.5,
					listening: false
				}));
				x += this.cellWidth;
			}

			rect.moveToBottom();

			y+=this.cellHeight;
		}
		this.backgroundLayer.draw();
	};

	this.getCellsPerRowCount = function()
	{
		return this.model.getMeasureCount();
	};

	this.getRowCount = function(song)
	{
		return this.model.getTrackCount();
	};

	this.getModelData = function()
	{
		return this.model.segments;
	};

	this.setModelData = function(data)
	{
		this.model.segments = data;
	}

	this.addModelDataToView = function()
	{
		this.iterate2DArray(this.getModelData(), function(track, measure, length){
			my.addMarkAt(track, measure, length);
		});
	};

	this.onOperationCompleted = function()
	{
		this.makeSnapshot();
	};

	this.onMarksAdded = function(marks, operationId){
		for(var i in marks)
		{
			this.model.addSegmentAt(marks[i].row, marks[i].col, marks[i].length);
		}
	};

	this.onMarksRemoved = function(marks, operationId){
		for(var i in marks)
		{
			this.model.removeSegmentAt(marks[i].row, marks[i].col);
		}
	};

	this.init(options);
	this.drawGrid();
};

SequencerView.prototype = new Grid();
SequencerView.prototype.constructor = SequencerView;