
class SoundManager {
  sounds: { [key: string]: HTMLAudioElement };
  muted: boolean;
  unlocked: boolean;

  constructor() {
    this.muted = false;
    this.unlocked = false;
    this.sounds = {};
    
    // List of sound files to preload
    const soundFiles = [
      'footstep',
      'pickup',
      'drop',
      'basket_success',
      'door_open',
      'door_close',
      'win',
      'lose',
      'click',
      'chop',      // NEW
      'oven_ding', // NEW
      'sizzle',    // NEW
      'eat',       // NEW
      'place'      // NEW
    ];

    // Initialize audio objects
    if (typeof window !== 'undefined') {
      soundFiles.forEach(file => {
        const audio = new Audio(`/sounds/${file}.mp3`);
        audio.preload = 'auto'; // Force buffer for lower latency
        this.sounds[file] = audio;
      });
    }
  }

  setMuted(isMuted: boolean) {
    this.muted = isMuted;
  }

  /**
   * Tries to play ALL sounds silently to unlock the Audio Context on iOS/Browsers
   * This should be called on the FIRST user interaction (Touch, Click, or Gamepad Press)
   */
  unlock() {
    if (this.unlocked) return;

    console.log("Starting aggressive audio warmup for iOS...");

    // Iterate through ALL loaded sounds
    Object.values(this.sounds).forEach((sound) => {
      const originalVolume = sound.volume;
      
      // Mute temporarily
      sound.volume = 0;
      
      // Force play and immediate pause
      sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
        sound.volume = originalVolume || 0.6; // Restore volume
      }).catch(e => {
        // It's normal for some to fail if rapid-fired, but we try our best
        // console.warn("Warmup skipped for a sound", e);
      });
    });

    this.unlocked = true;
    console.log("Audio System fully unlocked.");
  }

  /**
   * Stops a specific sound immediately.
   */
  stop(name: string) {
    if (this.sounds[name]) {
      this.sounds[name].pause();
      this.sounds[name].currentTime = 0;
    }
  }

  /**
   * Plays a sound effect.
   * @param name The name of the sound file (without extension)
   * @param variance If true, slightly randomizes pitch/volume for natural feel (good for footsteps)
   */
  play(name: string, variance: boolean = false) {
    if (this.muted || !this.sounds[name]) return;

    const sound = this.sounds[name];
    
    // Clone node allows playing overlapping sounds (e.g. multiple footsteps fast)
    // IMPORTANT: Cloning node on iOS sometimes loses the "blessing" of the parent.
    // However, if we warmed up the parent, usually clones work better.
    // If clones fail on specific iOS versions, we might need to use the original instance (cutting off previous sound).
    // For now, let's try using the original for crucial UI sounds if clones fail, but clone is better for footsteps.
    
    let audioToPlay: HTMLAudioElement;

    // Use clone for repetitive sounds (footsteps), original for UI/One-offs to ensure they play
    if (name === 'footstep' || name === 'pickup') {
         audioToPlay = sound.cloneNode() as HTMLAudioElement;
    } else {
         // Re-using the single instance ensures the "unlock" works 100%, 
         // but might cut off the sound if played rapidly.
         audioToPlay = sound;
         audioToPlay.currentTime = 0;
    }
    
    if (name === 'click') {
      audioToPlay.playbackRate = 1.5; 
      audioToPlay.volume = 0.6;
    } else if (variance) {
      audioToPlay.volume = 0.5 + Math.random() * 0.3; 
      audioToPlay.playbackRate = 1.1 + Math.random() * 0.2; 
    } else {
      audioToPlay.volume = 0.8;
    }

    audioToPlay.play().catch(e => {
      if (e.name !== 'NotAllowedError') {
         console.warn(`Audio play failed for ${name}`, e);
      }
    });
  }
}

export const audioManager = new SoundManager();
