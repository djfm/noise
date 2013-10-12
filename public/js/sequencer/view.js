var SequencerView = function(options)
{
	var my = this;
	
	this.drawGrid = function()
	{
		//this.backgroundLayer.removeChildren();

		var y = 0;
		var w = this.getWidth();
		var h = this.getHeight();

		this.stage.setHeight(this.getHeight());

		var fills = ['#DFDFDF', '#EFEFEF'];

		var top = new Kinetic.Rect({
			x: 0,
			y: 0,
			width: this.cellWidth,
			height: this.cellHeight,
			fill: fills[0],
			listening: false
		});	

		var bottom = new Kinetic.Rect({
			x: 0,
			y: this.cellHeight,
			width: this.cellWidth,
			height: this.cellHeight,
			fill: fills[1],
			listening: false
		});

		var line = new Kinetic.Line({
			points: [this.cellWidth, 0, this.cellWidth, 2*this.cellHeight],
			stroke: "#BBB",
			strokeWidth: 1
		});

		var tmpLayer = new Kinetic.Layer();
		tmpLayer.add(top);
		tmpLayer.add(bottom);
		tmpLayer.add(line);

		var imgData = tmpLayer.toDataURL({x:0, y:0, width: this.cellWidth, height: 2*this.cellHeight});
		this.backgroundLayer.canvas.element.style.backgroundImage = "url("+imgData+")";
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

	this.activateTrack = function(track)
	{
		for(var i in this.model.tracks)
		{
			this.model.tracks[i].config.active = undefined;
		}
		this.activeTrack = track;
		this.patternView.setModel(this.model.tracks[track]);
		this.model.tracks[this.activeTrack].config.active = true;
	};

	this.storeActiveTrackNumber = function()
	{
		for(var i in this.model.tracks)
		{
			if(this.model.tracks[i].config.active === true)
			{
				this.activeTrack = i;
				break;
			}
		}
	};

	this.setModel = function(model)
	{
		var scope = this.model.history.scope;
		options.model = model;
		this.init(options);
		this.model.history.scope = scope;
		scope.history = this.model.history;

		this.activateTrack(this.activeTrack || 0);
	};

	this.init = function(options)
	{
		this.patternView = options.patternView;
		this.initGrid(options);
		this.drawGrid();

		this.model.history.onRecord = function()
		{
			$('div.sequencer-history.selected').removeClass('selected');
		};

		this.addModelDataToView();
		this.marksLayer.draw();

	};

	this.swapTracks = function(a, b)
	{
		if(a != b)
		{
			var tmp = this.model.tracks[a];
			this.model.tracks[a] = this.model.tracks[b];
			this.model.tracks[b] = tmp;

			this.removeAllMarks();
			tmp = this.model.segments[a];
			this.model.segments[a] = this.model.segments[b];
			this.model.segments[b] = tmp;
			this.addModelDataToView();
			this.marksLayer.draw();
			this.makeSnapshot({apply: false});
			this.storeActiveTrackNumber();
		}
	};

	this.removeTrack = function(id)
	{
		id = parseInt(id);

		this.removeAllMarks();
		
		for(var i=id; i<this.model.tracks.length; i++)
		{
			this.model.segments[i] = this.model.segments[i+1];
		}

		this.model.tracks.splice(id, 1);


		this.initGrid(options);
		this.drawGrid();
		this.addModelDataToView();
		this.marksLayer.draw();
		this.makeSnapshot({apply: false});
		this.storeActiveTrackNumber();

	};

	this.addTrack = function()
	{
		var id = this.model.addTrack();

		this.activateTrack(id);
		this.stage.setHeight(this.getHeight());
		this.eventsReceiver.setHeight(this.getHeight());
		this.eventsLayer.draw();

		this.makeSnapshot({apply: false});

		return id;
	};

	this.init(options);
	
};

SequencerView.prototype = new Grid();
SequencerView.prototype.constructor = SequencerView;