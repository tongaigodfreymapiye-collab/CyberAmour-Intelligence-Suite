export const createBeep = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
};

export const playClickSound = () => createBeep(400, 'sine', 0.1, 0.05);
export const playAlertSound = (volMult = 1.0) => {
    createBeep(800, 'square', 0.1, 0.1 * volMult);
    setTimeout(() => createBeep(1200, 'square', 0.15, 0.1 * volMult), 100);
}
export const playSuccessSound = () => {
  createBeep(400, 'sine', 0.1, 0.05);
  setTimeout(() => createBeep(600, 'sine', 0.15, 0.05), 100);
};
export const playErrorSound = () => {
  createBeep(300, 'sawtooth', 0.2, 0.1);
  setTimeout(() => createBeep(200, 'sawtooth', 0.3, 0.1), 150);
}
export const playScanSound = () => createBeep(600, 'triangle', 0.1, 0.05);

export const playChimeSound = (volMult = 1.0) => {
    createBeep(880, 'sine', 0.5, 0.1 * volMult);
    setTimeout(() => createBeep(1108.73, 'sine', 1.0, 0.1 * volMult), 500);
}

export const playSirenSound = (volMult = 1.0) => {
    createBeep(800, 'square', 0.5, 0.1 * volMult);
    setTimeout(() => createBeep(1000, 'square', 0.5, 0.1 * volMult), 300);
    setTimeout(() => createBeep(800, 'square', 0.5, 0.1 * volMult), 600);
    setTimeout(() => createBeep(1000, 'square', 0.5, 0.1 * volMult), 900);
}

export const playSubtleBeepSound = (volMult = 1.0) => {
    createBeep(440, 'sine', 0.2, 0.05 * volMult);
    setTimeout(() => createBeep(440, 'sine', 0.2, 0.05 * volMult), 400);
}

export const playAlarmSoundByType = (type: string = 'default', volMult: number = 1.0) => {
    if (type === 'chime') playChimeSound(volMult);
    else if (type === 'siren') playSirenSound(volMult);
    else if (type === 'subtle_beep') playSubtleBeepSound(volMult);
    else playAlertSound(volMult);
}
