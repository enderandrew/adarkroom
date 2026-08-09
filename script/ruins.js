/**
 * Ruins glue.
 *
 * Connects Glyphs (the puzzle) to the event panel (the scene). Kept separate
 * from glyphs.js so the puzzle module stays independent of the event system
 * and can be reused by any other lock added later.
 */
var Ruins = {

	/* Draws a lock into the current scene's description and wires the named
	 * button to unlock when it's solved.
	 *
	 * The button is declared in the scene with available: () => false so it
	 * renders disabled; drawButtons has already run by the time onRender
	 * fires, so this just re-enables it in place. That ordering is the whole
	 * reason onRender exists -- see Events.startStory.
	 *
	 * A fresh puzzle is generated per visit, so a player who leaves and comes
	 * back doesn't get the same grid, and a solution can't be memorised across
	 * runs. */
	renderLock: function(preset, buttonId) {
		var panel = Events.eventPanel();
		var desc = $('#description', panel);

		$('<div>')
			.addClass('glyphHint')
			.text(_('no glyph may repeat in any row, in any column, or inside any bordered block. red glyphs are fixed.'))
			.appendTo(desc);

		var puzzle = Glyphs.generate(preset);

		Glyphs.render(desc, puzzle, function() {
			var btn = $('#' + buttonId, panel);
			if(btn.length) {
				Button.setDisabled(btn, false);
			}
			Notifications.notify(null, _('the glyphs settle, and something behind the door disengages.'));
			AudioEngine.playSound(AudioLibrary.CRAFT);
		});

		return puzzle;
	}
};
