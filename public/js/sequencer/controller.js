function SequencerController($scope)
{
	$scope.history 			= sequencerHistory;
	sequencerHistory.scope  = $scope;
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
		patternView.setModel(sequencerView.model.tracks[index]);
	};
};