/**
 * @file audio-manager.js
 * @description
 * Globaler Audio-Wrapper: sammelt alle erstellten Audio-Instanzen und ermöglicht
 * ein globales Mute/Unmute über window.setGlobalMute().
 *
 * @global
 * @property {boolean} window.isMuted - Globaler Mute-Status.
 * @property {HTMLAudioElement[]} window.allGameAudio - Liste aller Audio-Instanzen im Spiel.
 * @property {(muted: boolean) => void} window.setGlobalMute - Setzt global Mute und wendet es auf alle Audios an.
 */

window.isMuted = false;
window.allGameAudio = [];

(function () {
  const OriginalAudio = window.Audio;

  /**
   * Setzt den Mute-Status auf alle bekannten Audio-Instanzen.
   * @param {boolean} muted - True = stumm, false = Ton an.
   * @returns {void}
   */
  function applyMuteToAll(muted) {
    window.allGameAudio.forEach((a) => {
      a.muted = muted;
    });
  }

  /**
   * Wrapper um den nativen Audio-Konstruktor:
   * - erstellt eine Audio-Instanz
   * - speichert sie in window.allGameAudio
   * - übernimmt sofort den aktuellen globalen Mute-Status
   *
   * @constructor
   * @param {...any} args - Parameter, die an den originalen Audio-Konstruktor weitergegeben werden.
   * @returns {HTMLAudioElement} Die neu erstellte Audio-Instanz.
   */
  window.Audio = function (...args) {
    const audio = new OriginalAudio(...args);
    window.allGameAudio.push(audio);
    audio.muted = window.isMuted;
    return audio;
  };

  // Prototyp beibehalten, damit Methoden/Properties wie beim Original funktionieren.
  window.Audio.prototype = OriginalAudio.prototype;

  /**
   * Setzt den globalen Mute-Status und wendet ihn auf alle bekannten Audio-Instanzen an.
   * @function window.setGlobalMute
   * @param {boolean} muted - True = stumm, false = Ton an.
   * @returns {void}
   */
  window.setGlobalMute = function (muted) {
    window.isMuted = muted;
    applyMuteToAll(muted);
  };
})();
