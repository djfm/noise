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
		return Math.min((s+s*s) / (s + my.maxValue - my.minValue), s - 2*my.scrollerMargin);
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

		my.setMaxValue = function(value)
		{
			var pos = my.getPos();
			my.maxValue = value;
			var px_pos  = my.px_pos;
			my.old_px_pos = my.px_pos = xmin() + pos * (xmax()-xmin());
			my.scroller.move(my.px_pos - px_pos, 0);
			my.scroller.setWidth(my.scrollerSize());
			my.layer.draw();
		};
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

		my.setMaxValue = function(value)
		{
			var pos = my.getPos();
			my.maxValue = value;
			var px_pos  = my.px_pos;
			my.old_px_pos = my.px_pos = ymin() + pos * (ymax()-ymin());
			my.scroller.move(0, my.px_pos - px_pos);
			my.scroller.setHeight(my.scrollerSize());
			my.layer.draw();
		};
	}
	else
	{
		throw "Illegal scrollbar direction: " + my.direction;
	}

	my.scroller.on('dragend', function(move){

		if(my.direction == 'horizontal')
		{
			if(xmax() == xmin())return;
			my.onScroll({
				pos: my.getPos(),
				value: my.minValue + my.getPos() * (my.maxValue- my.minValue),
				delta: (my.px_pos - my.old_px_pos) / (xmax() - xmin()) * (my.maxValue - my.minValue)
			});
		}
		else if(my.direction == 'vertical')
		{
			if(ymax() == ymin())return;
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