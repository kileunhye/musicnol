const app = document.querySelector('#app');
const accountLabel = document.querySelector('#account-label');

const demoContent = {
  title: '초록 바다', artist: '놀라운 음악 교실',
  lyrics: [
    { text: '초록빛 바다 사이로', start: 0, end: 4 },
    { text: '작은 배가 지나가요', start: 4, end: 8 },
    { text: '두 손을 높이 올리고', start: 8, end: 12 },
    { text: '우리 함께 노래해요', start: 12, end: 16 }
  ], quizLineIndex: 1, answer: '작은 배가 지나가요'
};

const state = {
  teacherContent: JSON.parse(localStorage.getItem('musicnol-content') || 'null'),
  score: 0, selectedAnswer: '', listeningComplete: false, wrong: false,
  usedHints: [], hintOrder: [], quizLineIndex: 0
};

function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function formatTime(value) { const n = Number(value) || 0; return `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toFixed(1).padStart(4, '0')}`; }
function setAccount(value) { accountLabel.textContent = value; }
function contentForStudent() { return state.teacherContent?.lyrics?.length ? state.teacherContent : demoContent; }
function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function goHome() { setAccount('체험 모드'); renderHome(); }

function renderHome() {
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">초등 음악 수업을 위한 플레이룸</div><h1>음악을 듣는 순간,<br /><em>교실이 무대</em>가 됩니다.</h1><p class="hero-copy">교사는 음악과 가사를 직접 준비하고, 학생은 노래를 듣고 따라 부르며 즐겁게 배웁니다. 귀여운 퀴즈와 힌트로 음악 시간이 더 기다려져요.</p><div class="hero-actions"><button class="btn btn-primary" data-action="teacher">교사로 시작하기</button><button class="btn btn-secondary" data-action="student">학생으로 참여하기</button></div></div><div class="hero-art"><div class="music-card"><div class="music-card-top"><div class="album">♫</div><div><h3>오늘의 음악</h3><p>초록 바다 · 음악 감상 중</p></div></div><div class="wave">${Array.from({length:25}, (_, i) => `<span style="height:${18 + ((i * 17) % 38)}px"></span>`).join('')}</div><div class="notice">전체 음악을 먼저 듣고 가사 퀴즈에 도전해요</div></div></div></section><section class="feature-grid"><article class="feature"><div class="feature-icon">🎛️</div><h3>선생님 음악 스튜디오</h3><p>MP3를 넣고 퀴즈로 사용할 가사 구간을 지정하세요.</p></article><article class="feature"><div class="feature-icon">🎧</div><h3>친구들의 학습 화면</h3><p>전체 음악을 감상한 뒤 지정된 가사를 맞혀보세요.</p></article><article class="feature"><div class="feature-icon">🌟</div><h3>힌트로 다시 도전</h3><p>오답 뒤 랜덤 힌트를 사용하며 음악을 더 자세히 들어요.</p></article></section>`;
  bindActions();
}

function renderTeacher() {
  setAccount('교사 체험 계정'); const c = state.teacherContent || {};
  app.innerHTML = `<a href="#" class="back" data-action="home">← 홈으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio</div><h2>음악 콘텐츠 만들기</h2><p>MP3와 가사를 등록한 뒤 퀴즈 구간을 설정합니다.</p></div><span class="tag">교사 전용</span></div><div class="dashboard-grid"><section class="panel"><h3>01. 음악과 가사 등록</h3><div class="form-grid"><div class="field"><label for="title">곡 제목</label><input id="title" value="${escapeHTML(c.title || '')}" placeholder="예: 초록 바다" /></div><div class="field"><label for="artist">가수/출처</label><input id="artist" value="${escapeHTML(c.artist || '')}" placeholder="예: 놀라운 음악 교실" /></div><div class="field full"><label>MP3 파일</label><div class="upload"><div class="album">♫</div><div class="upload-copy"><strong id="file-name">${escapeHTML(c.fileName || 'MP3 파일을 선택하세요')}</strong><span id="file-meta">브라우저에서 임시 보관됩니다.</span></div><label class="btn btn-ghost" for="audio-file">파일 선택</label><input id="audio-file" type="file" accept="audio/*" /></div></div><div class="field full"><label for="lyrics">가사 (한 줄에 한 문장)</label><textarea id="lyrics" placeholder="가사를 줄바꿈해서 입력하세요">${escapeHTML((c.lyrics || []).map(x => x.text).join('\n'))}</textarea></div></div></section><aside class="panel"><h3>진행 순서</h3><div class="list-item"><div><strong>1. 전체 음악 감상</strong><p>학생이 먼저 곡 전체를 듣습니다.</p></div><span class="tag">필수</span></div><div class="list-item"><div><strong>2. 퀴즈 가사 구간</strong><p>싱크 화면에서 한 줄을 선택합니다.</p></div><span class="tag">다음</span></div><div class="list-item"><div><strong>3. 힌트 설정</strong><p>오답 후 3종 힌트가 랜덤 노출됩니다.</p></div><span class="tag">자동</span></div></aside></div><div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 보기</button><button class="btn btn-primary" data-action="to-sync">가사 싱크 설정 →</button></div>`;
  bindActions(); document.querySelector('#audio-file').addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; state.pendingFile = file; document.querySelector('#file-name').textContent = file.name; document.querySelector('#file-meta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type || 'audio'}`; });
}

function getDraft() {
  const previous = state.teacherContent || {};
  const lines = document.querySelector('#lyrics').value.split('\n').map(x => x.trim()).filter(Boolean);
  return { ...previous, title: document.querySelector('#title').value.trim() || '새 음악', artist: document.querySelector('#artist').value.trim() || '직접 만든 수업 자료', fileName: state.pendingFile?.name || previous.fileName || '', audioUrl: state.pendingFile ? URL.createObjectURL(state.pendingFile) : previous.audioUrl || '', lyrics: lines.map((text, i) => previous.lyrics?.[i] ? { ...previous.lyrics[i], text } : { text, start: i * 4, end: i * 4 + 4 }), quizLineIndex: previous.quizLineIndex ?? 0 };
}

function renderSync() {
  state.teacherContent = getDraft(); const c = state.teacherContent;
  app.innerHTML = `<a href="#" class="back" data-action="teacher">← 음악 등록으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio / 02</div><h2>가사 싱크와 퀴즈 구간</h2><p>퀴즈로 낼 가사 줄의 <strong>퀴즈 지정</strong> 버튼을 눌러주세요.</p></div><span class="tag">${c.lyrics.length}줄 등록됨</span></div><section class="panel"><div class="sync-layout"><div><div class="audio-box"><h3>${escapeHTML(c.title)}</h3><p class="small">${escapeHTML(c.fileName || '음원 미선택 · 데모 타이밍으로 미리보기')}</p><audio id="sync-audio" controls ${c.audioUrl ? `src="${c.audioUrl}"` : ''}></audio><div class="time-readout" id="sync-time">00:00.0</div><div class="sync-controls"><button class="btn btn-primary" data-action="mark-line">현재 시간에 줄 표시</button><button class="btn btn-secondary" data-action="reset-sync">싱크 초기화</button></div></div><div class="notice" style="margin-top:14px">학생은 전체 음악을 먼저 들은 뒤, 아래에서 지정한 한 가사를 맞힙니다.</div></div><div><h3>가사 타임라인</h3><div class="lyric-lines">${c.lyrics.map((line, i) => `<div class="lyric-row ${i === c.quizLineIndex ? 'active' : ''}" data-index="${i}"><input class="line-start" type="number" step="0.1" value="${line.start ?? 0}" /><span>${escapeHTML(line.text)}</span><button class="btn btn-ghost quiz-line-button" data-index="${i}">${i === c.quizLineIndex ? '퀴즈 지정됨' : '퀴즈 지정'}</button></div>`).join('')}</div></div></div><div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 미리보기</button><button class="btn btn-primary" data-action="save-content">싱크 저장하기</button></div></section>`;
  bindActions(); const audio = document.querySelector('#sync-audio'); audio.addEventListener('timeupdate', () => { document.querySelector('#sync-time').textContent = formatTime(audio.currentTime); highlightLyric(audio.currentTime); });
  document.querySelectorAll('.line-start').forEach(input => input.addEventListener('change', e => { const i = Number(e.target.closest('.lyric-row').dataset.index); c.lyrics[i].start = Number(e.target.value); c.lyrics[i].end = c.lyrics[i + 1]?.start || c.lyrics[i].start + 4; }));
  document.querySelectorAll('.quiz-line-button').forEach(button => button.addEventListener('click', () => { c.quizLineIndex = Number(button.dataset.index); state.quizLineIndex = c.quizLineIndex; renderSync(); }));
}

function highlightLyric(time) { const c = state.teacherContent?.lyrics || []; let index = c.findIndex((line, i) => time >= line.start && time < (c[i + 1]?.start ?? line.end ?? Infinity)); if (index < 0) index = 0; document.querySelectorAll('.lyric-row').forEach((row, i) => row.classList.toggle('active', i === index)); state.quizLineIndex = index; }
function markCurrentLine() { const audio = document.querySelector('#sync-audio'); const row = document.querySelector(`.lyric-row[data-index="${state.quizLineIndex}"]`); if (!audio || !row) return; row.querySelector('input').value = audio.currentTime.toFixed(1); state.teacherContent.lyrics[state.quizLineIndex].start = audio.currentTime; state.teacherContent.lyrics[state.quizLineIndex].end = state.teacherContent.lyrics[state.quizLineIndex + 1]?.start || audio.currentTime + 4; }
function saveContent() { localStorage.setItem('musicnol-content', JSON.stringify({ ...state.teacherContent, savedAt: new Date().toISOString() })); alert('음악, 가사 싱크, 퀴즈 구간을 저장했습니다.'); }

function renderStudent() {
  setAccount('학생 체험 계정'); const c = contentForStudent(); const quizIndex = c.quizLineIndex ?? demoContent.quizLineIndex; const target = c.lyrics[quizIndex] || c.lyrics[0];
  app.innerHTML = `<div class="student-layout"><a href="#" class="back" data-action="home">← 홈으로</a><div class="student-hero"><div class="eyebrow" style="color:#b9c9ff">Student room</div><h2>${escapeHTML(c.title)}</h2><p>${escapeHTML(c.artist)} · 학생 학습 화면</p></div><section class="quiz-card" style="margin-top:18px"><div class="eyebrow">Step 1 · 전체 음악 감상</div><h3>먼저 음악 전체를 들어보세요.</h3><p class="small">음악을 충분히 들은 뒤 아래 버튼을 누르면 교사가 지정한 가사 퀴즈가 열립니다.</p><audio id="student-audio" controls ${c.audioUrl ? `src="${c.audioUrl}"` : ''} style="width:100%;margin-top:10px"></audio><div class="progress" style="margin-top:13px"><span id="student-progress"></span></div><div class="actions"><button class="btn btn-primary" data-action="finish-listening">전체 음악 감상 완료 →</button></div></section><div id="quiz-area" class="${state.listeningComplete ? '' : 'hidden'}"></div></div>`;
  bindActions(); const audio = document.querySelector('#student-audio'); audio.addEventListener('timeupdate', () => { document.querySelector('#student-progress').style.width = audio.duration ? `${audio.currentTime / audio.duration * 100}%` : '0%'; }); if (state.listeningComplete) renderQuizArea(c, target);
}

function renderQuizArea(c, target) {
  const area = document.querySelector('#quiz-area'); if (!area) return; const hints = state.hintOrder.map(type => `<button class="btn btn-ghost hint-button" data-hint="${type}">${type === 'space' ? '1. 띄어쓰기 보기' : type === 'initial' ? '2. 초성 보기' : '3. 0.75배속으로 듣기'}</button>`).join('');
  const hintResult = state.usedHints.map(type => `<div class="notice hint-result">${type === 'space' ? `띄어쓰기 힌트: <strong>${escapeHTML(target.text)}</strong>` : type === 'initial' ? `초성 힌트: <strong>${escapeHTML(getInitials(target.text))}</strong>` : '느린 재생 힌트: 아래 음악을 0.75배속으로 재생합니다.'}</div>`).join('');
  area.innerHTML = `<section class="lyric-stage"><div><div class="eyebrow" style="color:#b9c9ff">Step 2 · 가사 맞히기</div><div class="current">${state.wrong ? '이 가사의 부분을 입력해보세요' : '교사가 지정한 가사를 맞혀보세요'}</div><div class="next">${state.wrong ? '틀렸어요. 힌트를 하나 골라 다시 도전하세요.' : '1단계 정답은 10점입니다.'}</div></div></section><section class="quiz-card"><h3>가사 입력</h3><input id="lyric-answer" class="field-input" placeholder="들었던 가사를 입력하세요" value="${escapeHTML(state.selectedAnswer)}" /><div class="actions"><button class="btn btn-primary" data-action="submit-lyric">정답 제출</button></div>${state.wrong ? `<div class="notice" style="margin-top:15px"><strong>랜덤 힌트</strong> · 아래 힌트 중 하나를 선택하세요.</div><div class="hero-actions">${hints}</div>${hintResult}` : ''}</section><div class="score-card"><div><strong>나의 점수</strong><div class="small">힌트를 사용하면 학습은 계속할 수 있지만 1단계 10점은 한 번만 지급됩니다.</div></div><span class="score">${state.score} pt</span></div>`;
  bindActions(); document.querySelector('#lyric-answer').addEventListener('input', e => state.selectedAnswer = e.target.value);
  document.querySelectorAll('.hint-button').forEach(b => b.addEventListener('click', () => useHint(b.dataset.hint, c)));
}

function getInitials(text) { return [...text].map(char => { const code = char.charCodeAt(0) - 0xac00; if (code < 0 || code > 11171) return char === ' ' ? ' ' : char; return String.fromCharCode(0x1100 + Math.floor(code / 588)); }).join(''); }
function finishListening() { state.listeningComplete = true; state.wrong = false; state.selectedAnswer = ''; state.usedHints = []; state.hintOrder = []; renderStudent(); }
function submitLyric() { const c = contentForStudent(); const target = c.lyrics[c.quizLineIndex ?? demoContent.quizLineIndex] || c.lyrics[0]; const answer = state.selectedAnswer.trim().replace(/\s+/g, ' '); if (!answer) return alert('가사를 입력해주세요.'); if (answer === target.text.trim()) { state.score = state.wrong ? state.score : state.score + 10; state.wrong = false; alert(state.score === 10 ? '정답이에요! 10점 획득!' : '정답이에요!'); renderStudent(); } else { state.wrong = true; state.hintOrder = shuffle(['space', 'initial', 'slow'].filter(x => !state.usedHints.includes(x))); renderQuizArea(c, target); alert('아쉬워요. 힌트를 하나 골라 다시 도전해보세요.'); } }
function useHint(type, c) { if (state.usedHints.includes(type)) return; state.usedHints.push(type); if (type === 'slow') { const audio = document.querySelector('#student-audio'); if (audio) { audio.playbackRate = 0.75; audio.play().catch(() => {}); } } renderQuizArea(c, c.lyrics[c.quizLineIndex ?? demoContent.quizLineIndex] || c.lyrics[0]); }

function bindActions() { document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', e => { e.preventDefault(); const a = button.dataset.action; if (a === 'home') goHome(); if (a === 'teacher') renderTeacher(); if (a === 'student') renderStudent(); if (a === 'to-sync') renderSync(); if (a === 'mark-line') markCurrentLine(); if (a === 'reset-sync') { state.teacherContent.lyrics.forEach((line, i) => { line.start = i * 4; line.end = i * 4 + 4; }); renderSync(); } if (a === 'save-content') saveContent(); if (a === 'finish-listening') finishListening(); if (a === 'submit-lyric') submitLyric(); })); }
renderHome();
