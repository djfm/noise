var History = function(){
	this.history = [];

	this.record = function(h, options)
	{
		if(options === undefined)
		{
			options = {};
		}

		h.date = (new Date()).toUTCString();
		this.history.unshift(h);

		if(this.onRecord)
		{
			this.onRecord(h);
		}
		
		if(this.scope && options.apply !== false)
		{
			this.scope.$apply();
		}
	};

	this.preSerialize = function()
	{
		var h = new History();
		for(var i in this.history)
		{
			var item = {};
			for(var j in this.history[i])
			{
				if(!/^\$\$/.exec(j))
				{
					item[j] = this.history[i][j];
				}
			}
			h.history.push(item);
		}
		return h;
	}
};