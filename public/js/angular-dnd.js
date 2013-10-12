angular.module('dnd', []).directive('draggable', function(){
	return function(scope, element, attrs){
		var el = element[0];

        el.draggable = true;

        el.addEventListener(
            'dragstart',
            function(e) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('transfer', attrs['transfer']);
                this.classList.add('drag');
                return false;
            },
            false
        );

        el.addEventListener(
            'dragend',
            function(e) {
                this.classList.remove('drag');
                return false;
            },
            false
        );
	};
}).directive('droppable', function() {
    return {
        link: function(scope, element, attrs) {
            // again we need the native object
            var el = element[0];

            el.addEventListener(
			    'dragover',
			    function(e) {
			        e.dataTransfer.dropEffect = 'move';
			        // allows us to drop
			        if (e.preventDefault) e.preventDefault();
			        this.classList.add('over');
			        return false;
			    },
			    false
			);

            el.addEventListener(
			    'dragenter',
			    function(e) {
			        this.classList.add('over');
			        return false;
			    },
			    false
			);

			el.addEventListener(
			    'dragleave',
			    function(e) {
			        this.classList.remove('over');
			        return false;
			    },
			    false
			);

			el.addEventListener(
			    'drop',
			    function(e) {
			        // Stops some browsers from redirecting.
			        if (e.stopPropagation) e.stopPropagation();

			        this.classList.remove('over');

			        var call = attrs['drop'].replace('$transfer', JSON.stringify(e.dataTransfer.getData('transfer')));

			        scope.$apply(call);

			        return false;
			    },
			    false
			);
        }

    };

})