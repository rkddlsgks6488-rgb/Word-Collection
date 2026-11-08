// 메인 게임 로직 및 캔버스 렌더러 (새 픽셀아트 맵 & 가구 배치 완벽 연동)
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // 상태
        this.isPaused = false;
        this.isGameOver = false;
        this.isGameWon = false;
        this.isCaught = false;
        this.tickCount = 0;

        // 인벤토리 & 진행도
        this.collectedManuscripts = new Set();
        this.inventory = new Set(['당직실 열쇠']);
        this.solvedPuzzles = new Set();

        // 입력 키 및 터치 조작 상태
        this.keys = {};
        this.touchInput = { dx: 0, dy: 0, active: false };
        this.activeInteraction = null;
        this.scale = 1;

        // 플레이어 설정 (제1방 당직실 마루에서 시작)
        this.player = {
            x: 95,
            y: 230,
            radius: 11,
            speed: 2.3,
            runSpeed: 4.2,
            direction: 0,
            facing: 'down',
            animFrame: 0,
            animTimer: 0,
            isMoving: false,
            isRunning: false,
            isHiding: false,
            currentHidingSpot: null,
            noiseRadius: 0,
            noiseRipples: []
        };

        // 맵 배경 이미지 로드
        this.mapBg = new Image();
        this.mapBg.src = 'assets/map_bg.png?v=' + Date.now();

        // 캐릭터 스프라이트 시트 로드
        this.playerSprite = new Image();
        this.playerSprite.src = 'assets/player_spritesheet.png?v=' + Date.now();
        this.spriteConfig = {
            frameWidth: 128,
            frameHeight: 191.25,
            renderWidth: 38,
            renderHeight: 56
        };

        // 순사 스프라이트 시트 로드
        this.officerSprite = new Image();
        this.officerSprite.src = 'assets/officer_spritesheet.png?v=' + Date.now();
        this.officerSpriteConfig = {
            frameWidth: 128,
            frameHeight: 143,
            renderWidth: 42,
            renderHeight: 48
        };

        // 김구 선생님 NPC 스프라이트 시트 로드
        this.kimguSprite = new Image();
        this.kimguSprite.src = 'assets/kimgu_spritesheet.png?v=' + Date.now();
        this.kimguNpc = {
            name: "백범 김구 선생",
            x: 265,
            y: 168, // 제1방 당직실 전등 불빛 아래 서랍장 옆
            radius: 14,
            renderWidth: 38,
            renderHeight: 56,
            frame: 1 // 지팡이를 짚고 계신 모습 (Row 0, Col 1)
        };

        // 6개 방 영역 정의 (새 맵 이미지 기준)
        this.rooms = [
            { id: 1, name: "제1방 [당직실]", bounds: { x: 28, y: 70, w: 290, h: 232 } },
            { id: 2, name: "제2방 [기록 서재]", bounds: { x: 330, y: 70, w: 316, h: 232 } },
            { id: 3, name: "제3방 [활판 인쇄실]", bounds: { x: 658, y: 70, w: 312, h: 232 } },
            { id: 4, name: "제4방 [순사 취조실]", bounds: { x: 28, y: 404, w: 290, h: 245 } },
            { id: 5, name: "제5방 [사진 암실]", bounds: { x: 330, y: 404, w: 316, h: 245 } },
            { id: 6, name: "제6방 [지하 비밀 금고]", bounds: { x: 658, y: 404, w: 312, h: 245 } }
        ];

        // 문 (맵 이미지에 그려진 출입문/자물쇠 위치와 정확히 일치)
        this.doors = [
            { id: "door1", room: 1, x: 154, y: 302, w: 48, h: 14, isOpen: true, requiredItem: null },
            { id: "door2", room: 2, x: 484, y: 302, w: 48, h: 14, isOpen: false, requiredItem: "서재 열쇠" },
            { id: "door3", room: 3, x: 814, y: 302, w: 48, h: 14, isOpen: false, requiredItem: "인쇄실 활자함 열쇠" },
            { id: "door4", room: 4, x: 154, y: 392, w: 48, h: 14, isOpen: false, requiredItem: "취조실 통행증" },
            { id: "door5", room: 5, x: 484, y: 392, w: 48, h: 14, isOpen: false, requiredItem: "암실 차광 열쇠" },
            { id: "door6", room: 6, x: 814, y: 392, w: 48, h: 14, isOpen: false, requiredItem: "지하 금고 마스터 레버" }
        ];

        // 벽 및 대형 가구 충돌 영역 (맵 이미지의 벽면·기둥과 1:1 매칭)
        this.walls = [
            // 상단 뒷벽 (전등, 창호지 창문, 상단 커튼이 걸린 벽면 상단부)
            { x: 20, y: 60, w: 960, h: 72 },
            // 하단 외벽
            { x: 20, y: 648, w: 960, h: 20 },
            // 좌우 외벽
            { x: 15, y: 60, w: 15, h: 600 },
            { x: 970, y: 60, w: 15, h: 600 },

            // 상단 방 사이 세로 칸막이 벽 (1~2방, 2~3방)
            { x: 318, y: 60, w: 12, h: 254 },
            { x: 646, y: 60, w: 12, h: 254 },

            // 상단 방과 복도 사이 가로벽 (문 3곳 제외)
            { x: 30, y: 302, w: 124, h: 12 },
            { x: 202, y: 302, w: 282, h: 12 },
            { x: 532, y: 302, w: 282, h: 12 },
            { x: 862, y: 302, w: 110, h: 12 },

            // 하단 방과 복도 사이 가로벽 (문 3곳 제외)
            { x: 30, y: 392, w: 124, h: 12 },
            { x: 202, y: 392, w: 282, h: 12 },
            { x: 532, y: 392, w: 282, h: 12 },
            { x: 862, y: 392, w: 110, h: 12 },

            // 하단 방 사이 세로 칸막이 벽 (4~5방, 5~6방)
            { x: 318, y: 392, w: 12, h: 260 },
            { x: 646, y: 392, w: 12, h: 260 },

            // 방 내부 주요 가구 물리 충돌체 (자연스럽게 돌아가도록 설정)
            { x: 152, y: 192, w: 78, h: 38, isFurniture: true } // 제1방 중앙 책상
        ];

        // 은신처 (새 맵 이미지에 그려진 옷장, 창호지 벽장, 차광 커튼, 캐비닛 위치와 정확히 일치)
        this.hidingSpots = [
            // 제1방: 좌상단 대형 나무 옷장 & 좌측 벽면 장식장
            { id: "hide1_closet", type: "당직실 옷장", x: 42, y: 95, w: 60, h: 68, hideX: 72, hideY: 145 },
            { id: "hide1_shelf", type: "목재 수납장", x: 32, y: 192, w: 30, h: 72, hideX: 48, hideY: 228 },

            // 제2방: 상단 창호지 벽장 & 좌하단 고서 수납함
            { id: "hide2_screen", type: "창호지 벽장", x: 380, y: 92, w: 115, h: 52, hideX: 437, hideY: 142 },
            { id: "hide2_box", type: "고서 보관함", x: 336, y: 232, w: 28, h: 55, hideX: 352, hideY: 260 },

            // 제3방: 상단 남색 차광 커튼 & 우측 인쇄지 보관함
            { id: "hide3_curtain", type: "인쇄실 차광 커튼 뒤", x: 708, y: 90, w: 190, h: 55, hideX: 800, hideY: 142 },
            { id: "hide3_cabinet", type: "인쇄지 수납장", x: 928, y: 192, w: 32, h: 65, hideX: 940, hideY: 225 },

            // 제4방: 좌상단 대형 옷장 & 좌하단 수납장
            { id: "hide4_closet", type: "취조실 대형 옷장", x: 40, y: 415, w: 68, h: 85, hideX: 74, hideY: 480 },
            { id: "hide4_shelf", type: "구석 수납장", x: 32, y: 558, w: 30, h: 70, hideX: 48, hideY: 590 },

            // 제5방: 좌상단 남색 암실 커튼
            { id: "hide5_curtain", type: "암실 푸른 커튼 뒤", x: 362, y: 412, w: 116, h: 95, hideX: 420, hideY: 475 },

            // 제6방: 좌측 및 우측 암막 커튼
            { id: "hide6_left_curtain", type: "좌측 암막 커튼 뒤", x: 660, y: 412, w: 110, h: 95, hideX: 715, hideY: 475 },
            { id: "hide6_right_curtain", type: "우측 암막 커튼 뒤", x: 865, y: 412, w: 98, h: 95, hideX: 914, hideY: 475 }
        ];

        // 단서(Clues) 및 퍼즐(Puzzles) 오브젝트 (맵 이미지 속 실제 사물 위치에 정확히 배치)
        this.interactables = [
            // --- 제1방 [당직실] ---
            {
                id: "puzzle1", room: 1, type: "puzzle",
                name: "중앙 책상 위 푸른 검열 일지",
                x: 148, y: 185, w: 86, h: 52,
                markerX: 218, markerY: 198, // 책상 위 파란 일지 위치
                solved: false
            },
            {
                id: "clue1", room: 1, type: "clue",
                name: "협탁 위 맞춤법 수첩 (단서)",
                x: 108, y: 115, w: 44, h: 52,
                markerX: 125, markerY: 128 // 협탁 위 파란 노트 위치
            },

            // --- 제2방 [기록 서재] ---
            {
                id: "puzzle2", room: 2, type: "puzzle",
                name: "자물쇠 달린 큰 고서 궤짝",
                x: 594, y: 120, w: 50, h: 56,
                markerX: 619, markerY: 142, // 우상단 자물쇠 달린 큰 궤짝
                solved: false
            },
            {
                id: "clue2", room: 2, type: "clue",
                name: "작은 목제 서랍함 (단서)",
                x: 550, y: 126, w: 40, h: 50,
                markerX: 570, markerY: 145 // 옆의 작은 나무 궤짝
            },

            // --- 제3방 [활판 인쇄실] ---
            {
                id: "puzzle3", room: 3, type: "puzzle",
                name: "바닥의 납활자 보관 상자",
                x: 666, y: 238, w: 38, h: 52,
                markerX: 685, markerY: 255, // 좌하단 나무 상자
                solved: false
            },
            {
                id: "clue3", room: 3, type: "clue",
                name: "벽면 활자 조판 메모함 (단서)",
                x: 664, y: 180, w: 34, h: 36,
                markerX: 681, markerY: 192 // 좌중단 벽면 작은 상자
            },

            // --- 제4방 [순사 취조실] ---
            {
                id: "puzzle4", room: 4, type: "puzzle",
                name: "푸른 철제 압수품 금고",
                x: 262, y: 422, w: 52, h: 72,
                markerX: 288, markerY: 450, // 우상단 파란 철제 수조/금고
                solved: false
            },
            {
                id: "clue4", room: 4, type: "clue",
                name: "바닥 나무 문서 상자 (단서)",
                x: 196, y: 522, w: 42, h: 42,
                markerX: 217, markerY: 538 // 방 가운데 나무 상자
            },

            // --- 제5방 [사진 현상 암실] ---
            {
                id: "puzzle5", room: 5, type: "puzzle",
                name: "다다미 중앙 방언 필름 궤짝",
                x: 490, y: 542, w: 38, h: 42,
                markerX: 509, markerY: 558, // 다다미 중앙 궤짝
                solved: false
            },
            {
                id: "clue5", room: 5, type: "clue",
                name: "암실 3단 서랍장 (단서)",
                x: 582, y: 422, w: 58, h: 78,
                markerX: 611, markerY: 455 // 우상단 3단 서랍장
            },

            // --- 제6방 [지하 비밀 금고] ---
            {
                id: "puzzle6", room: 6, type: "puzzle",
                name: "《조선말 큰사전》 최종 비밀 궤짝",
                x: 828, y: 542, w: 40, h: 42,
                markerX: 848, markerY: 558, // 제6방 다다미 중앙 최종 궤짝
                solved: false
            }
        ];

        // 순사 (경찰 AI - 새 맵 가구 배치를 피해 자연스럽게 순찰)
        this.officers = [
            // 순사 1: 중앙 복도 좌우 순찰
            {
                x: 120, y: 352,
                radius: 12,
                speed: 1.5,
                chaseSpeed: 2.7,
                dir: 0,
                facing: 'right',
                animFrame: 0,
                animTimer: 0,
                isMoving: true,
                patrolPoints: [
                    { x: 80, y: 352, pause: 40 },
                    { x: 500, y: 352, pause: 20 },
                    { x: 920, y: 352, pause: 50 },
                    { x: 500, y: 352, pause: 20 }
                ],
                currentPointIdx: 0,
                pauseTimer: 0,
                fovAngle: Math.PI * 0.42,
                fovDistance: 155,
                state: 'patrol',
                alertTimer: 0
            },
            // 순사 2: 제2방 [기록 서재] 다다미 순찰
            {
                x: 400, y: 250,
                radius: 12,
                speed: 1.25,
                chaseSpeed: 2.5,
                dir: 0,
                facing: 'right',
                animFrame: 0,
                animTimer: 0,
                isMoving: true,
                patrolPoints: [
                    { x: 395, y: 260, pause: 45 },
                    { x: 605, y: 260, pause: 45 },
                    { x: 605, y: 190, pause: 35 },
                    { x: 395, y: 190, pause: 35 }
                ],
                currentPointIdx: 0,
                pauseTimer: 0,
                fovAngle: Math.PI * 0.4,
                fovDistance: 135,
                state: 'patrol',
                alertTimer: 0
            },
            // 순사 3: 제4방 [순사 취조실] 순찰 (가운데 나무 상자 주변 순찰)
            {
                x: 110, y: 595,
                radius: 12,
                speed: 1.25,
                chaseSpeed: 2.5,
                dir: 0,
                facing: 'right',
                animFrame: 0,
                animTimer: 0,
                isMoving: true,
                patrolPoints: [
                    { x: 105, y: 600, pause: 40 },
                    { x: 275, y: 600, pause: 35 },
                    { x: 275, y: 505, pause: 40 },
                    { x: 105, y: 505, pause: 35 }
                ],
                currentPointIdx: 0,
                pauseTimer: 0,
                fovAngle: Math.PI * 0.4,
                fovDistance: 135,
                state: 'patrol',
                alertTimer: 0
            }
        ];

        this.footstepTimer = 0;
        this.initEventListeners();
        this.showOpeningModal();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Shift') this.player.isRunning = true;

            if (window.soundEngine) window.soundEngine.init();

            if (e.key.toLowerCase() === 'e') {
                this.handleInteraction();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (e.key === 'Shift') this.player.isRunning = false;
        });

        document.getElementById('btn-sound-toggle').addEventListener('click', () => {
            const isMuted = window.soundEngine.toggleMute();
            document.getElementById('btn-sound-toggle').innerText = isMuted ? '🔇 소리 켜기' : '🔊 소리 끄기';
        });

        document.getElementById('btn-guide').addEventListener('click', () => {
            this.showGuideModal();
        });

        document.getElementById('btn-caught-retry').addEventListener('click', () => {
            this.respawnPlayer();
        });

        // 모바일 & 태블릿 반응형 스케일링 및 가상 조이스틱 터치 이벤트 초기화
        this.initResponsiveScaling();
        this.initTouchControls();
    }

    initResponsiveScaling() {
        const resizeGame = () => {
            const container = document.getElementById('game-container');
            const targetW = 1000;
            const targetH = 700;

            const scaleX = window.innerWidth / targetW;
            const scaleY = window.innerHeight / targetH;
            const scale = Math.min(scaleX, scaleY, 1.25); // 최대 1.25배까지 확대

            this.scale = scale;
            container.style.transform = `scale(${scale})`;
        };

        window.addEventListener('resize', resizeGame);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeGame, 200);
        });
        resizeGame();
    }

    initTouchControls() {
        const joystickZone = document.getElementById('touch-joystick-zone');
        const knob = document.getElementById('joystick-knob');
        const maxRadius = 38; // 조이스틱 노브 최대 이동 반경
        let touchId = null;
        let startX = 0;
        let startY = 0;

        const handleStart = (e) => {
            e.preventDefault();
            if (touchId !== null) return;
            const touch = e.changedTouches[0];
            touchId = touch.identifier;

            const rect = joystickZone.getBoundingClientRect();
            // 조이스틱 베이스 중심 좌표
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;

            handleMove(e);
        };

        const handleMove = (e) => {
            if (touchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === touchId) {
                    e.preventDefault();
                    let rawDx = touch.clientX - startX;
                    let rawDy = touch.clientY - startY;
                    const dist = Math.hypot(rawDx, rawDy);

                    if (dist > maxRadius) {
                        rawDx = (rawDx / dist) * maxRadius;
                        rawDy = (rawDy / dist) * maxRadius;
                    }

                    knob.style.transform = `translate(${rawDx}px, ${rawDy}px)`;

                    // 정규화된 입력 벡터 (-1.0 ~ 1.0)
                    if (dist > 8) {
                        this.touchInput.active = true;
                        this.touchInput.dx = rawDx / maxRadius;
                        this.touchInput.dy = rawDy / maxRadius;
                    } else {
                        this.touchInput.active = false;
                        this.touchInput.dx = 0;
                        this.touchInput.dy = 0;
                    }
                    break;
                }
            }
        };

        const handleEnd = (e) => {
            if (touchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === touchId) {
                    e.preventDefault();
                    touchId = null;
                    knob.style.transform = `translate(0px, 0px)`;
                    this.touchInput.active = false;
                    this.touchInput.dx = 0;
                    this.touchInput.dy = 0;
                    break;
                }
            }
        };

        joystickZone.addEventListener('touchstart', handleStart, { passive: false });
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd, { passive: false });
        window.addEventListener('touchcancel', handleEnd, { passive: false });

        // 우측 터치 달리기 버튼
        const btnRun = document.getElementById('btn-touch-run');
        btnRun.addEventListener('click', (e) => {
            e.preventDefault();
            this.player.isRunning = !this.player.isRunning;
            btnRun.classList.toggle('active', this.player.isRunning);
            btnRun.querySelector('.touch-btn-label').innerText = this.player.isRunning ? '달리는중' : '달리기';
        });

        // 우측 터치 조사/은신 액션 버튼
        const btnAction = document.getElementById('btn-touch-action');
        btnAction.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleInteraction();
        });
    }

    // 점과 사각형 사이의 최단 거리 계산 (큰 가구 앞에서도 잘 작동하도록)
    distToRect(px, py, rect) {
        const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
        const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
        return Math.hypot(px - cx, py - cy);
    }

    handleInteraction() {
        // 모달이 열려 있을 때 E를 누르면 단서 모달인 경우 닫기 허용
        if (this.isPaused) return;

        // 이미 은신 중이면 나오기
        if (this.player.isHiding) {
            this.player.isHiding = false;
            if (this.player.savedX && this.player.savedY) {
                this.player.x = this.player.savedX;
                this.player.y = this.player.savedY;
            }
            this.player.currentHidingSpot = null;
            window.soundEngine.playHide();
            return;
        }

        // 0. 김구 선생님 NPC와 대화 확인 (최우선)
        const distToKimgu = Math.hypot(this.player.x - this.kimguNpc.x, this.player.y - this.kimguNpc.y);
        if (distToKimgu < 42) {
            window.soundEngine.playPaper();
            this.openNpcModal();
            return;
        }

        // 1. 주변 퍼즐 / 단서 오브젝트 확인 (우선순위 높음)
        for (const item of this.interactables) {
            const dist = this.distToRect(this.player.x, this.player.y, item);
            if (dist < 36) {
                window.soundEngine.playInteract();
                if (item.type === 'clue') {
                    this.openClueModal(item);
                } else {
                    this.openPuzzleModal(item);
                }
                return;
            }
        }

        // 2. 주변 은신처 확인
        for (const spot of this.hidingSpots) {
            const dist = this.distToRect(this.player.x, this.player.y, spot);
            if (dist < 36) {
                this.player.isHiding = true;
                this.player.savedX = this.player.x;
                this.player.savedY = this.player.y;
                this.player.currentHidingSpot = spot;
                this.player.x = spot.hideX || (spot.x + spot.w / 2);
                this.player.y = spot.hideY || (spot.y + spot.h / 2);
                window.soundEngine.playHide();
                return;
            }
        }

        // 3. 주변 잠긴 문 확인
        for (const door of this.doors) {
            const dist = this.distToRect(this.player.x, this.player.y, door);
            if (dist < 38 && !door.isOpen) {
                if (this.inventory.has(door.requiredItem)) {
                    door.isOpen = true;
                    window.soundEngine.playUnlock();
                    this.showNotification(`🔑 [${door.requiredItem}]으로 문을 열었습니다!`);
                } else {
                    this.showNotification(`🔒 잠겨 있습니다. [${door.requiredItem}]이(가) 필요합니다.`);
                }
                return;
            }
        }
    }

    respawnPlayer() {
        document.getElementById('caught-overlay').style.display = 'none';
        this.isPaused = false;
        this.isCaught = false;

        this.player.x = 95;
        this.player.y = 230;
        this.player.isHiding = false;

        this.officers.forEach(officer => {
            officer.state = 'patrol';
            officer.alertTimer = 0;
            officer.x = officer.patrolPoints[0].x;
            officer.y = officer.patrolPoints[0].y;
            officer.currentPointIdx = 0;
            officer.pauseTimer = 0;
            officer.animFrame = 0;
            officer.animTimer = 0;
            officer.isMoving = true;
            officer.facing = 'right';
        });

        this.updateAlertIndicator('safe');
    }

    loop() {
        this.tickCount++;
        if (!this.isPaused && !this.isGameOver) {
            this.update();
        }
        this.render();
        requestAnimationFrame(this.loop);
    }

    update() {
        this.updatePlayer();
        this.updateOfficers();
        this.checkInteractionsRange();
        this.updateRipples();
    }

    updatePlayer() {
        if (this.player.isHiding) {
            this.player.isMoving = false;
            return;
        }

        let dx = 0;
        let dy = 0;

        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        // 모바일 & 태블릿 가상 조이스틱 터치 입력 반영
        if (this.touchInput && this.touchInput.active) {
            dx += this.touchInput.dx;
            dy += this.touchInput.dy;
        }

        if (dx !== 0 || dy !== 0) {
            this.player.isMoving = true;
            const length = Math.hypot(dx, dy);
            dx /= length;
            dy /= length;

            this.player.direction = Math.atan2(dy, dx);

            if (Math.abs(dy) >= Math.abs(dx)) {
                this.player.facing = dy > 0 ? 'down' : 'up';
            } else {
                this.player.facing = dx > 0 ? 'right' : 'left';
            }

            this.player.animTimer += this.player.isRunning ? 2 : 1;
            if (this.player.animTimer >= 6) {
                this.player.animTimer = 0;
                this.player.animFrame = (this.player.animFrame + 1) % 8;
            }

            const speed = this.player.isRunning ? this.player.runSpeed : this.player.speed;
            const nextX = this.player.x + dx * speed;
            const nextY = this.player.y + dy * speed;

            if (!this.checkCollision(nextX, this.player.y, this.player.radius)) {
                this.player.x = nextX;
            }
            if (!this.checkCollision(this.player.x, nextY, this.player.radius)) {
                this.player.y = nextY;
            }

            this.footstepTimer++;
            const stepInterval = this.player.isRunning ? 12 : 22;
            if (this.footstepTimer >= stepInterval) {
                this.footstepTimer = 0;
                window.soundEngine.playFootstep(this.player.isRunning);

                if (this.player.isRunning) {
                    this.player.noiseRadius = 140;
                    this.player.noiseRipples.push({
                        x: this.player.x,
                        y: this.player.y,
                        radius: 5,
                        maxRadius: 130,
                        alpha: 0.7
                    });
                } else {
                    this.player.noiseRadius = 25;
                }
            }
        } else {
            this.player.isMoving = false;
            this.player.animFrame = 0;
            this.player.animTimer = 0;
            this.player.noiseRadius = 0;
        }

        this.updateCurrentRoomHUD();
    }

    updateRipples() {
        for (let i = this.player.noiseRipples.length - 1; i >= 0; i--) {
            const rip = this.player.noiseRipples[i];
            rip.radius += 3.5;
            rip.alpha -= 0.025;
            if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
                this.player.noiseRipples.splice(i, 1);
            }
        }
    }

    updateOfficers() {
        let maxAlertState = 'safe';

        this.officers.forEach((officer, oIdx) => {
            let canSee = false;
            let canHear = false;

            if (!this.player.isHiding) {
                const distToPlayer = Math.hypot(this.player.x - officer.x, this.player.y - officer.y);

                if (this.player.noiseRadius > 0 && distToPlayer <= this.player.noiseRadius) {
                    canHear = true;
                }

                if (distToPlayer <= officer.fovDistance) {
                    const angleToPlayer = Math.atan2(this.player.y - officer.y, this.player.x - officer.x);
                    let angleDiff = Math.abs(this.normalizeAngle(angleToPlayer - officer.dir));
                    if (angleDiff <= officer.fovAngle / 2) {
                        if (!this.hasLineOfSightObstacle(officer.x, officer.y, this.player.x, this.player.y)) {
                            canSee = true;
                        }
                    }
                }

                if (distToPlayer <= officer.radius + this.player.radius + 6) {
                    canSee = true;
                }
            }

            // 플레이어가 은신했을 때: 추격 중이던 순사는 즉시 대상을 잃고 두리번거림(Searching)
            if (this.player.isHiding && officer.state === 'chase') {
                officer.state = 'searching';
                officer.searchTimer = 100; // 약 1.6초간 제자리 수색
                officer.isMoving = false;
            }

            // AI 상태 전이
            if (canSee) {
                if (officer.state !== 'chase') {
                    window.soundEngine.playWhistle();
                    window.soundEngine.playAlert();
                }
                officer.state = 'chase';
                officer.alertTimer = 150;
                maxAlertState = 'danger';
            } else if (canHear && officer.state !== 'chase' && officer.state !== 'searching') {
                officer.state = 'suspicious';
                officer.targetX = this.player.x;
                officer.targetY = this.player.y;
                if (maxAlertState !== 'danger') maxAlertState = 'warning';
            }

            // 1. 추격 상태 (Chase)
            if (officer.state === 'chase') {
                maxAlertState = 'danger';
                officer.isMoving = true;

                const cdx = this.player.x - officer.x;
                const cdy = this.player.y - officer.y;
                const angle = Math.atan2(cdy, cdx);
                officer.dir = angle;

                if (Math.abs(cdy) >= Math.abs(cdx)) {
                    officer.facing = cdy > 0 ? 'down' : 'up';
                } else {
                    officer.facing = cdx > 0 ? 'right' : 'left';
                }

                const nextX = officer.x + Math.cos(angle) * officer.chaseSpeed;
                const nextY = officer.y + Math.sin(angle) * officer.chaseSpeed;

                let moved = false;
                if (!this.checkCollision(nextX, officer.y, officer.radius)) { officer.x = nextX; moved = true; }
                if (!this.checkCollision(officer.x, nextY, officer.radius)) { officer.y = nextY; moved = true; }

                // 벽에 가로막히면 슬라이딩
                if (!moved) {
                    this.trySlideOfficer(officer, angle, officer.chaseSpeed);
                }

                const catchDist = Math.hypot(this.player.x - officer.x, this.player.y - officer.y);
                if (catchDist <= officer.radius + this.player.radius && !this.player.isHiding) {
                    this.triggerCaught();
                }

                officer.alertTimer--;
                if (officer.alertTimer <= 0 && !canSee) {
                    officer.state = 'searching';
                    officer.searchTimer = 80;
                    officer.isMoving = false;
                }
            }
            // 2. 수색/의아 상태 (Searching - 놓쳤을 때 두리번거리기)
            else if (officer.state === 'searching') {
                officer.isMoving = false;
                officer.searchTimer--;
                maxAlertState = 'warning';

                // 두리번거리며 좌우 바라보기
                if (officer.searchTimer % 30 === 0) {
                    const dirs = ['left', 'right', 'down', 'up'];
                    officer.facing = dirs[Math.floor(Math.random() * dirs.length)];
                }

                if (officer.searchTimer <= 0) {
                    officer.state = 'patrol';
                    // 가장 안전한 순찰 복귀 웨이포인트 찾기
                    this.assignReturnWaypoint(officer, oIdx);
                }
            }
            // 3. 의심 상태 (Suspicious - 소리 듣고 조사)
            else if (officer.state === 'suspicious') {
                const sdx = officer.targetX - officer.x;
                const sdy = officer.targetY - officer.y;
                const distToTarget = Math.hypot(sdx, sdy);

                if (distToTarget > 12) {
                    officer.isMoving = true;
                    const angle = Math.atan2(sdy, sdx);
                    officer.dir = angle;

                    if (Math.abs(sdy) >= Math.abs(sdx)) {
                        officer.facing = sdy > 0 ? 'down' : 'up';
                    } else {
                        officer.facing = sdx > 0 ? 'right' : 'left';
                    }

                    const nextX = officer.x + Math.cos(angle) * officer.speed;
                    const nextY = officer.y + Math.sin(angle) * officer.speed;
                    let moved = false;
                    if (!this.checkCollision(nextX, officer.y, officer.radius)) { officer.x = nextX; moved = true; }
                    if (!this.checkCollision(officer.x, nextY, officer.radius)) { officer.y = nextY; moved = true; }
                    if (!moved) this.trySlideOfficer(officer, angle, officer.speed);
                } else {
                    officer.isMoving = false;
                    officer.pauseTimer++;
                    if (officer.pauseTimer > 70) {
                        officer.state = 'patrol';
                        officer.pauseTimer = 0;
                        this.assignReturnWaypoint(officer, oIdx);
                    }
                }
            }
            // 4. 일반 순찰 상태 (Patrol)
            else {
                let targetPoint = officer.tempReturnPoint || officer.patrolPoints[officer.currentPointIdx];
                let pdx = targetPoint.x - officer.x;
                let pdy = targetPoint.y - officer.y;
                let distToPoint = Math.hypot(pdx, pdy);

                if (distToPoint < 10) {
                    if (officer.tempReturnPoint) {
                        // 복귀 중간 지점 도달 완료
                        officer.tempReturnPoint = null;
                        this.assignNearestPatrolIndex(officer);
                    } else {
                        officer.isMoving = false;
                        officer.pauseTimer++;
                        if (officer.pauseTimer >= targetPoint.pause) {
                            officer.pauseTimer = 0;
                            officer.currentPointIdx = (officer.currentPointIdx + 1) % officer.patrolPoints.length;
                        }
                    }
                } else {
                    officer.isMoving = true;
                    const angle = Math.atan2(pdy, pdx);
                    officer.dir = angle;

                    if (Math.abs(pdy) >= Math.abs(pdx)) {
                        officer.facing = pdy > 0 ? 'down' : 'up';
                    } else {
                        officer.facing = pdx > 0 ? 'right' : 'left';
                    }

                    const nextX = officer.x + Math.cos(angle) * officer.speed;
                    const nextY = officer.y + Math.sin(angle) * officer.speed;

                    let movedX = false;
                    let movedY = false;
                    if (!this.checkCollision(nextX, officer.y, officer.radius)) { officer.x = nextX; movedX = true; }
                    if (!this.checkCollision(officer.x, nextY, officer.radius)) { officer.y = nextY; movedY = true; }

                    // 벽에 막혀 전혀 움직이지 못하는 경우 (벽 끼임 방지)
                    if (!movedX && !movedY) {
                        officer.stuckTimer = (officer.stuckTimer || 0) + 1;
                        this.trySlideOfficer(officer, angle, officer.speed);

                        // 25프레임 이상 벽에 끼어 있으면 복도/문으로 강제 안내
                        if (officer.stuckTimer > 25) {
                            officer.stuckTimer = 0;
                            this.assignReturnWaypoint(officer, oIdx);
                        }
                    } else {
                        officer.stuckTimer = 0;
                    }
                }
            }

            // 순사 걷기 애니메이션 업데이트
            if (officer.isMoving) {
                officer.animTimer += (officer.state === 'chase' ? 2 : 1);
                if (officer.animTimer >= 6) {
                    officer.animTimer = 0;
                    officer.animFrame = (officer.animFrame + 1) % 8;
                }
            } else {
                officer.animFrame = 0;
                officer.animTimer = 0;
            }
        });

        this.updateAlertIndicator(maxAlertState);
    }

    // 벽 슬라이딩 (직선이 막혔을 때 빗겨서 미끄러지기)
    trySlideOfficer(officer, angle, speed) {
        // 수직 또는 수평으로 비껴가기
        const perp1 = angle + Math.PI / 2;
        const perp2 = angle - Math.PI / 2;

        const x1 = officer.x + Math.cos(perp1) * speed * 0.8;
        const y1 = officer.y + Math.sin(perp1) * speed * 0.8;
        if (!this.checkCollision(x1, y1, officer.radius)) {
            officer.x = x1;
            officer.y = y1;
            return;
        }

        const x2 = officer.x + Math.cos(perp2) * speed * 0.8;
        const y2 = officer.y + Math.sin(perp2) * speed * 0.8;
        if (!this.checkCollision(x2, y2, officer.radius)) {
            officer.x = x2;
            officer.y = y2;
            return;
        }
    }

    // 방 안에 들어갔던 순사가 복도나 제자리로 안전하게 빠져나오도록 문 경유 웨이포인트 지정
    assignReturnWaypoint(officer, oIdx) {
        // 순사 1: 복도 순찰자 (y: 310~390이 복도)
        if (oIdx === 0) {
            if (officer.y < 305) {
                // 상단 방에 있는 경우 -> 가장 가까운 열린 문 입구로 안내
                const openDoors = this.doors.filter(d => d.isOpen && d.y <= 310);
                if (openDoors.length > 0) {
                    const nearestDoor = openDoors.reduce((prev, curr) => {
                        const dPrev = Math.hypot(officer.x - (prev.x + prev.w/2), officer.y - prev.y);
                        const dCurr = Math.hypot(officer.x - (curr.x + curr.w/2), officer.y - curr.y);
                        return dCurr < dPrev ? curr : prev;
                    });
                    officer.tempReturnPoint = { x: nearestDoor.x + nearestDoor.w / 2, y: 352 };
                    return;
                }
            } else if (officer.y > 395) {
                // 하단 방에 있는 경우
                const openDoors = this.doors.filter(d => d.isOpen && d.y >= 390);
                if (openDoors.length > 0) {
                    const nearestDoor = openDoors.reduce((prev, curr) => {
                        const dPrev = Math.hypot(officer.x - (prev.x + prev.w/2), officer.y - prev.y);
                        const dCurr = Math.hypot(officer.x - (curr.x + curr.w/2), officer.y - curr.y);
                        return dCurr < dPrev ? curr : prev;
                    });
                    officer.tempReturnPoint = { x: nearestDoor.x + nearestDoor.w / 2, y: 352 };
                    return;
                }
            }
        }

        // 제자리 복귀 또는 가장 가까운 순찰 포인트 지정
        officer.tempReturnPoint = null;
        this.assignNearestPatrolIndex(officer);
    }

    assignNearestPatrolIndex(officer) {
        let bestIdx = 0;
        let minDist = 999999;
        officer.patrolPoints.forEach((pt, idx) => {
            const dist = Math.hypot(officer.x - pt.x, officer.y - pt.y);
            if (dist < minDist) {
                minDist = dist;
                bestIdx = idx;
            }
        });
        officer.currentPointIdx = bestIdx;
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    hasLineOfSightObstacle(x1, y1, x2, y2) {
        for (const wall of this.walls) {
            if (!wall.isFurniture && this.lineIntersectsRect(x1, y1, x2, y2, wall)) return true;
        }
        for (const door of this.doors) {
            if (!door.isOpen && this.lineIntersectsRect(x1, y1, x2, y2, door)) return true;
        }
        return false;
    }

    lineIntersectsRect(x1, y1, x2, y2, rect) {
        const left = rect.x, right = rect.x + rect.w, top = rect.y, bottom = rect.y + rect.h;
        return this.lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||
               this.lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom) ||
               this.lineIntersectsLine(x1, y1, x2, y2, right, bottom, left, bottom) ||
               this.lineIntersectsLine(x1, y1, x2, y2, left, bottom, left, top);
    }

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return false;
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    checkCollision(x, y, radius) {
        // 김구 선생님 NPC 충돌
        const distK = Math.hypot(x - this.kimguNpc.x, y - this.kimguNpc.y);
        if (distK < radius + this.kimguNpc.radius) return true;

        for (const w of this.walls) {
            if (this.circleIntersectsRect(x, y, radius, w)) return true;
        }
        for (const d of this.doors) {
            if (!d.isOpen && this.circleIntersectsRect(x, y, radius, d)) return true;
        }
        return false;
    }

    circleIntersectsRect(cx, cy, cr, rect) {
        const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
        const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
        const dist = Math.hypot(cx - closestX, cy - closestY);
        return dist < cr;
    }

    checkInteractionsRange() {
        const hintEl = document.getElementById('interaction-hint');
        const touchActionBtn = document.getElementById('btn-touch-action');
        const touchIcon = touchActionBtn ? touchActionBtn.querySelector('.touch-btn-icon') : null;
        const touchLabel = touchActionBtn ? touchActionBtn.querySelector('.touch-btn-label') : null;

        const updateTouchBtn = (highlight, icon, label) => {
            if (!touchActionBtn) return;
            touchActionBtn.classList.toggle('highlight', highlight);
            if (icon && touchIcon) touchIcon.innerText = icon;
            if (label && touchLabel) touchLabel.innerText = label;
        };

        if (this.player.isHiding) {
            hintEl.innerText = `🛡️ [${this.player.currentHidingSpot.type}] 은신 중 — 터치하여 나오기`;
            hintEl.style.display = 'block';
            updateTouchBtn(true, '🚪', '나오기');
            return;
        }

        // 0. 김구 선생님 NPC
        const distToKimgu = Math.hypot(this.player.x - this.kimguNpc.x, this.player.y - this.kimguNpc.y);
        if (distToKimgu < 42) {
            hintEl.innerText = `💬 백범 김구 선생과 대화하기`;
            hintEl.style.display = 'block';
            updateTouchBtn(true, '💬', '대화하기');
            return;
        }

        // 1. 퍼즐 / 단서 조사물
        for (const item of this.interactables) {
            const dist = this.distToRect(this.player.x, this.player.y, item);
            if (dist < 36) {
                if (item.type === 'clue') {
                    hintEl.innerText = `📜 ${item.name} 살펴보기`;
                    updateTouchBtn(true, '📜', '단서보기');
                } else {
                    hintEl.innerText = item.solved ? `✓ ${item.name} (해독 완료)` : `🔍 ${item.name} 암호 풀기`;
                    updateTouchBtn(true, '🔍', item.solved ? '확인' : '암호풀기');
                }
                hintEl.style.display = 'block';
                return;
            }
        }

        // 2. 은신처
        for (const spot of this.hidingSpots) {
            const dist = this.distToRect(this.player.x, this.player.y, spot);
            if (dist < 36) {
                hintEl.innerText = `🛡️ ${spot.type}에 몸 숨기기`;
                hintEl.style.display = 'block';
                updateTouchBtn(true, '🛡️', '숨기');
                return;
            }
        }

        // 3. 잠긴 문
        for (const door of this.doors) {
            const dist = this.distToRect(this.player.x, this.player.y, door);
            if (dist < 38 && !door.isOpen) {
                const hasKey = this.inventory.has(door.requiredItem);
                hintEl.innerText = hasKey
                    ? `🔑 ${door.requiredItem}로 문 열기`
                    : `🔒 잠긴 문 (${door.requiredItem} 필요)`;
                hintEl.style.display = 'block';
                updateTouchBtn(hasKey, hasKey ? '🔑' : '🔒', hasKey ? '문열기' : '잠김');
                return;
            }
        }

        hintEl.style.display = 'none';
        updateTouchBtn(false, '🔍', '조사/은신');
    }

    triggerCaught() {
        if (this.isCaught) return;
        this.isCaught = true;
        this.isPaused = true;
        window.soundEngine.playAlert();
        document.getElementById('caught-overlay').style.display = 'flex';
    }

    updateAlertIndicator(state) {
        if (window.soundEngine) {
            window.soundEngine.setAmbientTension(state);
        }

        const el = document.getElementById('alert-status');
        el.className = 'alert-indicator';
        if (state === 'danger') {
            el.classList.add('alert-danger');
            el.innerText = '🚨 발각!';
        } else if (state === 'warning') {
            el.classList.add('alert-warning');
            el.innerText = '⚠️ 순사 의심';
        } else {
            el.classList.add('alert-safe');
            el.innerText = '🛡️ 안전';
        }
    }

    updateCurrentRoomHUD() {
        let currentRoom = "중앙 연결 복도";
        for (const r of this.rooms) {
            if (this.player.x >= r.bounds.x && this.player.x <= r.bounds.x + r.bounds.w &&
                this.player.y >= r.bounds.y && this.player.y <= r.bounds.y + r.bounds.h) {
                currentRoom = r.name;
                break;
            }
        }
        document.getElementById('hud-room-name').innerText = currentRoom;
        document.getElementById('hud-manuscript-count').innerText = `${this.collectedManuscripts.size}/5권`;
    }

    showNotification(msg) {
        const hintEl = document.getElementById('interaction-hint');
        hintEl.innerText = msg;
        hintEl.style.display = 'block';
        setTimeout(() => {
            hintEl.style.display = 'none';
        }, 2200);
    }

    // ------------------------------------------------------------------------
    // 렌더링 (새 픽셀아트 맵 배경 + 가구 위 은은한 조사 마커)
    // ------------------------------------------------------------------------
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. 고퀄리티 픽셀아트 맵 배경 렌더링
        if (this.mapBg.complete && this.mapBg.naturalWidth > 0) {
            this.ctx.drawImage(this.mapBg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#1e1a16';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. 문 개방/잠금 상태 표시
        this.renderDoors();

        // 3. 은신처 하이라이트 (근처에 갔을 때 또는 은은한 표시)
        this.renderHidingSpots();

        // 4. 단서 및 퍼즐 조사 마커 (가구 위 플로팅 아이콘)
        this.renderInteractables();

        // 5. 달리기 소음 파동 (Ripples)
        this.renderNoiseRipples();

        // 6. 김구 선생님 NPC 렌더링
        this.renderNpc();

        // 7. 순사 시야각(Vision Cone) 및 순사 캐릭터
        this.renderOfficers();

        // 8. 주인공 플레이어 캐릭터
        this.renderPlayer();

        // 8. 분위기 조명 비네팅 오버레이
        this.renderLightingOverlay();
    }

    renderDoors() {
        this.doors.forEach(d => {
            if (d.isOpen) {
                // 열린 문은 맵의 자물쇠 그림을 덮고 열린 통로(초록빛 매트)로 표시
                this.ctx.fillStyle = '#2b4c32';
                this.ctx.fillRect(d.x, d.y, d.w, d.h);
                this.ctx.strokeStyle = '#52b788';
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeRect(d.x, d.y, d.w, d.h);
            } else {
                // 닫힌 문: 열쇠를 보유 중이면 황금빛 테두리 점멸로 안내
                if (this.inventory.has(d.requiredItem)) {
                    const pulse = 0.4 + Math.sin(this.tickCount * 0.1) * 0.3;
                    this.ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(d.x - 1, d.y - 1, d.w + 2, d.h + 2);
                }
            }
        });
    }

    renderHidingSpots() {
        this.hidingSpots.forEach(s => {
            const dist = this.distToRect(this.player.x, this.player.y, s);
            const isNear = dist < 42;

            // 플레이어가 근처에 오면 은신 가능 가구 테두리 하이라이트
            if (isNear) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(149, 213, 178, 0.85)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([4, 3]);
                this.ctx.strokeRect(s.x, s.y, s.w, s.h);
                this.ctx.restore();
            }

            // 가구 상단에 아주 작고 깔끔한 은신 아이콘 배지 표시
            const bx = s.x + s.w / 2;
            const by = s.y + 12;
            this.ctx.save();
            this.ctx.fillStyle = isNear ? 'rgba(27, 67, 50, 0.9)' : 'rgba(20, 18, 15, 0.65)';
            this.ctx.strokeStyle = isNear ? '#74c69d' : 'rgba(180, 160, 130, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.roundRect(bx - 24, by - 8, 48, 15, 4);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = isNear ? '#d8f3dc' : '#b7a99a';
            this.ctx.font = '10px "Noto Serif KR", serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🛡️은신', bx, by + 3);
            this.ctx.restore();
        });
    }

    renderInteractables() {
        const floatOffset = Math.sin(this.tickCount * 0.08) * 3;

        this.interactables.forEach(item => {
            const dist = this.distToRect(this.player.x, this.player.y, item);
            const isNear = dist < 40;
            const mx = item.markerX || (item.x + item.w / 2);
            const my = (item.markerY || (item.y + item.h / 2)) + floatOffset;

            // 근처에 오면 가구 외곽선 하이라이트
            if (isNear) {
                this.ctx.save();
                this.ctx.strokeStyle = item.type === 'clue' ? 'rgba(144, 224, 239, 0.85)' : 'rgba(255, 209, 102, 0.9)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(item.x, item.y, item.w, item.h);
                this.ctx.restore();
            }

            // 플로팅 마커 원형 배지
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(mx, my, 11, 0, Math.PI * 2);

            if (item.type === 'clue') {
                this.ctx.fillStyle = 'rgba(24, 58, 74, 0.9)';
                this.ctx.strokeStyle = '#90e0ef';
            } else if (item.solved) {
                this.ctx.fillStyle = 'rgba(27, 67, 50, 0.9)';
                this.ctx.strokeStyle = '#52b788';
            } else {
                this.ctx.fillStyle = 'rgba(92, 60, 16, 0.92)';
                this.ctx.strokeStyle = '#ffd166';
            }

            this.ctx.lineWidth = 1.8;
            this.ctx.fill();
            this.ctx.stroke();

            // 마커 심볼
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 11px sans-serif';
            this.ctx.textAlign = 'center';
            const symbol = item.type === 'clue' ? '📜' : (item.solved ? '✓' : '?');
            this.ctx.fillText(symbol, mx, my + 4);
            this.ctx.restore();
        });
    }

    renderNpc() {
        const npc = this.kimguNpc;
        const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
        const isNear = dist < 45;

        // 발밑 그림자
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(npc.x, npc.y + 4, 13, 5.5, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fill();
        this.ctx.restore();

        // 스프라이트 렌더링
        if (this.kimguSprite.complete && this.kimguSprite.naturalWidth > 0) {
            const fw = 128;
            const fh = 191.25;
            const sx = npc.frame * fw; // Col 1 (지팡이를 짚은 의젓한 정면 모습)
            const sy = 0;              // Row 0

            const rw = npc.renderWidth;
            const rh = npc.renderHeight;
            const dx = npc.x - rw / 2;
            const dy = npc.y - rh + 8;

            this.ctx.drawImage(
                this.kimguSprite,
                sx, sy, fw, fh,
                dx, dy, rw, rh
            );
        }

        // 머리 위 NPC 말풍선 배지
        const floatY = Math.sin(this.tickCount * 0.08) * 3;
        const badgeY = npc.y - 56 + floatY;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(npc.x - 38, badgeY, 76, 20, 5);
        this.ctx.fillStyle = isNear ? 'rgba(45, 30, 15, 0.95)' : 'rgba(25, 18, 12, 0.85)';
        this.ctx.fill();
        this.ctx.strokeStyle = isNear ? '#ffd166' : '#b28247';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.fillStyle = isNear ? '#fff' : '#f5e6ca';
        this.ctx.font = 'bold 11px "Song Myung", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💬 백범 김구', npc.x, badgeY + 14);
        this.ctx.restore();
    }

    renderNoiseRipples() {
        this.player.noiseRipples.forEach(rip => {
            this.ctx.beginPath();
            this.ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(240, 200, 120, ${rip.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    renderOfficers() {
        this.officers.forEach(officer => {
            if (officer.state === 'patrol') {
                if (officer.facing === 'down') officer.dir = Math.PI / 2;
                else if (officer.facing === 'up') officer.dir = -Math.PI / 2;
                else if (officer.facing === 'right') officer.dir = 0;
                else if (officer.facing === 'left') officer.dir = Math.PI;
            }

            this.drawVisionCone(officer);

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.ellipse(officer.x, officer.y + 4, 12, 5, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this.ctx.fill();
            this.ctx.restore();

            if (this.officerSprite.complete && this.officerSprite.naturalWidth > 0) {
                let row = 0;
                if (officer.facing === 'down') row = 0;
                else if (officer.facing === 'up') row = 1;
                else if (officer.facing === 'right') row = 2;
                else if (officer.facing === 'left') row = 3;

                const col = officer.isMoving ? officer.animFrame : 0;
                const fw = this.officerSpriteConfig.frameWidth;
                const fh = this.officerSpriteConfig.frameHeight;
                const sx = col * fw;
                const sy = row * fh;

                const rw = this.officerSpriteConfig.renderWidth;
                const rh = this.officerSpriteConfig.renderHeight;
                const dx = officer.x - rw / 2;
                const dy = officer.y - rh + 8;

                this.ctx.drawImage(
                    this.officerSprite,
                    sx, sy, fw, fh,
                    dx, dy, rw, rh
                );
            }

            if (officer.state === 'chase') {
                this.ctx.fillStyle = '#ff3838';
                this.ctx.font = 'bold 20px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('!', officer.x, officer.y - 46);
            } else if (officer.state === 'suspicious' || officer.state === 'searching') {
                this.ctx.fillStyle = '#ff9f1a';
                this.ctx.font = 'bold 18px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('?', officer.x, officer.y - 46);
            }
        });
    }

    drawVisionCone(officer) {
        const originY = officer.y - 12;
        const startAngle = officer.dir - officer.fovAngle / 2;
        const endAngle = officer.dir + officer.fovAngle / 2;
        const rayCount = 36;
        const points = [{ x: officer.x, y: originY }];

        for (let i = 0; i <= rayCount; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / rayCount);
            const targetX = officer.x + Math.cos(angle) * officer.fovDistance;
            const targetY = originY + Math.sin(angle) * officer.fovDistance;

            const hitPoint = this.getRayIntersection(officer.x, originY, targetX, targetY);
            points.push(hitPoint);
        }

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();

        const grad = this.ctx.createRadialGradient(
            officer.x, originY, 10,
            officer.x, originY, officer.fovDistance
        );

        if (officer.state === 'chase') {
            grad.addColorStop(0, 'rgba(235, 47, 47, 0.48)');
            grad.addColorStop(1, 'rgba(235, 47, 47, 0.05)');
        } else {
            grad.addColorStop(0, 'rgba(255, 230, 110, 0.35)');
            grad.addColorStop(1, 'rgba(255, 230, 110, 0.02)');
        }

        this.ctx.fillStyle = grad;
        this.ctx.fill();
    }

    getRayIntersection(x1, y1, x2, y2) {
        let closestDist = 1;
        let hitX = x2;
        let hitY = y2;

        const checkIntersect = (wall) => {
            if (wall.isFurniture) return; // 낮은 책상 너머는 시야가 통과됨
            const left = wall.x, right = wall.x + wall.w, top = wall.y, bottom = wall.y + wall.h;
            const lines = [
                { x3: left, y3: top, x4: right, y4: top },
                { x3: right, y3: top, x4: right, y4: bottom },
                { x3: right, y3: bottom, x4: left, y4: bottom },
                { x3: left, y3: bottom, x4: left, y4: top }
            ];

            lines.forEach(l => {
                const denom = (l.y4 - l.y3) * (x2 - x1) - (l.x4 - l.x3) * (y2 - y1);
                if (denom === 0) return;
                const ua = ((l.x4 - l.x3) * (y1 - l.y3) - (l.y4 - l.y3) * (x1 - l.x3)) / denom;
                const ub = ((x2 - x1) * (y1 - l.y3) - (y2 - y1) * (x1 - l.x3)) / denom;
                if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
                    if (ua < closestDist) {
                        closestDist = ua;
                        hitX = x1 + ua * (x2 - x1);
                        hitY = y1 + ua * (y2 - y1);
                    }
                }
            });
        };

        this.walls.forEach(checkIntersect);
        this.doors.forEach(d => {
            if (!d.isOpen) checkIntersect(d);
        });

        return { x: hitX, y: hitY };
    }

    renderPlayer() {
        if (this.player.isHiding) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(27, 67, 50, 0.9)';
            this.ctx.strokeStyle = '#74c69d';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.roundRect(this.player.x - 36, this.player.y - 28, 72, 22, 6);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = '#d8f3dc';
            this.ctx.font = 'bold 11px "Noto Serif KR", serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🛡️ 은신 중', this.player.x, this.player.y - 13);
            this.ctx.restore();
            return;
        }

        // 발밑 그림자
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x, this.player.y + 4, 12, 5, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fill();
        this.ctx.restore();

        if (this.playerSprite.complete && this.playerSprite.naturalWidth > 0) {
            let row = 0;
            let col = 0;

            if (this.player.facing === 'down') {
                row = 0;
                col = this.player.isMoving ? this.player.animFrame : 0;
            } else if (this.player.facing === 'up') {
                row = 1;
                col = this.player.isMoving ? this.player.animFrame : 0;
            } else if (this.player.facing === 'right') {
                row = 2;
                col = this.player.isMoving ? 2 + (this.player.animFrame % 6) : 2;
            } else if (this.player.facing === 'left') {
                row = 3;
                col = this.player.isMoving ? (this.player.animFrame % 8) : 0;
            }

            const fw = this.spriteConfig.frameWidth;
            const fh = this.spriteConfig.frameHeight;
            const sx = col * fw;
            const sy = row * fh;

            const rw = this.spriteConfig.renderWidth;
            const rh = this.spriteConfig.renderHeight;
            const dx = this.player.x - rw / 2;
            const dy = this.player.y - rh + 8;

            this.ctx.drawImage(
                this.playerSprite,
                sx, sy, fw, fh,
                dx, dy, rw, rh
            );
        }
    }

    renderLightingOverlay() {
        const grad = this.ctx.createRadialGradient(
            this.player.x, this.player.y, 60,
            this.player.x, this.player.y, 550
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // ------------------------------------------------------------------------
    // 김구 선생님 NPC 모달창 제어
    // ------------------------------------------------------------------------
    openNpcModal() {
        this.isPaused = true;
        const modal = document.getElementById('npc-modal');
        const textEl = document.getElementById('npc-dialogue-text');
        const count = this.collectedManuscripts.size;

        let dialogueHtml = "";
        if (count === 0) {
            dialogueHtml = `
                "어서 오게, 동지! 일경들의 삼엄한 감시망을 뚫고 무사히 와주어 정말 든든하네.<br><br>
                조선어학회 회원들이 13년간 피땀 흘려 모아온 《조선말 큰사전》의 원고가 이 건물 곳곳에 압수되어 있네. <strong>말과 글은 곧 겨레의 얼이자 독립의 뿌리</strong>일세!<br><br>
                우선 이 방(제1방)의 <strong>중앙 책상 위 순찰 일지</strong>에서 왜경들의 맞춤법 오류를 찾아 서랍 암호를 풀고, <strong>[제1권 원고]</strong>와 <strong>[서재 열쇠]</strong>를 확보하게나.<br>
                <em style="color:#ffd166;">(책상 바로 옆 협탁의 파란 수첩에 큰 힌트가 적혀 있네.)</em>"
            `;
        } else if (count === 1) {
            dialogueHtml = `
                "장하네! 첫 번째 원고를 무사히 손에 넣었구먼.<br><br>
                이제 획득한 [서재 열쇠]로 옆방인 <strong>제2방 [기록 서재]</strong>의 문을 열 차례일세. 서재에는 우리가 지켜내야 할 아름다운 <strong>'순우리말 고유어'</strong> 낱말판이 숨겨져 있네.<br><br>
                복도를 건널 땐 순사의 손전등 시야(노란빛)를 조심하고, 뛰지 말고 살금살금 걷게나!<br>
                <em style="color:#ffd166;">(서재 우상단의 작은 목제함을 조사하면 고유어 뜻풀이 단서를 볼 수 있네.)</em>"
            `;
        } else if (count === 2) {
            dialogueHtml = `
                "벌써 두 번째 원고까지 되찾았군! 자네의 총명함에 선열들도 감복할 걸세.<br><br>
                다음은 복도 우측 끝의 <strong>제3방 [활판 인쇄실]</strong>일세. 세종대왕께서 창제하셨으나 안타깝게 사라진 <strong>'잃어버린 4글자'</strong>를 바닥 활자 상자에서 찾아내야 하네.<br><br>
                <em style="color:#ffd166;">(방 안 좌측 벽면의 조판 메모함에 소실된 4글자가 무엇인지 적혀 있을 걸세.)</em>"
            `;
        } else if (count === 3) {
            dialogueHtml = `
                "이제 절반을 넘었네! 하지만 아래층은 순사들의 경계가 한층 더 삼엄하니 각별히 조심하게.<br><br>
                아래층 좌측의 <strong>제4방 [순사 취조실]</strong>에서는 놈들이 강제로 퍼뜨린 <strong>'일제 잔재어'</strong>들을 바른 우리말로 순화해야 철제 금고가 열린다네.<br><br>
                <em style="color:#ffd166;">(방 한가운데 상자에 순화 대조표가 있으니 꼭 먼저 읽어보고 금고로 가게나.)</em>"
            `;
        } else if (count === 4) {
            dialogueHtml = `
                "장하네, 동지! 4권까지 되찾아 주었구먼.<br><br>
                이제 아래층 가운데의 <strong>제5방 [사진 현상 암실]</strong>일세. 전국 각지의 교사와 민중들이 엽서로 몰래 보내온 <strong>'팔도 토박이 방언'</strong>을 지도에 맞게 배치해야 하네.<br><br>
                <em style="color:#ffd166;">(우측 3단 서랍장에 도착한 방언 엽서철이 있으니 단서를 잘 살펴보게!)</em>"
            `;
        } else {
            dialogueHtml = `
                "모든 원고를 다 모았구먼! 자네가 기적을 만들어냈네!<br><br>
                이제 마지막 방인 <strong>제6방 [지하 비밀 금고]</strong>로 가게나. 모아온 5권의 원고를 제본대에 올리고 한힌샘 주시경 선생의 명언을 올바르게 맞추면, 마침내 지상으로 나가는 <strong>비밀 탈출 사다리</strong>가 가동될 걸세.<br><br>
                조국의 말과 글을 끝끝내 지켜낸 자네의 용기를 온 겨레가 영원히 기억할 걸세!"
            `;
        }

        textEl.innerHTML = dialogueHtml;
        modal.classList.add('active');
    }

    closeNpcModal() {
        document.getElementById('npc-modal').classList.remove('active');
        this.isPaused = false;
    }

    showStealthTip() {
        const textEl = document.getElementById('npc-dialogue-text');
        textEl.innerHTML = `
            <strong>[백범 김구 선생의 잠입 지침]</strong><br><br>
            1. <strong>발소리 주의</strong> : <code>Shift</code>를 눌러 달리면 발소리 파동이 생겨 근처 순사가 의심하고 다가오네. 복도를 건널 땐 뛰지 말고 조용히 걸어가게.<br><br>
            2. <strong>은신처 활용</strong> : 순사의 시야에 걸리더라도 각 방의 <strong>옷장, 벽장, 차광 커튼 뒤[E]</strong>에 몸을 숨기면 순사가 자네를 찾지 못하고 돌아갈 걸세.<br><br>
            3. <strong>단서 먼저 확인</strong> : 각 방마다 📜 표시가 된 보조 가구를 먼저 조사하면 암호의 결정적인 힌트를 바로 얻을 수 있네!
        `;
    }

    // ------------------------------------------------------------------------
    // 단서(Clue) 및 퍼즐(Puzzle) 모달창 제어
    // ------------------------------------------------------------------------
    openClueModal(item) {
        this.isPaused = true;
        window.soundEngine.playPaper();
        const modal = document.getElementById('puzzle-modal');
        const container = document.getElementById('puzzle-content');
        const feedback = document.getElementById('puzzle-feedback');
        feedback.style.display = 'none';

        const cData = CLUE_DATA[item.id];
        if (!cData) return;

        document.getElementById('puzzle-title').innerText = cData.title;
        document.getElementById('puzzle-desc').innerText = "가구를 수색하여 조선어학회 요원이 남겨둔 비밀 단서를 발견했습니다.";
        container.innerHTML = `<div style="background:#1c1712; padding:18px 22px; border:1px solid #5c4733; border-radius:4px;">${cData.content}</div>`;
        document.getElementById('btn-submit-puzzle').style.display = 'none';

        modal.classList.add('active');
    }

    openPuzzleModal(item) {
        this.isPaused = true;
        const modal = document.getElementById('puzzle-modal');
        const container = document.getElementById('puzzle-content');
        const feedback = document.getElementById('puzzle-feedback');
        feedback.style.display = 'none';

        const pData = PUZZLE_DATA[item.room ? `room${item.room}` : item.id];
        if (!pData) return;

        document.getElementById('puzzle-title').innerText = pData.title;
        document.getElementById('puzzle-desc').innerText = pData.desc;

        if (item.solved) {
            container.innerHTML = `
                <div style="text-align:center; padding: 25px 15px;">
                    <h3 style="color:#70e000; margin-bottom:12px; font-size:20px;">[이미 해독 완료된 단서입니다]</h3>
                    <p style="color:#d4a373; font-size:15px; margin-bottom:15px;">획득 원고: <strong>${pData.manuscriptName}</strong></p>
                    <p style="color:#bbb; font-size:13.5px; line-height:1.6;">${pData.explanation}</p>
                </div>
            `;
            document.getElementById('btn-submit-puzzle').style.display = 'none';
        } else {
            document.getElementById('btn-submit-puzzle').style.display = 'inline-block';
            this.buildPuzzleUI(pData, container);
        }

        modal.classList.add('active');
        this.activePuzzleItem = item;
        this.activePuzzleData = pData;
    }

    buildPuzzleUI(pData, container) {
        if (pData.id === 'room1') {
            let html = '';
            pData.questions.forEach((q, idx) => {
                html += `
                    <div class="quiz-item" data-qidx="${idx}">
                        <div class="quiz-q">${q.q}</div>
                        <div class="quiz-options">
                            ${q.options.map(opt => `
                                <button class="quiz-opt-btn" data-id="${opt.id}">${opt.text}</button>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

            container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const parent = e.target.closest('.quiz-options');
                    parent.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
                    e.target.classList.add('selected');
                });
            });
        }
        else if (pData.id === 'room2') {
            const words = [...pData.words].sort(() => Math.random() - 0.5);
            const meanings = [...pData.words].map(w => w.meaning).sort(() => Math.random() - 0.5);

            container.innerHTML = `
                <div class="match-container">
                    <div>
                        <div class="match-col-title">순우리말 고유어</div>
                        <div class="match-list" id="match-words">
                            ${words.map(w => `<div class="match-card word-card" data-word="${w.word}">${w.word}</div>`).join('')}
                        </div>
                    </div>
                    <div>
                        <div class="match-col-title">낱말의 뜻풀이</div>
                        <div class="match-list" id="match-meanings">
                            ${meanings.map(m => `<div class="match-card meaning-card" data-meaning="${m}">${m}</div>`).join('')}
                        </div>
                    </div>
                </div>
            `;

            let selectedWordEl = null;
            let selectedMeaningEl = null;
            this.matchedPairsCount = 0;

            const wordCards = container.querySelectorAll('.word-card');
            const meaningCards = container.querySelectorAll('.meaning-card');

            wordCards.forEach(wc => {
                wc.addEventListener('click', () => {
                    if (wc.classList.contains('matched')) return;
                    wordCards.forEach(c => c.classList.remove('selected'));
                    wc.classList.add('selected');
                    selectedWordEl = wc;
                    checkMatch();
                });
            });

            meaningCards.forEach(mc => {
                mc.addEventListener('click', () => {
                    if (mc.classList.contains('matched')) return;
                    meaningCards.forEach(c => c.classList.remove('selected'));
                    mc.classList.add('selected');
                    selectedMeaningEl = mc;
                    checkMatch();
                });
            });

            const checkMatch = () => {
                if (!selectedWordEl || !selectedMeaningEl) return;
                const word = selectedWordEl.dataset.word;
                const meaning = selectedMeaningEl.dataset.meaning;
                const targetObj = pData.words.find(w => w.word === word);

                if (targetObj && targetObj.meaning === meaning) {
                    selectedWordEl.classList.add('matched');
                    selectedMeaningEl.classList.add('matched');
                    selectedWordEl.classList.remove('selected');
                    selectedMeaningEl.classList.remove('selected');
                    selectedWordEl = null;
                    selectedMeaningEl = null;
                    this.matchedPairsCount++;
                    window.soundEngine.playInteract();
                } else {
                    selectedWordEl.classList.remove('selected');
                    selectedMeaningEl.classList.remove('selected');
                    selectedWordEl = null;
                    selectedMeaningEl = null;
                }
            };
        }
        else if (pData.id === 'room3') {
            container.innerHTML = `
                <p style="font-size:13.5px; color:#d4a373; margin-bottom:12px; text-align:center;">
                    사라진 '잃어버린 4글자'를 모두 선택하십시오. (선택: <span id="lost-char-count">0</span> / 4개)
                </p>
                <div class="char-grid">
                    ${pData.choices.map((c, i) => `
                        <div class="char-btn" data-idx="${i}">
                            <span class="char-glyph">${c.char}</span>
                            <span class="char-name">${c.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            container.querySelectorAll('.char-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('selected');
                    const selCount = container.querySelectorAll('.char-btn.selected').length;
                    document.getElementById('lost-char-count').innerText = selCount;
                });
            });
        }
        else if (pData.id === 'room4') {
            const goodOptions = pData.pairs.map(p => p.good).sort(() => Math.random() - 0.5);
            container.innerHTML = `
                <table class="jargon-table">
                    <thead>
                        <tr>
                            <th style="width:40%;">수사 조서의 왜색 표현</th>
                            <th style="width:60%;">바른 우리말 순화어 선택</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pData.pairs.map((pair) => `
                            <tr>
                                <td style="font-weight:bold; color:#ff9999;">${pair.bad}</td>
                                <td>
                                    <select class="jargon-select" data-bad="${pair.bad}">
                                        <option value="">-- 순화어 선택 --</option>
                                        ${goodOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        else if (pData.id === 'room5') {
            const words = pData.targets.map(t => t.word).sort(() => Math.random() - 0.5);
            container.innerHTML = `
                <div class="dialect-container">
                    ${pData.targets.map(t => `
                        <div class="dialect-row">
                            <div class="dialect-region">${t.region}</div>
                            <div class="dialect-hint">${t.hint}</div>
                            <select class="dialect-select" data-region="${t.region}">
                                <option value="">-- 토박이말 선택 --</option>
                                ${words.map(w => `<option value="${w}">${w}</option>`).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        else if (pData.id === 'room6') {
            this.currentQuoteOrder = [...pData.quoteSegments].sort(() => Math.random() - 0.5);
            this.renderQuoteSlots(container, pData);
        }
    }

    renderQuoteSlots(container, pData) {
        container.innerHTML = `
            <p style="font-size:13.5px; color:#d4a373; margin-bottom:12px; text-align:center;">
                [▲ / ▼] 버튼을 눌러 한힌샘 주시경 선생의 명언을 올바른 순서로 완성하십시오.
            </p>
            <div class="quote-sort-container">
                ${this.currentQuoteOrder.map((seg, idx) => `
                    <div class="quote-slot">
                        <span class="quote-num">0${idx + 1}</span>
                        <div class="quote-text">${seg.text}</div>
                        <div class="quote-btn-group">
                            <button class="btn-quote-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                            <button class="btn-quote-down" data-idx="${idx}" ${idx === this.currentQuoteOrder.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.btn-quote-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (idx > 0) {
                    const temp = this.currentQuoteOrder[idx];
                    this.currentQuoteOrder[idx] = this.currentQuoteOrder[idx - 1];
                    this.currentQuoteOrder[idx - 1] = temp;
                    this.renderQuoteSlots(container, pData);
                }
            });
        });

        container.querySelectorAll('.btn-quote-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                if (idx < this.currentQuoteOrder.length - 1) {
                    const temp = this.currentQuoteOrder[idx];
                    this.currentQuoteOrder[idx] = this.currentQuoteOrder[idx + 1];
                    this.currentQuoteOrder[idx + 1] = temp;
                    this.renderQuoteSlots(container, pData);
                }
            });
        });
    }

    submitPuzzle() {
        const pData = this.activePuzzleData;
        const feedback = document.getElementById('puzzle-feedback');
        let isCorrect = false;

        if (pData.id === 'room1') {
            const selectedBtns = document.querySelectorAll('#puzzle-content .quiz-opt-btn.selected');
            if (selectedBtns.length < 3) {
                feedback.className = 'puzzle-feedback feedback-fail';
                feedback.innerText = '모든 문항의 답을 선택해야 합니다.';
                feedback.style.display = 'block';
                return;
            }
            const enteredCode = Array.from(selectedBtns).map(b => b.dataset.id).join('');
            isCorrect = (enteredCode === pData.targetCode);
        }
        else if (pData.id === 'room2') {
            isCorrect = (this.matchedPairsCount === pData.words.length);
            if (!isCorrect) {
                feedback.className = 'puzzle-feedback feedback-fail';
                feedback.innerText = '모든 순우리말 고유어와 뜻풀이를 짝지어야 합니다.';
                feedback.style.display = 'block';
                return;
            }
        }
        else if (pData.id === 'room3') {
            const selectedBtns = document.querySelectorAll('#puzzle-content .char-btn.selected');
            if (selectedBtns.length !== 4) {
                feedback.className = 'puzzle-feedback feedback-fail';
                feedback.innerText = '정확히 4개의 소실 글자를 선택해야 합니다.';
                feedback.style.display = 'block';
                return;
            }
            isCorrect = Array.from(selectedBtns).every(b => {
                const idx = parseInt(b.dataset.idx);
                return pData.choices[idx].isLost4 === true;
            });
        }
        else if (pData.id === 'room4') {
            const selects = document.querySelectorAll('#puzzle-content .jargon-select');
            let allFilled = true;
            isCorrect = true;
            selects.forEach(sel => {
                if (!sel.value) allFilled = false;
                const bad = sel.dataset.bad;
                const targetObj = pData.pairs.find(p => p.bad === bad);
                if (!targetObj || targetObj.good !== sel.value) isCorrect = false;
            });
            if (!allFilled) {
                feedback.className = 'puzzle-feedback feedback-fail';
                feedback.innerText = '모든 표현의 순화어를 선택해 주십시오.';
                feedback.style.display = 'block';
                return;
            }
        }
        else if (pData.id === 'room5') {
            const selects = document.querySelectorAll('#puzzle-content .dialect-select');
            let allFilled = true;
            isCorrect = true;
            selects.forEach(sel => {
                if (!sel.value) allFilled = false;
                const reg = sel.dataset.region;
                const targetObj = pData.targets.find(t => t.region === reg);
                if (!targetObj || targetObj.word !== sel.value) isCorrect = false;
            });
            if (!allFilled) {
                feedback.className = 'puzzle-feedback feedback-fail';
                feedback.innerText = '팔도 모든 지역에 방언을 매칭해야 합니다.';
                feedback.style.display = 'block';
                return;
            }
        }
        else if (pData.id === 'room6') {
            isCorrect = this.currentQuoteOrder.every((seg, idx) => seg.id === (idx + 1));
        }

        if (isCorrect) {
            window.soundEngine.playSuccess();
            feedback.className = 'puzzle-feedback feedback-success';
            feedback.innerHTML = `
                <strong>정답입니다! 암호가 풀렸습니다.</strong><br>
                📜 획득: <strong>${pData.manuscriptName}</strong><br>
                🔑 획득: <strong>${pData.rewardItem}</strong><br><br>
                <em>"${pData.explanation}"</em>
            `;
            feedback.style.display = 'block';

            this.activePuzzleItem.solved = true;
            this.solvedPuzzles.add(pData.id);
            this.inventory.add(pData.rewardItem);
            if (pData.id !== 'room6') {
                this.collectedManuscripts.add(pData.id);
            }
            document.getElementById('hud-manuscript-count').innerText = `${this.collectedManuscripts.size}/5권`;
            document.getElementById('btn-submit-puzzle').style.display = 'none';

            if (pData.id === 'room6') {
                setTimeout(() => {
                    this.closePuzzleModal();
                    this.showEndingModal();
                }, 2000);
            }
        } else {
            // 오답 제출 시: 경보 발령 및 순사들에게 즉시 발각!
            window.soundEngine.playWhistle();
            window.soundEngine.playAlert();

            feedback.className = 'puzzle-feedback feedback-fail';
            feedback.innerHTML = `
                <strong style="color:#ff6b6b; font-size:15px;">🚨 틀렸습니다! 암호 오류로 경보가 울렸습니다!</strong><br>
                <em>"서라! 불령선인 놈!" 순사들이 이쪽으로 달려옵니다! 서둘러 옷장에 숨으십시오!</em>
            `;
            feedback.style.display = 'block';

            // 1.4초 후 퍼즐 창을 닫고 순사들이 플레이어를 향해 쇄도
            setTimeout(() => {
                if (!this.activePuzzleItem.solved) {
                    this.closePuzzleModal();

                    // 순사들을 즉시 추격 상태로 전환
                    this.officers.forEach(officer => {
                        officer.state = 'chase';
                        officer.alertTimer = 240; // 약 4초간 집요하게 추격
                        officer.isMoving = true;
                    });
                    this.updateAlertIndicator('danger');
                    this.showNotification("🚨 순사들이 몰려옵니다! 어서 은신처에 숨으십시오!");
                }
            }, 1400);
        }
    }

    closePuzzleModal() {
        document.getElementById('puzzle-modal').classList.remove('active');
        this.isPaused = false;
    }

    showOpeningModal() {
        this.isPaused = true;
        document.getElementById('opening-modal').classList.add('active');
    }

    closeOpeningModal() {
        document.getElementById('opening-modal').classList.remove('active');
        this.isPaused = false;
        window.soundEngine.init();
        window.soundEngine.startAmbient();
    }

    showGuideModal() {
        this.isPaused = true;
        document.getElementById('guide-modal').classList.add('active');
    }

    closeGuideModal() {
        document.getElementById('guide-modal').classList.remove('active');
        this.isPaused = false;
    }

    showEndingModal() {
        this.isGameOver = true;
        this.isGameWon = true;
        document.getElementById('ending-modal').classList.add('active');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();

    document.getElementById('btn-start-game').addEventListener('click', () => {
        window.game.closeOpeningModal();
    });

    // 김구 선생님 NPC 모달 이벤트
    document.getElementById('npc-modal-close').addEventListener('click', () => {
        window.game.closeNpcModal();
    });
    document.getElementById('btn-npc-confirm').addEventListener('click', () => {
        window.game.closeNpcModal();
    });
    document.getElementById('btn-npc-stealth-tip').addEventListener('click', () => {
        window.game.showStealthTip();
    });

    document.getElementById('puzzle-modal-close').addEventListener('click', () => {
        window.game.closePuzzleModal();
    });

    document.getElementById('btn-submit-puzzle').addEventListener('click', () => {
        window.game.submitPuzzle();
    });

    document.getElementById('guide-modal-close').addEventListener('click', () => {
        window.game.closeGuideModal();
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
        window.location.reload();
    });
});
