/**
 * Module that registers the notification box and handles messages
 */
var Notifications = {
	
	init: function(options) {
		this.options = $.extend(
			this.options,
			options
		);
		
		// Create the notifications box.
		// This assigned to the bare identifier `elem` (an implicit global,
		// window.elem) instead of `this.elem`. The `elem: null` property below
		// was declared for exactly this and never actually got set, so
		// Notifications.elem was always null -- harmless today since every
		// other method here goes back through a jQuery selector rather than
		// this property, but a landmine for anything written later that reads
		// Notifications.elem expecting the real node.
		this.elem = $('<div>').attr({
			id: 'notifications',
			className: 'notifications'
		});
		// Create the transparency gradient
		$('<div>').attr('id', 'notifyGradient').appendTo(this.elem);
		
		this.elem.appendTo('div#wrapper');
	},
	
	options: {}, // Nothing for now
	
	elem: null,
	
	notifyQueue: {},
	
	// Allow notification to the player
	notify: function(module, text, noQueue) {
		if(typeof text == 'undefined') return;
		if(text.slice(-1) != ".") text += ".";
		if(module != null && Engine.activeModule != module) {
			if(!noQueue) {
				if(typeof this.notifyQueue[module] == 'undefined') {
					this.notifyQueue[module] = [];
				}
				this.notifyQueue[module].push(text);
			}
		} else {
			Notifications.printMessage(text);
		}
		Engine.saveGame();
	},
	
	clearHidden: function() {
	
		// To fix some memory usage issues, we clear notifications that have been hidden.
		
		/* Only meaningful when the fade-out gradient is actually rendered.
		 *
		 * This culls any notification positioned below the gradient, on the
		 * premise that the gradient marks the bottom of the visible area. If
		 * the gradient is not displayed, position() reports 0 and
		 * outerHeight() reports 0, so `bottom` is 0 and EVERY notification
		 * qualifies -- messages appeared and then instantly vanished, which
		 * is what was reported on the mobile page (its log is a scrollable
		 * box and hides the gradient). Bailing out is correct there: with a
		 * scrolling log nothing is ever hidden, so nothing should be culled.
		 */
		var gradient = $('#notifyGradient');
		if(gradient.length === 0 || !gradient.is(':visible')) {
			return;
		}

		// We use position().top here, because we know that the parent will be the same, so the position will be the same.
		var bottom = gradient.position().top + gradient.outerHeight(true);
		
		$('.notification').each(function() {
		
			if($(this).position().top > bottom){
				$(this).remove();
			}
		
		});
		
	},
	
	printMessage: function(t) {
		var text = $('<div>').addClass('notification').css('opacity', '0').text(t).prependTo('div#notifications');
		text.animate({opacity: 1}, 500, 'linear', function() {
			// Do this every time we add a new message, this way we never have a large backlog to iterate through. Keeps things faster.
			Notifications.clearHidden();
		});
	},
	
	printQueue: function(module) {
		if(typeof this.notifyQueue[module] != 'undefined') {
			while(this.notifyQueue[module].length > 0) {
				Notifications.printMessage(this.notifyQueue[module].shift());
			}
		}
	}
};
