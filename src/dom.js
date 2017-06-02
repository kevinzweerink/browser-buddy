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