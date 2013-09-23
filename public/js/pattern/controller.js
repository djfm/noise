function PatternController($scope)
{
	$scope.history = history;
	history.scope  = $scope;

	$scope.loadHistoryItem = function(h)
	{
		patternView.loadSnapshot(h);
	};


};