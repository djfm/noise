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

		if(this.history.length > History.maxLength)
		{
			this.history.pop();
		}

		return this.history[0];
	};

	this.preSerialize = function()
	{
		var h = new History();
		h.at = this.at;

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

History.maxLength = 10;

History.record = function(history, h)
{
	history.history.unshift(h);
	if(history.history.length > History.maxLength)
	{
		history.history.pop();
	}
};