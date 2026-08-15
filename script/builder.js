/**
 * The Builder's commentary.
 *
 * She is the deuteragonist and the only person the player talks to for most
 * of a run, and until now she had almost nothing to say about what they were
 * actually doing. This gives her a running reaction to the player's
 * milestones -- what they build, what they kill, and what they find out
 * there.
 *
 * ============================================================================
 * DESIGN RULES
 * ============================================================================
 *
 * 1. ONCE EACH, EVER. Every line is gated on a playStats flag, following the
 *    convention already used for the torch and hut alerts. She is a person
 *    making an observation, not a tutorial system repeating itself.
 *
 * 2. SHE ONLY SPEAKS IN THE ROOM. Firing a line into an empty room while the
 *    player is out on the map wastes it -- the notification scrolls past
 *    unread. Deferred lines are queued and delivered on return.
 *
 * 3. SHE HAS A POSITION, AND IT SOFTENS OR HARDENS. Her weapon commentary is
 *    the game's clearest statement of the hope/fear question, delivered
 *    before the doctrine is chosen. Once the player has committed to a track
 *    she stops arguing and starts reflecting it back -- approving on hope,
 *    resigned on fear.
 *
 * 4. SHE IS NEVER PUNITIVE. She does not moralise at a player who chose fear;
 *    she walks out into the wastes for them at the Lab. Her disappointment is
 *    the disappointment of somebody who stayed.
 */
var Builder = {

	/* Queue for lines that came due while the player was away. Kept in save
	 * state rather than memory so leaving mid-expedition, closing the tab and
	 * coming back still delivers them. */
	QUEUE: 'game.builder.queue',

	/* Weapons she reacts to. Deliberately NOT the bone spear or the iron
	 * sword: those are what you kill animals with to eat, and she has no
	 * argument with eating. These are the ones with no hunting use. */
	WAR_WEAPONS: [
		'rifle', 'laser rifle', 'grenade', 'bolas', 'bayonet',
		'katana', 'energy blade', 'disruptor', 'plasma rifle', 'handheld nuke'
	],

	/* Is she present and able to talk? Level 4 is when she stops being "a
	 * stranger" and starts building. Before that she is barely conscious and
	 * has no opinions about anything. */
	isPresent: function() {
		return $SM.get('game.builder.level', true) >= 4;
	},

	inRoom: function() {
		return typeof Engine !== 'undefined' && Engine.activeModule === Room;
	},

	/* Says something, or queues it if the player is not here to hear it.
	 *
	 * The flag is set at SPEAK time rather than at queue time, so a line that
	 * is queued and never delivered (the player dies out there, say) is not
	 * silently consumed. */
	say: function(flag, text) {
		if($SM.get('playStats.' + flag)) { return false; }
		if(!Builder.isPresent()) { return false; }

		if(!Builder.inRoom()) {
			var queue = $SM.get(Builder.QUEUE) || [];
			// Don't queue the same line twice across several expeditions.
			for(var i = 0; i < queue.length; i++) {
				if(queue[i].flag === flag) { return false; }
			}
			queue.push({ flag: flag, text: text });
			$SM.set(Builder.QUEUE, queue);
			return false;
		}

		$SM.set('playStats.' + flag, true);
		Notifications.notify(Room, text);
		return true;
	},

	/* Delivers anything that came due while the player was away. Called from
	 * Room.onArrival. Spaced out so several milestones in one expedition
	 * don't arrive as an unreadable block. */
	flushQueue: function() {
		var queue = $SM.get(Builder.QUEUE) || [];
		if(!queue || queue.length === 0) { return; }
		$SM.remove(Builder.QUEUE);

		queue.forEach(function(item, i) {
			Engine.setTimeout(function() {
				if($SM.get('playStats.' + item.flag)) { return; }
				$SM.set('playStats.' + item.flag, true);
				Notifications.notify(Room, item.text);
			}, i * 3000);
		});
	},

	/* ---- triggers ------------------------------------------------------ */

	/* First time a weapon with no hunting use is made.
	 *
	 * This is her central argument, and it is deliberately delivered as a
	 * question rather than an objection -- she is not forbidding anything,
	 * she is asking whether it has to go this way. The doctrine question she
	 * asks later at the first hut is the same question with the stakes
	 * raised. */
	onWeaponCrafted: function(thing) {
		if(Builder.WAR_WEAPONS.indexOf(thing) === -1) { return; }
		Builder.say('builderWarWeapon',
			_("the builder looks at it a while. says nothing hunts with that. says it is hard enough for anyone to stay alive out there without us doing this to each other, and asks whether there has not been enough of it already."));
	},

	/* First kill brought home. */
	onFirstKill: function() {
		Builder.say('builderFirstKill',
			_("she does not ask what happened out there. she can see most of it. says the wastes kill people on their own without any help from us, and that maybe there is another way, and that she knows how that sounds."));
	},

	/* First story location found. */
	onFirstLandmark: function() {
		Builder.say('builderFirstLandmark',
			_("she listens to the whole of it without interrupting. says somebody built that, and lived in it, and is not there now. says this rock is mostly other people's endings."));
	},

	/* Once the doctrine is set she stops arguing and starts reflecting it
	 * back. Called from the hope/fear scenes. */
	onDoctrine: function(doctrine) {
		if(doctrine === 'hope') {
			Builder.say('builderDoctrineEcho',
				_("she has been quieter since the huts went up, and it is a better quiet. says she has built for people who were being kept before. says this is not that."));
		} else if(doctrine === 'fear') {
			Builder.say('builderDoctrineEcho',
				_("she builds what is asked for and does not argue about it. says only that she has seen a place run this way before, and that she was not one of the people running it."));
		}
	},

	/* First time the player comes home having lost villagers. */
	onFirstLoss: function() {
		Builder.say('builderFirstLoss',
			_("she counts them twice, which does not change the number. says she does not know any of their names, and that this is the part she cannot get used to."));
	}
};
