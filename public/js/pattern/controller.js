function PatternController($scope)
{
	$scope.history = history;
	history.scope  = $scope;

	$scope.loadHistoryItem = function(h, event)
	{
		$('div.pattern-history.selected').removeClass('selected');
		$(event.target).closest('div.pattern-history').addClass('selected');
		

		patternView.loadSnapshot(h);
	};
};