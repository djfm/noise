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
	};

	this.makeSnapshot = function(options)
	{
		if(options === undefined)
		{
			options = {};
		}

		if(my.model.history)
		{

			my.model.history.at = 0;

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
				image: data,
				selection: JSON.stringify(selection),
				topLeftVisible: topLeftVisible,
				song: my.model.serialize({history: false})
			};

			my.model.history.record(h, options);

			if(options.apply !== false)
			{
				my.sequencerService.updateSequencerScope();
			}
		}
	};

	this.loadSnapshot = function(h)
	{
		var model = Song.deserialize(h.song);
		model.history = this.model.history;

		this.setModel(model);


		my.iterate2DArray(JSON.parse(h.selection), function(i, j){
			my.selectMark(i, j);
		});

		my.marksLayer.draw();

		var scrollTo = my.RowColToXY(h.topLeftVisible.row, h.topLeftVisible.col);
		$('#'+my.container).scrollTo({top: scrollTo.y, left: scrollTo.x}, 500);
	};

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
		this.model.activeTrack = track;
		this.patternView.setModel(this.model.tracks[track]);
		this.model.tracks[this.model.activeTrack].config.active = true;
	};

	this.storeActiveTrackNumber = function()
	{
		for(var i in this.model.tracks)
		{
			if(this.model.tracks[i].config.active === true)
			{
				this.model.activeTrack = i;
				break;
			}
		}
	};

	this.setModel = function(model)
	{
		options.model = model;
		this.init(options);

		this.activateTrack(this.model.activeTrack || 0);
	};

	this.init = function(options)
	{
		this.sequencerService = options.sequencerService;
		this.patternView = options.patternView;
		this.initGrid(options);
		this.drawGrid();

		this.model.history.onRecord = function()
		{
			$('div.sequencer-history.selected').removeClass('selected');
		};

		this.addModelDataToView();

		if(options.draw !== false)
		{
			this.marksLayer.draw();
		}
	};

	this.swapTracks = function(a, b)
	{
		if(a != b)
		{
			var tmp = my.model.tracks[a];
			my.model.tracks[a] = my.model.tracks[b];
			my.model.tracks[b] = tmp;

			my.removeAllMarks();
			tmp = my.model.segments[a];
			my.model.segments[a] = my.model.segments[b];
			my.model.segments[b] = tmp;
			my.addModelDataToView();
			my.marksLayer.draw();
			my.makeSnapshot({apply: false});
			my.storeActiveTrackNumber();
		}
	};

	this.removeTrack = function(id)
	{
		id = parseInt(id);

		var activate = undefined;
		if(this.model.tracks[id].config.active)
		{
			activate = id > 0 ? (id-1) : 0;
		}

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

		if(activate !== undefined)
		{
			this.activateTrack(activate);
		}
		else
		{
			this.storeActiveTrackNumber();
		}

		this.makeSnapshot({apply: false});
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