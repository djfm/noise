function SequencerController($scope)
{
	$scope.cellHeight = sequencerView.cellHeight;

	$scope.handles = function()
	{
		return sequencerView.model.getTrackConfigs();
	};	
};