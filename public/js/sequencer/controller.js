function SequencerController($scope, sequencer)
{
	$scope.history 		= sequencer.sequencerHistory;
	$scope.cellHeight 	= sequencer.sequencerCellHeight;
	$scope.handles 		= sequencer.getTrackHandles;

	sequencer.updateSequencerScope = function()
	{
		$scope.$apply();
	};

	$scope.loadHistoryItem = sequencer.loadSequencerHistoryItem;

	$scope.activateTrack = sequencer.activateTrack;

	$scope.handleDropped = function(on, what)
	{
		what = parseInt(what);

		sequencer.swapTracks(on, what);
	};

	$scope.removeTrack = sequencer.removeTrack;

	$scope.addTrack = sequencer.addTrack;
};

$('#sequencer-view-container').scroll(function(e){
	$('#sequencer-track-handles-container').scrollTo({
		top: $(e.target).scrollTop(),
		left: 0
	}, 0);
});

app.service('sequencer', function(){
	// This looks stupid, but it actually lets me see immediately when
	// I break the Song serialization functions :)
	var song 	= Song.deserialize((new Song()).serialize());

	var service = {};

	var patternView = new PatternView({
				container: 'pattern-view-container',
				sequencerService: service,
				model: song.tracks[0]
			});

	var sequencerView = new SequencerView({
		container: 'sequencer-view-container',
		patternView: patternView,
		cellWidth: 50,
		cellHeight: 38,
		markColor: '#333',
		sequencerService: service,
		model: song
	});

	service.patternHistory = function()
	{
		if(patternView.model)
		{
			return patternView.model.history;
		}
		else
		{
			return [];
		}
	};

	service.sequencerHistory = function()
	{
		if(sequencerView.model)
		{
			return sequencerView.model.history;
		}
		else
		{
			return [];
		}
	};

	service.getTrackHandles = function()
	{
		if(sequencerView.model)
		{
			return sequencerView.model.getTrackConfigs();
		}
		else
		{
			return [];
		}
	};

	service.loadPatternHistoryItem = function(h, event)
	{
		$('div.pattern-history.selected').removeClass('selected');
		$(event.target).closest('div.pattern-history').addClass('selected');
		patternView.loadSnapshot(h);
	};

	service.loadSequencerHistoryItem = function(index, h, event)
	{
		sequencerView.model.history.at = index;
		$('div.sequencer-history.selected').removeClass('selected');
		$(event.target).closest('div.sequencer-history').addClass('selected');
		sequencerView.loadSnapshot(h);
	};

	service.activateTrack = function(index)
	{
		sequencerView.activateTrack(index);
	};

	service.removeTrack = function(id)
	{
		sequencerView.removeTrack(id);
	};

	service.addTrack = function()
	{
		sequencerView.addTrack();
	};

	service.swapTracks = sequencerView.swapTracks;
	
	service.sequencerCellHeight = sequencerView.cellHeight
	
	return service;
});