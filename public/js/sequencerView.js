var ScrollBar = function(options)
{
	var my = this;
	my.direction = options.direction;
	my.x = options.x;
	my.y = options.y;
	my.width = options.width;
	my.height = options.height;
	my.layer = options.layer;
	my.scrollerMargin = 2;
	my.minValue = options.minValue;
	my.maxValue = options.maxValue;

	my.onScroll = options.onScroll || function(move){
	};

	my.rect = new Kinetic.Rect({
		x: my.x,
		y: my.y,
		width: my.width,
		height: my.height,
		fill: 'lightyellow',
		stroke: 'black',
		strokeWidth: 1
	});

	my.scrollerSize = function()
	{
		var s = my.direction == "horizontal" ? my.width : my.height;
		return (s+s*s) / (s + my.maxValue - my.minValue);
	};

	if(my.direction == 'horizontal')
	{
		var xmin = function()
		{
			return my.x + my.scrollerMargin
		};

		var xmax = function()
		{
			return my.x + my.width - my.scrollerMargin - my.scrollerSize();
		};

		my.getPos = function()
		{
			return (my.px_pos - xmin())/xmax();
		};

		my.px_pos = xmin();
		my.old_px_pos = xmin();

		my.setPos = function(p)
		{
			p = Math.max(Math.min(p, 1), 0);
			my.px_pos = xmin() + p * (xmax() - xmin());
			var pos = my.scroller.getAbsolutePosition();
			pos.x = my.px_pos;
			my.scroller.setAbsolutePosition(pos);
			my.layer.draw();
			return p;
		}

		my.scroller = new Kinetic.Rect({
			x: my.px_pos,
			y: my.y + my.scrollerMargin,
			width: my.scrollerSize(),
			height: my.height - 2*my.scrollerMargin,
			fill: 'black',
			stroke: 'white',
			strokeWidth: 1,
			draggable: true,
			dragBoundFunc: function(pos){
				var old_px_pos = my.px_pos;
				my.px_pos = Math.min(Math.max(xmin(), pos.x), xmax());
				return {x: my.px_pos, y:this.getAbsolutePosition().y};
			}
		});
	}
	else if(my.direction == 'vertical')
	{
		var ymin = function()
		{
			return my.y + my.scrollerMargin
		};

		var ymax = function()
		{
			return my.y + my.height - my.scrollerMargin - my.scrollerSize();
		};

		my.getPos = function()
		{
			return (my.px_pos - ymin())/ymax();
		};

		my.px_pos = ymin();
		my.old_px_pos = ymin();

		my.setPos = function(p)
		{
			p = Math.max(Math.min(p, 1), 0);
			my.px_pos = ymin() + p * (ymax() - ymin());
			var pos = my.scroller.getAbsolutePosition();
			pos.y = my.px_pos;
			my.scroller.setAbsolutePosition(pos);
			my.layer.draw();
			return p;
		}

		my.scroller = new Kinetic.Rect({
			x: my.x + my.scrollerMargin,
			y: my.px_pos,
			width: my.width - 2*my.scrollerMargin,
			height: my.scrollerSize(),
			fill: 'black',
			stroke: 'white',
			strokeWidth: 1,
			draggable: true,
			dragBoundFunc: function(pos){
				my.px_pos = Math.min(Math.max(ymin(), pos.y), ymax());	
				return {x: this.getAbsolutePosition().x, y: my.px_pos};
			}
		});
	}
	else
	{
		throw "Illegal scrollbar direction: " + my.direction;
	}

	my.scroller.on('dragend', function(move){
		if(my.direction == 'horizontal')
		{
			my.onScroll({
				pos: my.getPos(),
				value: my.minValue + my.getPos() * (my.maxValue- my.minValue),
				delta: (my.px_pos - my.old_px_pos) / (xmax() - xmin()) * (my.maxValue - my.minValue)
			});
		}
		else if(my.direction == 'vertical')
		{
			my.onScroll({
				pos: my.getPos(),
				value: my.minValue + my.getPos() * (my.maxValue- my.minValue),
				delta: (my.px_pos - my.old_px_pos) / (ymax() - ymin()) * (my.maxValue - my.minValue)
			});
		}
		my.old_px_pos = my.px_pos;
	});

	my.layer.add(my.rect);
	my.layer.add(my.scroller);
};

var SequencerView = function(options){
	// I always use "my" instead of "this" to avoid using the wrong "this" in the numerous callbacks
	var my = this;

	my.setupUI = function(tracks)
	{
		var leftPanel = new Kinetic.Rect({
			x: my.x,
			y: my.y,
			width: my.leftPanelWidth,
			height: my.height,
			fill: 'lightblue',
			stroke: 'black',
			strokeWidth: 1
		});

		var tracksPanel = new Kinetic.Rect({
			x: my.x + my.leftPanelWidth + my.leftPanelMargin,
			y: my.y,
			width: my.width - my.leftPanelWidth - my.leftPanelMargin,
			height: my.height,
			fill: '#CCE6FF',
			stroke: 'black',
			strokeWidth: 1
		});

		my.layer.add(leftPanel);
		my.layer.add(tracksPanel);

		var n = 0;
		for(var name in tracks)
		{
			var track = my.addTrack({id: n, name: name, track: tracks[name]});
			my.drawTrack(track);
			n += 1;
		}

		my.horizontalScrollBar = new ScrollBar({
			direction: 'horizontal',
			layer: my.layer,
			x: my.x + my.leftPanelWidth + my.leftPanelMargin + my.horizontalScrollBarMargin,
			y: my.y + my.height - my.horizontalScrollBarHeight - my.horizontalScrollBarMargin,
			width: my.width - my.leftPanelWidth - my.leftPanelMargin - 2*my.horizontalScrollBarMargin,
			height: my.horizontalScrollBarHeight,
			minValue: 0,
			maxValue: my.trackScoreWidth() - (my.width - my.leftPanelWidth - my.leftPanelMargin) + 2*my.trackMargin,
			onScroll: function(move){
				my.scoresLayer.move(-move.delta, 0);
				var clip = my.scoresLayer.getClip();
				clip.x += move.delta;
				my.scoresLayer.setClip(clip);
				my.scoresLayer.draw();
			}
		});
		
		my.verticalScrollBar = new ScrollBar({
			direction: 'vertical',
			layer: my.layer,
			x: my.x + my.leftPanelWidth + (my.leftPanelMargin - my.verticalScrollBarWidth)/2,
			y: my.y + my.verticalScrollBarMargin,
			width: my.verticalScrollBarWidth,
			height: my.height - 2*my.verticalScrollBarMargin,
			minValue: 0,
			maxValue: my.tracksHeight() - my.height + 2*my.trackMargin,
			onScroll: function(move){
				my.handlesLayer.move(0, -move.delta);
				var clip = my.handlesLayer.getClip();
				clip.y += move.delta;
				my.handlesLayer.setClip(clip);
				my.handlesLayer.draw();

				my.scoresLayer.move(0, -move.delta);
				clip = my.scoresLayer.getClip();
				clip.y += move.delta;
				my.scoresLayer.setClip(clip);
				my.scoresLayer.draw();
			}
		});

		my.layer.draw();
		my.handlesLayer.draw();
		my.scoresLayer.draw();
	};

	my.addTrack = function(options)
	{
		var t = new TrackView(options);
		my.tracks[options.id] = t;
		return t;
	};

	my.removeTrack = function(id)
	{
		var t = my.tracks[id];
		t.scoreGroup.removeChildren();
		t.handleGroup.removeChildren();
		t.scoreGroup.remove();
		t.handleGroup.remove();
		delete my.tracks[id];
		my.scoresLayer.draw();
		my.handlesLayer.draw();
	}

	my.tracksHeight = function()
	{
		return Object.keys(my.tracks).length * (my.trackHeight + 2*my.trackMargin);
	};

	my.drawTrack = function(track)
	{
		var handle_x = my.x + my.trackMargin;
		var handle_y = my.y + my.trackMargin + track.id*(my.trackHeight + 2*my.trackMargin);

		track.handleGroup = new Kinetic.Group();

		track.handle = new Kinetic.Rect({
			x: handle_x,
			y: handle_y,
			width: my.leftPanelWidth - 2*my.trackMargin,
			height: my.trackHeight,
			fill: '#CCC',
			stroke: 'black',
			strokeWidth: 1
		});

		track.handleGroup.add(track.handle);

		var removeImg = new Image();
		removeImg.onload = function()
		{
			var img = new Kinetic.Image({
				x: handle_x + my.leftPanelWidth - 3*my.trackMargin - 16,
				y: handle_y + my.trackMargin,
				image: removeImg,
				width: 16,
				height: 16,
			});
			

			track.handleGroup.add(img);

			img.on('click', function(){
				my.removeTrack(track.id);
			});

			my.handlesLayer.draw();
		};
		removeImg.src = "/img/remove.png";

		my.handlesLayer.add(track.handleGroup);

		track.scoreGroup = new Kinetic.Group();

		track.score = new Kinetic.Rect({
			x: my.x + my.trackMargin + my.leftPanelWidth + my.leftPanelMargin,
			y: my.y + my.trackMargin + track.id*(my.trackHeight + 2*my.trackMargin),
			width: my.trackScoreWidth(),
			height: my.trackHeight,
			fill: 'white',
			stroke: 'black',
			strokeWidth: 1
		});

		track.scoreGroup.add(track.score);

		for(var i=0; i<my.measureCount; i+=1)
		{
			var rect = new Kinetic.Rect({
				x: my.x + my.trackMargin + my.leftPanelWidth + my.leftPanelMargin + i*(my.measureWidth+2*my.measureMargin) + my.measureMargin,
				y: my.y + my.trackMargin + track.id*(my.trackHeight + 2*my.trackMargin)+1,
				width: my.measureWidth,
				height: my.trackHeight-2,
				fill: 'white',
			});

			track.scoreGroup.add(rect);

			if(i > 0)
			{
				var x = my.x + my.trackMargin + my.leftPanelWidth + my.leftPanelMargin + i*(my.measureWidth+2*my.measureMargin) + my.measureMargin/2;
				var y = my.y + my.trackMargin + track.id*(my.trackHeight + 2*my.trackMargin)+1;
				var line = new Kinetic.Line({
					points: [x, y, x, y+my.trackHeight-2],
					stroke: 'black',
					strokeWidth: 1
				});

				track.scoreGroup.add(line);
			}
		}

		my.scoresLayer.add(track.scoreGroup);
		
	};

	my.trackScoreWidth = function()
	{
		return (my.measureWidth + 2*my.measureMargin) * my.measureCount;
	}

	my.init = function(options)
	{
		my.width  = options.width;
		my.height = options.height;
		my.x 	  = options.x || 0;
		my.y 	  = options.y || 0;

		my.leftPanelWidth   = 200;
		my.leftPanelMargin 	= 30;
		my.trackHeight  	= 40;
		my.trackMargin 		= 3;
		my.measureWidth  	= 50;
		my.measureCount  	= 100;
		my.measureMargin  	= 2;
		my.horizontalScrollBarHeight = 20;
		my.horizontalScrollBarMargin = 3;
		my.verticalScrollBarWidth = 20;
		my.verticalScrollBarMargin = 3;

		my.layer = new Kinetic.Layer();

		my.handlesLayer = new Kinetic.Layer({clip: [
			my.x + my.trackMargin,
			my.y + my.trackMargin,
			my.leftPanelWidth - 2*my.trackMargin,
			my.height - 2*my.trackMargin
		]});

		my.scoresLayer  = new Kinetic.Layer({clip:[
			my.x + my.leftPanelWidth + my.leftPanelMargin + my.trackMargin,
			my.y + my.trackMargin,
			my.width - my.leftPanelWidth - my.leftPanelMargin - 2*my.trackMargin,
			my.height - my.horizontalScrollBarHeight - 2*my.horizontalScrollBarMargin - 2*my.trackMargin
		]});

		my.stage = options.stage;
		my.stage.add(my.layer);
		my.stage.add(my.handlesLayer);
		my.stage.add(my.scoresLayer);

		my.tracks = {};

		my.setupUI(options.tracks);
	}

	// Construct the object
	my.init(options);
	
};

var TrackView = function(options)
{
	var my = this;
	my.id = options.id;
};