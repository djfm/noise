function PatternController($scope, sequencer)
{
	$scope.history = sequencer.patternHistory;

	sequencer.updatePatternScope = function()
	{
		$scope.$apply();
	};

	$scope.loadHistoryItem = sequencer.loadPatternHistoryItem;
};