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

	/* Per-location reactions to a first visit, keyed on the landmark's scene
	 * name (World.LANDMARKS[tile].scene, the same string Events.Setpieces is
	 * keyed on) -- so wiring a new one up is adding a table row, not a new
	 * function and a new call site.
	 *
	 * Every location here is a place she can react to as HERSELF, not as a
	 * tour guide: what it costs to build something (the mines), the one
	 * other person who was exiled for the same reason she watched happen
	 * (the swamp), what it means that the player walked into the one place
	 * she begged them not to (the Lab). Deliberately does not cover every
	 * landmark in the game -- town, city, ruins, cave, house, battlefield
	 * and the rest still fall through to the generic line below. Naming a
	 * reaction to literally everything would flatten the ones that are
	 * supposed to stand out. */
	LOCATION_LINES: {
		ironmine: {
			flag: 'builderIronMine',
			text: _("she turns the ore over in both hands before she says anything. says whoever dug this vein meant it to still be findable. says that is a strange thing to plan for, and a stranger thing to be grateful for.")
		},
		coalmine: {
			flag: 'builderCoalMine',
			text: _("she banks it without being asked, out of habit, before she has even said anything about it. says a fire is the first thing and the last thing, whichever world you are having this argument on.")
		},
		sulphurmine: {
			flag: 'builderSulphurMine',
			text: _("she is careful with it in a way she is not careful with iron or coal. says she has seen what happens when this is stored wrong, and does not say where.")
		},
		/* The swamp already has its own scene, and 'talk' already carries
		 * the wanderer's own account of himself -- that he led the fleets,
		 * that the destruction was to feed wanderer hungers, that his time
		 * here is penance. This does not contradict that; it sits beside
		 * it. He led them operationally, under an authority above his own,
		 * and the guilt in that account is real and his. What this adds is
		 * the later half: that at some point he was the one who said
		 * something, the same as her, and it cost him the same as it is
		 * costing the player. Gated on game.metOldWanderer so it can never
		 * arrive before the player has actually heard him say who he was. */
		swamp: {
			flag: 'builderLoneWanderer',
			text: _("she goes very still when you describe him. says she knows exactly who that is, and what he signed, and that neither of those is the part that matters to her. says he was one of the two who stood up when the sentence was read. she does not say who the other one was."),
			available: function() { return $SM.get('game.metOldWanderer') === true; }
		},
		executioner: {
			flag: 'builderExecutioner',
			text: _("she does not ask if you are alright. she can see that you are not, entirely. says a ship like that does not get built for one purpose, and asks, quietly, which purpose found you.")
		},
		temple: {
			flag: 'builderTemple',
			text: _("she asks what they were like. not what they said -- what they were LIKE. says she has never been sure whether watching is a kindness or the absence of one, and that she has had a long time to decide and has not.")
		},
		graveyard: {
			flag: 'builderGraveyard',
			text: _("she is quiet for long enough that you think she is not going to say anything. then: that every name on a stone like that was a person who trusted somebody, once, right up until the point where trusting them was the mistake that killed them.")
		},
		lab: {
			flag: 'builderLab',
			text: _("she does not say i told you so, and you can see what it costs her not to. says she is glad you are standing in front of her and asks nothing else, and you understand that not asking is the kindness.")
		},
		crater: {
			flag: 'builderCrater',
			text: _("she checks you over before she says a word, the way she would check a wound. says glass like that does not happen on its own, and that whatever did it to the ground would have done the same to a person standing on it.")
		},
		observatory: {
			flag: 'builderObservatory',
			text: _("she asks if the stars looked right. when you tell her they did not, she nods like that confirms something she already suspected and declines to say what.")
		},
		strata: {
			flag: 'builderStrata',
			text: _("she asks how thick the layers were. when you tell her, she goes quiet in the specific way she goes quiet when a number means something to her that it does not mean to you.")
		},
		prison: {
			flag: 'builderPrison',
			text: _("she asks how you got in. you tell her about the six handprints and she stops what she is doing entirely. says that is not a lock, that is a quorum, and that nobody was ever meant to open that door on their own -- and then does not ask the obvious next question, and you both let her not ask it.")
		},
		concordance: {
			flag: 'builderConcordance',
			text: _("she asks you to say the charter again, slowly, and mouths the last line along with you the second time. says she did not know anyone had written that down. says somebody should have.")
		}
	},

	/* First story location found, with a location-specific reaction where one
	 * exists, falling back to a generic line for everything else. */
	onFirstLandmark: function(sceneName) {
		var specific = Builder.LOCATION_LINES[sceneName];
		if(specific && (typeof specific.available !== 'function' || specific.available())) {
			Builder.say(specific.flag, specific.text);
			return;
		}
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