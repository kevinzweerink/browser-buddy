(function () {
//=require cache.js
//=require animation.js
//=require scroll.js
//=require dom.js

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


