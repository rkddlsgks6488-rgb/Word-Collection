// Web Audio API & 실제 앰비언스 오디오를 결합한 사운드 엔진
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.heartbeatInterval = null;

        // 사용자 업로드 배경 효과음 연동
        this.bgmLoop = new Audio('assets/bgm_ambient_1.mp3');
        this.bgmLoop.loop = true;
        this.bgmLoop.volume = 0.35;

        this.bgmStinger = new Audio('assets/bgm_ambient_0.mp3');
        this.bgmStinger.volume = 0.4;

        this.isAmbientPlaying = false;
        this.ambientStingerTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.startAmbient();
    }

    startAmbient() {
        if (this.isMuted || this.isAmbientPlaying) return;
        this.isAmbientPlaying = true;

        this.bgmLoop.currentTime = 0;
        this.bgmLoop.play().catch(e => {
            console.log("Audio autoplay waiting for user interaction:", e);
        });

        // 7~10초 간격으로 보조 앰비언스 효과음(bgm_ambient_0)을 은은하게 교차 재생
        if (!this.ambientStingerTimer) {
            this.ambientStingerTimer = setInterval(() => {
                if (!this.isMuted && this.isAmbientPlaying) {
                    this.bgmStinger.currentTime = 0;
                    this.bgmStinger.play().catch(() => {});
                }
            }, 8500);
        }
    }

    stopAmbient() {
        this.isAmbientPlaying = false;
        this.bgmLoop.pause();
        this.bgmStinger.pause();
        if (this.ambientStingerTimer) {
            clearInterval(this.ambientStingerTimer);
            this.ambientStingerTimer = null;
        }
    }

    setAmbientTension(state) {
        if (this.isMuted) return;
        if (state === 'danger') {
            this.bgmLoop.volume = 0.65;
            this.bgmStinger.volume = 0.7;
        } else if (state === 'warning') {
            this.bgmLoop.volume = 0.5;
            this.bgmStinger.volume = 0.55;
        } else {
            this.bgmLoop.volume = 0.35;
            this.bgmStinger.volume = 0.4;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.bgmLoop.pause();
            this.bgmStinger.pause();
        } else {
            this.startAmbient();
        }
        return this.isMuted;
    }

    playFootstep(isRunning = false) {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isRunning ? 90 : 60, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        gain.gain.setValueAtTime(isRunning ? 0.25 : 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playWhistle() {
        // 순사 호각 소리 (날카로운 2음 호각)
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        [0, 0.15].forEach((delay, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const freq = idx === 0 ? 2400 : 2800;
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.linearRampToValueAtTime(freq + 100, now + delay + 0.12);

            gain.gain.setValueAtTime(0.3, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.15);
        });
    }

    playAlert() {
        // 발견 경보음
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.25);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playInteract() {
        // 조사 / 터치 사운드
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playUnlock() {
        // 문 열림 / 자물쇠 해제 소리
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        [0, 0.08, 0.16].forEach((delay, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(300 + i * 200, now + delay);

            gain.gain.setValueAtTime(0.15, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.08);
        });
    }

    playSuccess() {
        // 퍼즐 정답 / 원고 획득 (경쾌하고 웅장한 아르페지오)
        if (this.isMuted || !this.ctx) return;
        const notes = [440, 554.37, 659.25, 880]; // A major
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0.25, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.45);
        });
    }

    playPaper() {
        // 종이 넘기는 소리 (노이즈 버스트)
        if (this.isMuted || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    playHide() {
        // 옷장/은신처에 숨기
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }
}

window.soundEngine = new SoundEngine();
