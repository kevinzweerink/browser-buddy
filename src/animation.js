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