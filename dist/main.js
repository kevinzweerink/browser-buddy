(function () {
var Cache = function () {
	var cache = this;

	this._volatileEntries = [];
	this._stableEntries = [];
	this._elements = [];

	this._store = function (obj, prop, accessKey, list) {
		if (cache[accessKey]) {
			return false;
		}
		
		list.push({
			obj : obj,
			prop : prop,
			accessKey : accessKey
		});
	};

	this._syncEntries = function (list) {
		for (var i = 0; i < list.length; i++) {
			var entry = list[i];
			cache[entry.accessKey] = entry.obj[entry.prop];
		}
	};

	this._findElement = function (el) {
		for (var i = 0; i < this._elements.length; i++) {
			var stored = this._elements[i];
			if (el == stored.el) {
				return stored;
			}
		}

		return false;
	};

	this._recalculateElements = function () {
		for (var i = 0; i < this._elements.length; i++) {
			this._elements[i].rect = this._elements[i].el.getBoundingClientRect();
		}
	}

	this.storeStable = function (obj, prop, accessKey) {
		cache._store(obj, prop, accessKey, cache._stableEntries);
		cache.update();
	};

	this.storeVolatile = function (obj, prop, accessKey) {
		cache._store(obj, prop, accessKey, cache._volatileEntries);
		cache.update();
	};

	this.update = function () {
		cache._syncEntries(cache._volatileEntries);
	};

	this.refresh = function () {
		cache._syncEntries(cache._volatileEntries);
		cache._syncEntries(cache._stableEntries);
		cache._recalculateElements();
	};

	this.get = function (accessKey) {
		return cache[accessKey];
	};

	// Accepts any key that getBoundingClientRect accepts
	this.getElementMeasurement = function (el, measurement) {
		var cached = this._findElement(el);
		if (cached) {
			return cached.rect[measurement];
		}

		var rect = el.getBoundingClientRect();
		cache._elements.push({
			el : el,
			rect : rect
		});

		return rect[measurement];
	};
}
var Animator = function () {
	var animator = this;

	this._periodicals = [];
	this._regulars = [];
	this._singles = [];
	this._shouldRun = true;
	this._ticks = 0;

	this.period = 100;

	// easing functions source: https://gist.github.com/gre/1650294
	this.easing = {
	  linear: function (t) { return t },
	  easeInQuad: function (t) { return t*t },
	  easeOutQuad: function (t) { return t*(2-t) },
	  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
	  easeInCubic: function (t) { return t*t*t },
	  easeOutCubic: function (t) { return (--t)*t*t+1 },
	  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
	  easeInQuart: function (t) { return t*t*t*t },
	  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
	  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
	  easeInQuint: function (t) { return t*t*t*t*t },
	  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
	  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
	}

	this._run = function (list) {
		for (var i = 0; i < list.length; i++) {
			var result = list[i]();

			if (result == 'expired') {
				list.splice(i, 1);
				i--;
			}
		}
	}

	this.enqueuePeriodical = function (fn) {
		animator._periodicals.push(fn);
	};

	this.enqueue = function (fn) {
		animator._regulars.push(fn);
	};

	this.animate = function (duration, easing, cb) {
		var startTime = new Date().getTime();
		animator._singles.push(function () {
			var currentTime = new Date().getTime();
			var linearProgress = (currentTime - startTime) / duration;
			var easedValue = easing(linearProgress);

			if (linearProgress >= 1) {
				cb(1);
				return 'expired';
			}

			cb(easedValue);
		});
	}

	this.tick = function () {
		animator._ticks++;
		animator._run(animator._regulars);
		animator._run(animator._singles);
		if (animator._ticks >= animator.period) {
			animator._run(animator._periodicals);
			animator._ticks = 0;
		}
	}

	this._loop = function () {
		if (animator._shouldRun) {
			animator.tick();
			window.requestAnimationFrame(animator._loop);
		}
	}

	this.start = function () {
		animator._shouldRun = true;
		animator._loop();
	}

	this.stop = function () {
		animator._shouldRun = false;
	}
}
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
var Dom = function () {
	var dom = this;
	this._tags = ['div', 'p', 'a', 'img', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

	this.el = function (tag, opts, children) {
		if (!opts.classes) {
			opts.classes = [];
		};

		if (!opts.props) {
			opts.props = {};
		};

		if (!opts.content) {
			opts.content = '';
		}

		if (children && !Array.isArray(children)) {
			children = [children];
		} else if (!children) {
			children = [];
		}

		var el = document.createElement(tag);
		Object.assign(el, opts.props);
		el.innerHTML = opts.content;

		for (var i = 0; i < opts.classes.length; i++) {
			el.classList.add(opts.classes[i]);
		}

		for (var i = 0; i < children.length; i++) {
			el.appendChild(children[i]);
		}

		return el;
	};

	for (var i = 0; i < this._tags.length; i++) {
		// gross but apparently necessary
		(function () {
			var tag = dom._tags[i];
			dom[tag] = function (opts, children) {
				return dom.el(tag, opts, children);
			}
		})();
	}

}

var cache = new Cache();
var animator = new Animator();
var scroll = new Scroll(cache);
var dom = new Dom();

window.bb = {
	cache : cache,
	animator : animator,
	scroll : scroll,
	dom : dom,
	initDefaultConfig : function () {
		this.animator.enqueue(this.cache.update);
		this.animator.enqueuePeriodical(this.cache.refresh);
		this.animator.enqueue(this.scroll.tick);
		this.animator.enqueue(this.scroll.refresh);
	}
}

})();


