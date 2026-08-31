/**
 Module for triggering marketing messages
 @author mtownsend
 @since Jan 2021
*/

Events.Marketing = [{
  /* Play Penrose! */
  title: _('Penrose'),
  /* Previously had no gate at all beyond "hasn't been shown yet" -- no
   * module check, no progress check -- so it could win the very first
   * event roll of a brand-new game, before the player has done anything.
   * A cross-promotion popup arriving before the player has even gathered
   * their first piece of wood reads as the game being broken, not as an
   * ad. Room.hasBasicProgress() is the same "has bought a cart" line used
   * to gate the other earliest Room events, for the same reason. */
  isAvailable: () => Engine.activeModule == Room && Room.hasBasicProgress() && !$SM.get('marketing.penrose'),
  scenes: {
    'start': {
      text: [
        _('a strange thrumming, pounding and crashing. visions of people and places, of a huge machine and twisting curves.'),
        _('inviting. it would be so easy to give in, completely.')
      ],
      notification: _('a strange thrumming, pounding and crashing. and then gone.'),
      blink: true,
      buttons: {
        'give in': {
          text: _('give in'),
          onClick: () => {
            $SM.set('marketing.penrose', true);
          },
          link: 'https://penrose.doublespeakgames.com/?utm_source=adarkroom&utm_medium=crosspromote&utm_campaign=event'
        },
        'ignore': {
          text: _('resist it'),
          nextScene: 'end'
        }
      }
    }
  },
  audio: AudioLibrary.EVENT_NOISES_INSIDE
}];
