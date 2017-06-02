# Browser Buddy

#### A small front-end library of independent but complementary js modules for lightweight development.

## Why Is This Here?

I made browser buddy for my own purposes. I found myself working on a lot of small sites that had similar needs for lightweight scroll effects, animations, and dom manipulations.

## How Can I Get It?

Download it from here. Maybe it will be on npm or bower some day or something, but it isn't now.

## What Does It Do?

### Overview

Browser Buddy has several independent modules that work just fine on their own, but can be composed together to perform common functions. Currently there are four modules:

* `bb.cache`
* `bb.animator`
* `bb.scroll`
* `bb.dom`

### Cache

`bb.cache` is a tool for storing and retrieving values that can be expensive to calculate, like element measurements, computed `window` properties, etc. It has two caching tiers for volatile and stable values. You can store things like element heights in the stable cache, and things like scroll position in the volatile cache.

### Animator

`bb.animator` is an interface for an animation tool that uses `window.requestAnimationFrame` under the hood. You can use it to actually animate stuff, or use it to execute code that needs to respond to constantly changing conditions.

### Scroll

`bb.scroll` provides an evented interface to react to scroll behaviors.

### Dom

`bb.dom` is a kind of bad interface for creating dom elements. Hopefully it will get better soon. If you have a lot of dom editing to do, probably definitely don't use this.

## How Do I Use It?

### Cache

#### `bb.cache.storeVolatile(obj, prop, accessKey)`

Stores a volatile cache entry. The entry must be a property (`prop`) of an object (`obj`) that will continue to be accessible. `accessKey` is whatever name you want to access it by. When you want to retrieve the stored value from the cache, just get it by referencing `bb.cache.accessKey`, where `accessKey` is the value you stored it with.

#### `bb.cache.storeStable(obj, prop, accessKey)`

Stores a stable cache entry. Same deal as `storeVolatile` but it lives in a different cache tier. Access works the same way though.

#### `bb.cache.getElementMeasurement(el, measurement)`

Intelligently stores and retrieves expensive element measurements. This is basically just a layer on top of `element.getBoundingClientRect()`, so `measurement` should be a string that matches a property returned by `getBoundingClientRect()`. This method will cache the element's `rect` and return either the cached measurements, or if it hasn't been cached yet, it will add it to the cache.

The cached `rects` are treated as stable entries, so they are recalculated when `bb.cache.refresh` is called.

#### `bb.cache.update()`

Updates all volatile cache entries.

#### `bb.cache.refresh()`

Updates all stable and volatile cache entries.

#### `bb.cache.get(accessKey)`

An alternative to just accessing a value directly via `bb.cache.accessKey`. This can be helpful if you need to delay accessing a cached value until a function is actually run. Like with closures or whatever.

---

### Animator

#### `bb.animator.start()`

Starts the animation loop.

#### `bb.animator.stop()`

Stops the animation loop.

#### `bb.animator.tick()`

Advances the animation loop one frame

#### `bb.animator.period`

Sets the number of frames in the animator period (see `bb.animator.enqueuePeriodical()`).

#### `bb.animator.enqueue(fn)`

Provide a function to be run every frame.

#### `bb.animator.enqueuePeriodical(fn)`

Provide a function to be run once per period. Adjust the length of the animation period by changing `bb.animator.period`.

#### `bb.animator.animate(duration, easing, cb)`

This will animate a value from 0 to 1 over the duration and easing specified. You provide a callback function `cb` that accepts a float as it's argument and does with it what it will.

For example, you might do this to hide a header element:

```javascript
var el = document.querySelector('.header');
bb.animator.animate(2000, bb.animator.easing.easeInOutCubic, function(progress) {
	var t = progress * -200;
	el.style.transform = 'translate3d(0, ' + t + 'px, 0)';
});
```

If you want to provide your own easing function, you can. It should accept a value from 0–1 and return a value (usually from 0–1 but you do you).

#### `bb.animator.easing`

A static set of easing functions. Available easings are:

* linear
* easeInQuad
* easeOutQuad
* easeInOutQuad
* easeInCubic
* easeOutCubic
* easeInOutCubic
* easeInQuart
* easeOutQuart
* easeInOutQuart
* easeInQuint
* easeOutQuint
* easeInOutQuint

*Note: I did not make these, they came from here: https://gist.github.com/gre/1650294*

---

### Scroll

#### `bb.scroll.watch(el, opts)`

Provide an element, and an options object. Currently the only options you can provide are `topFocusBoundary` and `bottomFocusBoundary`. I will explain those in a minute.

Once you have called `bb.scroll.watch`, you can have the element you passed to it listen for different scrolling events and react to them! The events you can listen for are:

* `bb.scroll.enteredViewEventName`: Triggered when an element first enters the viewport.
* `bb.scroll.inViewEventName`: Triggered when an element is in the viewport, provides a `detail.progress` property on the event indicating how far across the viewport the element has traveled.
* `bb.scroll.exitedViewEventName`: Triggered when an element leaves the viewport.
* `bb.scroll.enteredFocusEventName`: Triggered when an element first enters the defined focus area of the viewport.
* `bb.scroll.inFocusEventName`: Triggered when an element is in the focus area of the viewport, provides a `detail.progress` property on the event indicating how far across the focus area the element has traveled.
* `bb.scroll.exitedFocusEventName`: Triggered when an element leaves the focus area of the viewport.

##### What is a focus area?

You can define the focus area by providing `topFocusBoundary` (distance from the top of the viewport to the top of the focus area) and `bottomFocusBoundary` (distance from the top of the viewport to the bottom of the focus area) as `opts` to the `bb.scroll.watch` method.

##### Example usage

If you wanted to show a tooltip for a new thing when that thing enters the middle third of the viewport, here is how you would do it.

```javascript
var newEl = document.querySelector('.item.new');

bb.scroll.watch(newEl, {
	topFocusBoundary: window.innerHeight / 3,
	bottomFocusBoundary : 2 * (window.innerHeight / 3)
});

newEl.addEventListener(bb.scroll.enteredFocusEventName, function () {
	this.querySelector('.tooltip').classList.add('visible');
});

newEl.addEventListener(bb.scroll.exitedFocusEventName, function () {
	this.querySelector('.tooltip').classList.remove('visible');
});
```

##### Doing parallax stuff
In my experience, this is totally performant enough to do clean parallax scroll effects, however, one trick that will save you a lot of recalculations is to do a little nesting so that you can watch the scroll position of a non-parallaxing element and then translate an element inside of it.

E.g.:

```javascript
var container = document.querySelector('.parallax-container');
var mover = container.querySelector('img');

container.style.height = bb.cache.getElementMeasurement(mover, 'height') + 'px';

bb.scroll.watch(container);
container.addEventListener(bb.scroll.inViewEventName, function (e) {
	mover.style.transform = 'translate3d(0, ' + e.detail.progress * 200 + 'px, 0);';
});
```

#### `bb.scroll.recalculate()`

Recalculates element positions. Uses `bb.cache` to store them, so if you need to use this method, you may need to call `bb.cache.refresh` before you do it.

#### `bb.scroll.tick()`

Checks all watched elements' positions and fires appropriate events.

---

### Dom

Not gonna bother documenting this right now because it's not very good. I'll try to make a better one later.

---

### Default Config

Browser Buddy comes with a default configuration that makes a few useful connections for you. To use the default config, call `bb.initDefaultConfig()`.

#### What it does

* Plugs `bb.cache.update` into the animator's standard `enqueue` method, so volatile entries are refreshed once per frame.
* Plugs `bb.cache.refresh` into the animator's `enqueuePeriodical` method, so stable entries are calculated once per animation period
* Plugs `bb.scroll.tick` into the animator's `enqueue` method, so that `bb.scroll` events are fired once per frame.
* Plugs `bb.scroll.recalculate` into the animator's `enqueuePeriodical` method, so that watched elements' measurements are updated once per animation period
* Plugs `bb.cache.refresh` and `bb.scroll.recalculate` into the `window.onresize` method so that element measurements are recalculated when the window size changes. 