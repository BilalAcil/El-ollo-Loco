// js/audio-manager.js

window.isMuted = false;
window.allGameAudio = [];

(function () {
  const OriginalAudio = window.Audio;

  function applyMuteToAll(muted) {
    window.allGameAudio.forEach((a) => {
      a.muted = muted;
    });
  }

  window.Audio = function (...args) {
    const audio = new OriginalAudio(...args);
    window.allGameAudio.push(audio);
    audio.muted = window.isMuted;
    return audio;
  };

  window.Audio.prototype = OriginalAudio.prototype;

  window.setGlobalMute = function (muted) {
    window.isMuted = muted;
    applyMuteToAll(muted);
  };
})();
