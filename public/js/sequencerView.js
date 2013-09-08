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
		for(var i in tracks)
		{
			var track = my.addTrack({id: n, position: n, name: tracks[i].name, model: tracks[i]});
			my.drawTrack(track);
			n += 1;
		}

		/*
		* Setup horizontal scrollBar
		*/

		my.horizontalScrollBar = new ScrollBar({
			direction: 'horizontal',
			layer: my.layer,
			x: my.x + my.leftPanelWidth + my.leftPanelMargin + my.horizontalScrollBarMargin,
			y: my.y + my.height - my.horizontalScrollBarHeight - my.horizontalScrollBarMargin,
			width: my.width - my.leftPanelWidth - my.leftPanelMargin - 2*my.horizontalScrollBarMargin,
			height: my.horizontalScrollBarHeight,
			minValue: 0,
			maxValue: my.trackScoreWidth() - (my.width - my.leftPanelWidth - my.leftPanelMargin) + 4*my.trackMargin,
			onScroll: function(move){
				my.scoresLayer.move(-move.delta, 0);
				var clip = my.scoresLayer.getClip();
				clip.x += move.delta;
				my.scoresLayer.setClip(clip);
				my.scoresLayer.draw();
			}
		});

		/*
		* Setup vertical scrollBar
		*/
		
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

		for(var i in my.tracks)
		{
			if(my.tracks[i].position > t.position)
			{
				my.tracks[i].position -= 1;
			}
		}

		my.redrawTracks();

		my.verticalScrollBar.setMaxValue(my.tracksHeight() - my.height + 2*my.trackMargin);
	}

	my.tracksHeight = function()
	{
		return Object.keys(my.tracks).length * (my.trackHeight + 2*my.trackMargin);
	};

	my.drawTrack = function(track)
	{
		var position = my.computeTrackPos(track);

		track.handleGroup = new Kinetic.Group();

		track.handle = new Kinetic.Rect({
			x: position.handle.x,
			y: position.handle.y,
			width: position.handle.width,
			height: position.handle.height,
			fill: '#CCC',
			stroke: 'black',
			strokeWidth: 1
		});

		track.handleGroup.add(track.handle);

		/*
		* Helper function to add image
		*/

		var addImg = function(path, x, y, width, height, callback){
			var htmlImg = new Image();
			htmlImg.onload = function()
			{
				var img = new Kinetic.Image({
					x: x,
					y: y,
					image: htmlImg,
					width: width,
					height: height,
				});
				track.handleGroup.add(img);
				if(callback)
				{
					callback(img);

					img.on('mouseover', function(){
						document.body.style.cursor = 'pointer';
					});
					img.on('mouseout', function(){
						document.body.style.cursor = 'default';
					});
				}
				my.handlesLayer.draw();
			};
			htmlImg.src = path;
		};

		/*
		* Add the remove icon
		*/

		addImg(
				"/img/remove.png",
				position.handle.x + position.handle.width - my.trackMargin - 16,
				position.handle.y + my.trackMargin,
				16,
				16,
				function(img){
					img.on('click', function(){
						my.removeTrack(track.id);
					});
				}
		);

		/*
		* Add the up icon
		*/

		addImg(
				"/img/up.png",
				position.handle.x + my.trackMargin,
				position.handle.y + my.trackMargin,
				16,
				16,
				function(img){
					img.on('click', function(){
						my.moveTrack(track.id, -1);
					});
				}
		);

		/*
		* Add the down icon
		*/

		addImg(
				"/img/down.png",
				position.handle.x + my.trackMargin,
				position.handle.y + my.trackHeight - my.trackMargin - 16,
				16,
				16,
				function(img){
					img.on('click', function(){
						my.moveTrack(track.id, 1);
					});
				}
		);

		/*
		* Add the track caption
		*/

		track.caption = new Kinetic.Text({
			x: position.handle.x + 32,
			y: position.handle.y + my.trackMargin,
			text: track.model.name,
			fontSize: 15,
			fontFamily: 'sans-serif',
			fill: 'black'
		});

		track.handleGroup.add(track.caption);

		my.handlesLayer.add(track.handleGroup);

		track.scoreGroup = new Kinetic.Group();

		/*
		* Add the score big rectangle
		*/

		track.score = new Kinetic.Rect({
			x: position.score.x,
			y: position.score.y,
			width: position.score.width,
			height: position.score.height,
			fill: 'white',
			stroke: 'black',
			strokeWidth: 1
		});

		track.scoreGroup.add(track.score);

		/*
		* Add the rectangles for the measures
		*/
		for(var i=0; i<my.measureCount; i+=1)
		{
			var rect = new Kinetic.Rect({
				x: position.score.x + i*(my.measureWidth+2*my.measureMargin) + my.measureMargin,
				y: position.score.y + 1,
				width: my.measureWidth,
				height: my.trackHeight-2,
				fill: 'white',
			});

			track.measures[i] = rect;

			// We need a scope to access i in the callback! Neat Javascript, easy to read :)
			var callback = (function(j){return function(){
				if(track.canAddSegmentAt(j))
				{
					track.addSegmentAt(j);
					var seg = new Kinetic.Rect({
						x: track.measures[j].getPosition().x,
						y: track.measures[j].getPosition().y - 1,
						width: track.getMeasureCount() * (my.measureWidth + 2*my.measureMargin) - 2*my.measureMargin,
						height: my.trackHeight,
						fill: 'green',
						opacity: 0.7,
						stroke: 'black',
						strokeWidth: 2
					});
					track.scoreGroup.add(seg);
					my.scoresLayer.draw();

					seg.on("click", function(){
						track.removeSegmentAt(j);
						seg.remove();
						my.scoresLayer.draw();
					});
				}
			}})(i);
			rect.on('click', callback);

			track.scoreGroup.add(rect);

			if(i > 0)
			{
				var x = position.score.x + i*(my.measureWidth+2*my.measureMargin) + my.measureMargin/2;
				var y = position.score.y + 1;
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

	my.computeTrackPos = function(track, num)
	{
		if(num === undefined)
		{
			num = track.id;
		}

		return {
			handle: {	x: 		my.x + my.trackMargin, 
						y: 		my.y + my.trackMargin + num*(my.trackHeight + 2*my.trackMargin), 
						width: 	my.leftPanelWidth - 2*my.trackMargin, 
						height: my.trackHeight
			},
			score: {
						x: 		my.x + my.leftPanelWidth + my.leftPanelMargin + 2*my.trackMargin, 
						y: 		my.y + my.trackMargin + num*(my.trackHeight + 2*my.trackMargin), 
						width: 	my.trackScoreWidth(), 
						height: my.trackHeight
			}
		};
	};

	my.redrawTracks = function()
	{
		for(var i in my.tracks)
		{
			my.redrawTrack(i);
		}
		my.handlesLayer.draw();
		my.scoresLayer.draw();
	};

	my.moveTrack = function(id, delta)
	{
		var track = my.tracks[id];
		for(var i in my.tracks)
		{
			if(my.tracks[i].position == track.position + delta)
			{
				track.position += delta;
				my.tracks[i].position -= delta;
				break;
			}
		}
		
		my.redrawTracks();
	};

	my.redrawTrack = function(id)
	{
		var track = my.tracks[id];
		var pos   = my.computeTrackPos(track, track.position);

		var trackPos  = track.score.getAbsolutePosition();
		var handlePos = track.handle.getAbsolutePosition();

		var trackDx   = pos.score.x - trackPos.x;
		var trackDy   = pos.score.y - trackPos.y;
		var handleDx  = pos.handle.x - handlePos.x;
		var handleDy  = pos.handle.y - handlePos.y;

		track.handleGroup.move(handleDx, handleDy);
		track.scoreGroup.move(trackDx, trackDy);
	};

	my.trackScoreWidth = function()
	{
		return (my.measureWidth + 2*my.measureMargin) * my.measureCount;
	};

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
		my.measureMargin  	= 0;
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

	my.model 	= options.model;
	my.position = options.position;

	my.measures = {};

	my.canAddSegmentAt = function(i)
	{
		return my.model.canAddSegmentAt(i);
	};

	my.addSegmentAt = function(i)
	{
		return my.model.addSegmentAt(i);
	}

	my.getMeasureCount = function()
	{
		return my.model.measureCount;
	};

	my.removeSegmentAt = function(i)
	{
		return my.model.removeSegmentAt(i);
	};
};