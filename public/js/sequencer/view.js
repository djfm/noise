var SequencerView = function(options)
{
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

	options.getCellsPerRowCount = function(song)
	{
		return song.getMeasureCount();
	};

	options.getRowCount = function(song)
	{
		return song.getTrackCount();
	};

	this.init(options);
	this.drawGrid();
};

SequencerView.prototype = new Grid();
SequencerView.prototype.constructor = SequencerView;