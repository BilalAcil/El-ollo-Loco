//#region Audio Manager (Global Mute Wrapper)

/**
 * @file audio-manager.js
 * @description
 * Global audio wrapper: collects all created audio instances and enables
 * a global mute/unmute via window.setGlobalMute().
 *
 * @global
 * @property {boolean} window.isMuted - Global mute state.
 * @property {HTMLAudioElement[]} window.allGameAudio - List of all audio instances in the game.
 * @property {(muted: boolean) => void} window.setGlobalMute - Sets global mute and applies it to all audio instances.
 */

window.isMuted = false;
window.allGameAudio = [];

//#endregion

(function () {
  const OriginalAudio = window.Audio;

  //#region Helpers

  /**
   * Applies the mute state to all known audio instances.
   * @param {boolean} muted - True = muted, false = sound on.
   * @returns {void}
   */
  function applyMuteToAll(muted) {
    window.allGameAudio.forEach((a) => {
      a.muted = muted;
    });
  }

  //#endregion

  //#region Audio constructor wrapper

  /**
   * Wrapper around the native Audio constructor:
   * - creates an Audio instance
   * - stores it in window.allGameAudio
   * - immediately applies the current global mute state
   *
   * @constructor
   * @param {...any} args - Arguments forwarded to the original Audio constructor.
   * @returns {HTMLAudioElement} The newly created audio instance.
   */
  window.Audio = function (...args) {
    const audio = new OriginalAudio(...args);
    window.allGameAudio.push(audio);
    audio.muted = window.isMuted;
    return audio;
  };

  // Keep the prototype so methods/properties work like the original Audio object.
  window.Audio.prototype = OriginalAudio.prototype;

  //#endregion

  //#region Public API

  /**
   * Sets the global mute state and applies it to all known audio instances.
   * @function window.setGlobalMute
   * @param {boolean} muted - True = muted, false = sound on.
   * @returns {void}
   */
  window.setGlobalMute = function (muted) {
    window.isMuted = muted;
    applyMuteToAll(muted);
  };

  //#endregion
})();
