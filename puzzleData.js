// 방탈출 우리말 퍼즐 데이터 및 단서 데이터 (새 맵 가구 배치 맞춤형)
const PUZZLE_DATA = {
    room1: {
        id: "room1",
        title: "제1방 [당직실] : 중앙 책상 위 푸른 검열 일지",
        desc: "당직실 한가운데 놓인 나무 책상 위에 푸른 표지의 순찰 검열 일지가 펼쳐져 있습니다. 붉은 줄이 그어진 3개 문항에서 올바른 맞춤법을 찾아 번호를 차례로 선택하면 책상 서랍이 열립니다. (협탁 위의 파란 수첩에서 단서를 확인할 수 있습니다)",
        questions: [
            {
                q: "1. 오늘 밤 ( ? ) 거리에 수상한 자들이 배회하고 있다.",
                options: [
                    { id: 1, text: "① 웬일인지", isCorrect: true },
                    { id: 2, text: "② 왠일인지", isCorrect: false }
                ]
            },
            {
                q: "2. 그들이 비밀리에 모여 무엇을 ( ? ) 의심스럽다.",
                options: [
                    { id: 3, text: "③ 어떻게 하는지", isCorrect: true },
                    { id: 4, text: "④ 어떡해 하는지", isCorrect: false }
                ]
            },
            {
                q: "3. 내일 아침 본서 고등계 계장님을 ( ? ) 보고해야 한다.",
                options: [
                    { id: 5, text: "⑤ 뵈러", isCorrect: true },
                    { id: 6, text: "⑥ 봬러", isCorrect: false }
                ]
            }
        ],
        targetCode: "135",
        rewardItem: "서재 열쇠",
        manuscriptName: "조선말 큰사전 원고 [제1권: ㄱ편]",
        explanation: "'웬일'은 '어찌 된 일'이라는 뜻의 관형사 '웬'이 쓰인 형태이며, '어떡해'는 '어떻게 해'의 줄임말이므로 '하는지' 앞에는 '어떻게'가 맞습니다. '뵙다'의 어간에 어미 '-러'가 붙을 땐 '뵈러'가 바릅니다."
    },

    room2: {
        id: "room2",
        title: "제2방 [기록 서재] : 다다미방의 자물쇠 고서 궤짝",
        desc: "창호지 문 옆 구석에 놓인 큰 나무 궤짝에 은색 자물쇠가 채워져 있습니다. 궤짝 뚜껑에 새겨진 순우리말 고유어와 뜻풀이를 모두 짝지으면 자물쇠가 풀립니다. (옆의 작은 목제함에서 단서를 볼 수 있습니다)",
        words: [
            { word: "시나브로", meaning: "모르는 사이에 조금씩 조금씩" },
            { word: "윤슬", meaning: "햇빛이나 달빛에 비치어 반짝이는 잔물결" },
            { word: "너나들이", meaning: "서로 '너', '나' 하고 부르며 허물없이 지내는 사이" },
            { word: "안다미로", meaning: "담은 것이 그릇에 넘치도록 많이" }
        ],
        rewardItem: "인쇄실 활자함 열쇠",
        manuscriptName: "조선말 큰사전 원고 [제2권: ㄴ~ㄹ편]",
        explanation: "우리의 순우리말은 자연과 정서를 가장 섬세하게 표현하는 보물입니다. '시나브로', '윤슬', '너나들이', '안다미로'는 일제 탄압 속에서도 지켜내야 할 고유어였습니다."
    },

    room3: {
        id: "room3",
        title: "제3방 [활판 인쇄실] : 바닥의 납활자 보관 나무 상자",
        desc: "인쇄실 좌측 아래 바닥에 놓인 나무 상자 속에 옛 납활자들이 숨겨져 있습니다. 훈민정음 창제 당시 28자 중 근대에 사라진 '잃어버린 4글자' 활자를 골라내면 상자 이중 바닥이 열립니다. (벽면의 조판 메모함에서 힌트를 확인하세요)",
        choices: [
            { char: "ㆍ", name: "아래아", isLost4: true },
            { char: "ㅿ", name: "반시옷", isLost4: true },
            { char: "ㆆ", name: "여린히읗", isLost4: true },
            { char: "ㆁ", name: "옛이응", isLost4: true },
            { char: "ㄲ", name: "쌍기역 (현대 사용)", isLost4: false },
            { char: "ㅢ", name: "이중모음 의 (현대 사용)", isLost4: false },
            { char: "ㅀ", name: "겹받침 (현대 사용)", isLost4: false },
            { char: "ㅆ", name: "쌍시옷 (현대 사용)", isLost4: false }
        ],
        requiredCount: 4,
        rewardItem: "취조실 통행증",
        manuscriptName: "조선말 큰사전 원고 [제3권: ㅁ~ㅅ편]",
        explanation: "훈민정음 창제 당시 28자 가운데 'ㆍ(아래아)', 'ㆆ(여린히읗)', 'ㅿ(반시옷)', 'ㆁ(옛이응)' 4글자가 세월이 흐르며 사라져 오늘날 24자(자음 14, 모음 10)가 되었습니다."
    },

    room4: {
        id: "room4",
        title: "제4방 [순사 취조실] : 푸른 철제 압수품 금고",
        desc: "취조실 구석의 푸른 철제 금고 주변에 찢어진 수사 문서 조각들이 흩어져 있습니다. 조서 속 일본어 투 잔재 표현들을 바른 우리말 순화어와 짝지어 철제 금고를 여십시오. (방 가운데 나무 상자에 순화 지침서가 있습니다)",
        pairs: [
            { bad: "시마이(しまい)", good: "끝냄 / 마감" },
            { bad: "와쿠(枠)", good: "틀 / 뼈대" },
            { bad: "쿠사리(腐り)", good: "면박 / 핀잔" },
            { bad: "가라(空)", good: "가짜 / 헛것" }
        ],
        rewardItem: "암실 차광 열쇠",
        manuscriptName: "조선말 큰사전 원고 [제4권: ㅇ~ㅋ편]",
        explanation: "일제강점기 동안 생활 속에 강제로 스며든 왜색 낱말들을 걷어내고 온전한 우리말로 되돌리는 작업은 조선어학회의 핵심 사명이었습니다."
    },

    room5: {
        id: "room5",
        title: "제5방 [사진 현상 암실] : 다다미 중앙의 방언 필름 궤짝",
        desc: "푸른 암막 커튼이 드리워진 암실 다다미 한가운데의 나무 상자에 전국 각지에서 보내온 방언 엽서 필름이 들어 있습니다. 4개 지역의 토박이말을 알맞게 배치하십시오. (우측 3단 서랍장에서 팔도 엽서 기록을 볼 수 있습니다)",
        targets: [
            { region: "제주도", word: "혼저옵서예", hint: "탐라 바다의 인사말 ('어서 오세요')" },
            { region: "경상도", word: "단디하다", hint: "영남 지방의 표현 ('단단히 야무지게 하다')" },
            { region: "전라도", word: "귄있다", hint: "호남 지방의 표현 ('볼수록 매력과 정이 넘친다')" },
            { region: "평안도/함경도", word: "새롭다 (낯설다)", hint: "북부 지방의 방언 ('새로운 것이 아니라 낯설고 생소하다')" }
        ],
        rewardItem: "지하 금고 마스터 레버",
        manuscriptName: "조선말 큰사전 원고 [제5권: ㅌ~ㅎ편]",
        explanation: "조선어학회의 《말모이》 작전은 1929년부터 전국 각지의 교사, 학생, 민중들이 팔도의 토박이말과 사투리를 엽서로 적어 보내어 집대성한 민족적 대사업이었습니다."
    },

    room6: {
        id: "room6",
        title: "제6방 [지하 비밀 금고실] : 《조선말 큰사전》 최종 비밀 궤짝",
        desc: "가장 깊숙한 다다미방 중앙의 비밀 제본 궤짝입니다. 지금까지 모은 5권의 사전 원고를 합치고, 한힌샘 주시경 선생의 어록을 바른 순서로 배열하여 비밀 탈출구를 여십시오!",
        quoteSegments: [
            { id: 1, text: "말은 사람의 생각과" },
            { id: 2, text: "겨레의 얼을 담는" },
            { id: 3, text: "거룩한 그릇이다." },
            { id: 4, text: "말이 살아야" },
            { id: 5, text: "나라가 산다!" }
        ],
        rewardItem: "비밀 탈출 사다리 가동",
        manuscriptName: "《조선말 큰사전》 원고 전권 완성 (16,400여 장)",
        explanation: "주시경 선생의 유지를 받들어 조선어학회 선열들은 모진 고문과 옥고 속에서도 사전을 지켜냈습니다. 당신의 지혜로 우리 말과 글이 마침내 빛을 보게 되었습니다!"
    }
};

// 각 방의 보조 가구 조사 시 나오는 단서(힌트) 데이터
const CLUE_DATA = {
    clue1: {
        title: "📜 [단서] 협탁 위 학회원의 맞춤법 수첩",
        content: `
            <div style="line-height:1.8; font-size:14.5px; color:#f3e5ab;">
                <strong>[한글 맞춤법 통일안 비망록]</strong><br><br>
                • <strong>웬일 vs 왠일</strong> : '어찌 된 일'이라는 뜻일 때는 관형사 '웬'을 써서 <strong>'① 웬일인지'</strong>가 맞다. ('왠지'는 '왜인지'의 줄임말일 때만 쓴다)<br>
                • <strong>어떻게 vs 어떡해</strong> : 용언 '하는지'를 꾸며줄 때는 부사 <strong>'③ 어떻게 하는지'</strong>가 바른 표기이다.<br>
                • <strong>뵈러 vs 봬러</strong> : '뵙다'의 어간 '뵈-' 뒤에 자음으로 시작하는 어미 '-러'가 오므로 <strong>'⑤ 뵈러'</strong>가 맞다.<br><br>
                <span style="color:#ffd166;">💡 중앙 책상 서랍을 여는 정답 조합은 <strong>[ ① - ③ - ⑤ ]</strong> 이다.</span>
            </div>
        `
    },
    clue2: {
        title: "📜 [단서] 작은 목제함 속 고유어 채집 카드",
        content: `
            <div style="line-height:1.8; font-size:14.5px; color:#f3e5ab;">
                <strong>[잊혀져 가는 우리 토박이말 기록]</strong><br><br>
                • <strong>시나브로</strong> : 모르는 사이에 조금씩 조금씩<br>
                • <strong>윤슬</strong> : 햇빛이나 달빛에 비치어 반짝이는 잔물결<br>
                • <strong>너나들이</strong> : 서로 '너', '나' 하고 부르며 허물없이 지내는 사이<br>
                • <strong>안다미로</strong> : 담은 것이 그릇에 넘치도록 많이<br><br>
                <span style="color:#ffd166;">💡 바로 오른쪽의 <strong>자물쇠 달린 큰 고서 궤짝</strong>에서 이 낱말들을 짝지으십시오.</span>
            </div>
        `
    },
    clue3: {
        title: "📜 [단서] 벽면 조판대의 인쇄공 메모",
        content: `
            <div style="line-height:1.8; font-size:14.5px; color:#f3e5ab;">
                <strong>[훈민정음 28자와 소실된 4글자]</strong><br><br>
                세종대왕께서 창제하신 스물여덟 글자 중, 오늘날 현대 한글 자모(24자)에서 사라진 옛 글자 4개는 다음과 같다:<br><br>
                1. <strong>ㆍ (아래아)</strong> : 하늘을 본뜬 둥근 점 모양의 모음<br>
                2. <strong>ㅿ (반시옷)</strong> : 세모 모양의 반치음<br>
                3. <strong>ㆆ (여린히읗)</strong> : 히읗보다 소리가 여린 후음<br>
                4. <strong>ㆁ (옛이응)</strong> : 꼭지가 달린 연구개음 이응<br><br>
                <span style="color:#ffd166;">💡 방 아래쪽 바닥의 <strong>비밀 활자 보관 상자</strong>에서 이 4글자만 골라내십시오.</span>
            </div>
        `
    },
    clue4: {
        title: "📜 [단서] 바닥 나무 상자 속 우리말 순화 지침서",
        content: `
            <div style="line-height:1.8; font-size:14.5px; color:#f3e5ab;">
                <strong>[일제 잔재어 우리말 순화 대조표]</strong><br><br>
                • <strong>시마이(しまい)</strong> ➔ <strong>끝냄 / 마감</strong><br>
                • <strong>와쿠(枠)</strong> ➔ <strong>틀 / 뼈대</strong><br>
                • <strong>쿠사리(腐り)</strong> ➔ <strong>면박 / 핀잔</strong><br>
                • <strong>가라(空)</strong> ➔ <strong>가짜 / 헛것</strong><br><br>
                <span style="color:#ffd166;">💡 구석의 <strong>푸른 철제 압수품 금고</strong>에서 이 순화어들을 연결해 잠금을 해제하십시오.</span>
            </div>
        `
    },
    clue5: {
        title: "📜 [단서] 암실 3단 서랍장 속 팔도 방언 엽서철",
        content: `
            <div style="line-height:1.8; font-size:14.5px; color:#f3e5ab;">
                <strong>[전국 각지에서 도착한 말모이 방언 엽서]</strong><br><br>
                • <strong>제주도</strong> : <em>"혼저옵서예"</em> (어서 오십시오)<br>
                • <strong>경상도</strong> : <em>"단디하다"</em> (단단히, 빈틈없이 야무지게 하다)<br>
                • <strong>전라도</strong> : <em>"귄있다"</em> (볼수록 매력과 정이 넘친다)<br>
                • <strong>평안도/함경도</strong> : <em>"새롭다"</em> (새로운 것이 아니라 '낯설고 생소하다'는 뜻)<br><br>
                <span style="color:#ffd166;">💡 다다미 바닥 한가운데 놓인 <strong>방언 필름 궤짝</strong>에서 지역별로 매칭하십시오.</span>
            </div>
        `
    }
};
