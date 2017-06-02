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