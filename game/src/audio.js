// All sound in Turkey Run is synthesized with WebAudio — no audio
// files, no network, nothing to load. A gobble, a knife whoosh, an
// oven sizzle and a little autumn tune, all from oscillators and
// filtered noise. Audio starts on the first user gesture (browsers
// forbid it before one) and every call is safe when it has not.
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A cheerful autumn walk: C major pentatonic, one soft pluck a beat.
  const MELODY = [523, 659, 784, 659, 587, 659, 523, 440, 523, 587, 659, 784, 880, 784, 659, 587];
  const BEAT = 0.22;

  function ensure() {
    if (context) return true;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return false;
      context = new AC();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!context || muted) return;
    try {
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  function noise(dur, vol, lowpass) {
    if (!context || muted) return;
    try {
      const now = context.currentTime;
      const len = Math.max(1, Math.floor(context.sampleRate * dur));
      const buffer = context.createBuffer(1, len, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = context.createBufferSource();
      src.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = context.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(now);
    } catch {
      // See tone(): sound never breaks the game.
    }
  }

  function playMusicStep() {
    if (!context || muted) return;
    const freq = MELODY[musicStep % MELODY.length];
    musicStep += 1;
    tone(freq, BEAT * 0.9, 'triangle', 0.10);
    if (musicStep % 4 === 1) tone(freq / 2, BEAT * 1.8, 'sine', 0.08);
  }

  return {
    // Call from the first gesture (start, jump, click). Safe to repeat.
    unlock() {
      if (!ensure()) return;
      if (context.state === 'suspended') context.resume().catch(() => {});
      if (!musicTimer) {
        musicTimer = window.setInterval(playMusicStep, BEAT * 1000);
      }
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
    gobble() {
      tone(320, 0.09, 'square', 0.16, 180);
      window.setTimeout(() => tone(380, 0.08, 'square', 0.14, 200), 90);
    },
    cluck() {
      tone(500, 0.05, 'square', 0.10, 420);
    },
    jingle() {
      tone(880, 0.12, 'sine', 0.18);
      window.setTimeout(() => tone(1318, 0.16, 'sine', 0.16), 90);
    },
    whoosh() {
      noise(0.22, 0.22, 1800);
    },
    sizzle() {
      noise(0.4, 0.16, 3200);
    },
    thud() {
      tone(140, 0.18, 'sine', 0.3, 60);
      noise(0.12, 0.2, 500);
    },
    farmerShout() {
      tone(180, 0.16, 'sawtooth', 0.2, 120);
      window.setTimeout(() => tone(150, 0.2, 'sawtooth', 0.18, 90), 140);
    },
    dash() {
      noise(0.18, 0.14, 2600);
    },
    fanfare() {
      [523, 659, 784, 1046].forEach((f, i) => {
        window.setTimeout(() => tone(f, 0.3, 'triangle', 0.2), i * 130);
      });
    },
    caught() {
      [392, 370, 349, 311].forEach((f, i) => {
        window.setTimeout(() => tone(f, 0.34, 'sawtooth', 0.16), i * 190);
      });
    },
  };
}
