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
		if(this.scope && options.apply !== false)
		{
			this.scope.$apply();
		}

		if(this.onRecord)
		{
			this.onRecord(h);
		}
	}
};