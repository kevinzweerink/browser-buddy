var Scroll = function (cache) {
	var scroll = this;
	var cache = cache;

	this._entities = [];

	this.enteredViewEventName = 'enteredView';
	this.inViewEventName = 'inView';
	this.exitedViewEventName = 'exitedView';

	this.enteredFocusEventName = 'enteredFocus';
	this.inFocusEventName = 'inFocus';
	this.exitedFocusEventName = 'exitedFocus';

	this._enteredViewEvent = new Event(this.enteredViewEventName);
	this._exitedViewEvent = new Event(this.exitedViewEventName);
	this._enteredFocusEvent = new Event(this.enteredFocusEventName);
	this._exitedFocusEvent = new Event(this.exitedFocusEventName);

	this._scrollEntity = function (el) {
		return {
			el : el,
			top : cache.getElementMeasurement(el, 'top'),
			height : cache.getElementMeasurement(el, 'height'),
			left : cache.getElementMeasurement(el, 'left'),
			width : cache.getElementMeasurement(el, 'width'),
			offset : cache.getElementMeasurement(el, 'top') + cache.scrollY,
			inView : false,
			inFocus : false
		}
	};

	this._recalculateEntities = function () {
		for (var i = 0; i < scroll._entities.length; i++) {
			var se = scroll._entities[i];
			se.top = cache.getElementMeasurement(se.el, 'top');
			se.height = cache.getElementMeasurement(se.el, 'height');
			se.left = cache.getElementMeasurement(se.el, 'left');
			se.width = cache.getElementMeasurement(se.el, 'width');
			se.offset = se.top + cache.scrollY;
		}
	};

	this.recalculate = function () {
		scroll._recalculateEntities();
	};

	this._getProgress = function (se, progressContext) {
		var topBound = cache.scrollY;
		var bottomBound = cache.vpHeight + cache.scrollY;

		if (progressContext == 'focus') {
			topBound += se.topFocusBoundary;
			bottomBound = cache.scrollY + se.bottomFocusBoundary;
		}

		var domain = (bottomBound - topBound) + se.height;
		return (bottomBound - se.offset) / domain;
	};

	this._isInView = function (se) {
		return (se.offset + se.height > cache.scrollY &&
						se.offset < cache.scrollY + cache.vpHeight);
	};

	this._didEnterView = function (se) {
		if (scroll._isInView(se) && !se.inView) {
			se.inView = true;
			return true;
		}

		return false;
	};

	this._didExitView = function (se) {
		if (!scroll._isInView(se) && se.inView) {
			se.inView = false;
			return true;
		}

		return false;
	};
	
	this._isInFocus = function (se) {
		return (se.offset + se.height > cache.scrollY + se.topFocusBoundary &&
						se.offset < cache.scrollY + se.bottomFocusBoundary);
	};

	this._didEnterFocus = function (se) {
		if (scroll._isInFocus(se) && !se.inFocus) {
			se.inFocus = true;
			return true;
		}

		return false;
	};

	this._didExitFocus = function (se) {
		if (!scroll._isInFocus(se) && se.inFocus) {
			se.inFocus = false;
			return true;
		}

		return false;
	};

	this._dispatchEvents = function (se) {
		if (scroll._didEnterView(se)) se.el.dispatchEvent(scroll._enteredViewEvent);
		if (scroll._didExitView(se)) se.el.dispatchEvent(scroll._exitedViewEvent);
		if (scroll._didEnterFocus(se)) se.el.dispatchEvent(scroll._enteredFocusEvent);
		if (scroll._didExitFocus(se)) se.el.dispatchEvent(scroll._exitedFocusEvent);
		

		if (scroll._isInView(se)) {
			var progress = scroll._getProgress(se, 'view');
			var e = new CustomEvent(this.inViewEventName, { 
				detail : {
					progress : progress
				} 
			});
			se.el.dispatchEvent(e);
		}

		if (scroll._isInFocus(se)) {
			var progress = scroll._getProgress(se, 'focus');
			var e = new CustomEvent(this.inFocusEventName, {
				detail : {
					progress : progress
				}
			});
			se.el.dispatchEvent(e);
		}
	}

	this.tick = function () {
		for (var i = 0; i < scroll._entities.length; i++) {
			scroll._dispatchEvents(scroll._entities[i]);
		}
	};

	this.watch = function (el, opts) {
		var se = scroll._scrollEntity(el);
		Object.assign(se, opts);

		if (!se.topFocusBoundary) {
			se.topFocusBoundary = 0;
		}

		if (!se.bottomFocusBoundary) {
			se.bottomFocusBoundary = cache.vpHeight;
		}

		scroll._entities.push(se);
	};

	cache.storeVolatile(window, 'scrollY', 'scrollY');
	cache.storeVolatile(window, 'scrollX', 'scrollX');
	cache.storeStable(window, 'innerHeight', 'vpHeight');
	cache.storeStable(window, 'innerWidth', 'vpWidth');

}