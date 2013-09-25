var SequencerView = function(options)
{
	options.getCellsPerRowCount = function(song){
		return song.getMeasureCount();
	};

	options.getRowCount = function(song)
	{
		return song.getTrackCount();
	};

	this.init(options);
};

SequencerView.prototype = new Grid();
SequencerView.prototype.constructor = SequencerView;