function SequencerController($scope)
{
	$scope.history 			= sequencerView.model.history;
	$scope.history.scope  	= $scope;
	$scope.cellHeight = sequencerView.cellHeight;

	$scope.handles = function()
	{
		return sequencerView.model.getTrackConfigs();
	};

	$scope.loadHistoryItem = function(h, event)
	{
		$('div.sequencer-history.selected').removeClass('selected');
		$(event.target).closest('div.sequencer-history').addClass('selected');
		sequencerView.loadSnapshot(h);
	};

	$scope.activateTrack = function(index)
	{
		sequencerView.activateTrack(index);
	};

	$scope.handleDropped = function(on, what)
	{
		what = parseInt(what);

		sequencerView.swapTracks(on, what);
	};

	$scope.removeTrack = function(id)
	{
		sequencerView.removeTrack(id);
	};

	$scope.addTrack = function()
	{
		sequencerView.addTrack();
	};
};

$('#sequencer-view-container').scroll(function(e){
	$('#sequencer-track-handles-container').scrollTo({
		top: $(e.target).scrollTop(),
		left: 0
	}, 0);
});