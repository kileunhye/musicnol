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
  teacherContent: JSON.parse(localStorage.getItem('musicnol-content') || 'null'), melodyContent: JSON.parse(localStorage.getItem('musicnol-melody') || 'null'), melodyStudentNumber: '', melodyStartedAt: 0, melodyElapsed: 0, melodyTimer: null, melodyResult: '',
  score: 0, stageScores: {}, stageHints: {}, studentNumber: '', selectedAnswer: '', stageOneAnswer: '', stageOneExpected: '', listeningComplete: false, wrong: false, celebration: false, quizResult: '', stageCompleted: false, quizStage: 1, syncHistory: [],
  usedHints: [], hintOrder: [], quizLineIndex: 0
};

function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function formatTime(value) { const n = Number(value) || 0; return `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toFixed(1).padStart(4, '0')}`; }
function setAccount(value) { accountLabel.textContent = value; }
function contentForStudent() { return state.teacherContent?.lyrics?.length ? state.teacherContent : demoContent; }
function getRecords() { return JSON.parse(localStorage.getItem('musicnol-records') || '[]'); }
function recordStageScore(record, stage) { return Number(record.stageScores?.[stage] ?? (stage === 1 ? record.score : 0)) || 0; }
function getLeaderboard(stage = state.quizStage) { return getRecords().sort((a, b) => recordStageScore(b, stage) - recordStageScore(a, stage) || a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true })); }
function getOverallLeaderboard() { return getRecords().sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0) || a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true })); }
function aggregateScoreRows(rows) { const records = {}; rows.forEach(row => { const studentNumber = String(row.student_number); records[studentNumber] ??= { studentNumber, score: 0, stageScores: {}, stageHints: {}, updatedAt: row.updated_at }; records[studentNumber].stageScores[row.stage] = Number(row.score) || 0; records[studentNumber].stageHints[row.stage] = Number(row.hints_used) || 0; records[studentNumber].score += Number(row.score) || 0; records[studentNumber].updatedAt = row.updated_at; }); return Object.values(records); }
async function syncRemoteRecords() { if (!window.musicStorage?.isConfigured()) return; try { const rows = await window.musicStorage.listStudentScores(); const records = aggregateScoreRows(rows); localStorage.setItem('musicnol-records', JSON.stringify(records)); const current = records.find(record => record.studentNumber === state.studentNumber); if (current) { state.score = current.score; state.stageScores = current.stageScores || {}; } } catch (error) { console.warn(error); } }
async function saveRecord() { const records = getRecords().filter(record => record.studentNumber !== state.studentNumber); const record = { studentNumber: state.studentNumber, score: Object.values(state.stageScores).reduce((sum, score) => sum + score, 0), stageScores: { ...state.stageScores }, stageHints: { ...state.stageHints }, updatedAt: new Date().toISOString() }; records.push(record); state.score = record.score; localStorage.setItem('musicnol-records', JSON.stringify(records)); if (window.musicStorage?.isConfigured()) { try { await Promise.all(Object.entries(state.stageScores).map(([stage, score]) => window.musicStorage.upsertStudentScore({ student_number: state.studentNumber, stage: Number(stage), score: Number(score), hints_used: Number(state.stageHints[stage] || 0), updated_at: record.updatedAt }))); } catch (error) { console.warn(error); } } }
function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function goHome() { setAccount('체험 모드'); renderHome(); }

function renderHome() {
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">초등 음악 수업을 위한 플레이룸</div><h1>음악을 듣는 순간,<br /><em>교실이 무대</em>가 됩니다.</h1><p class="hero-copy">교사는 음악과 가사를 직접 준비하고, 학생은 노래를 듣고 따라 부르며 즐겁게 배웁니다. 귀여운 퀴즈와 힌트로 음악 시간이 더 기다려져요.</p><div class="hero-actions"><button class="btn btn-primary" data-action="teacher">교사로 시작하기</button><button class="btn btn-secondary" data-action="student-entry">학생으로 참여하기</button><button class="btn btn-melody" data-action="melody-change">🎵 멜로디 체인지</button></div></div><div class="hero-art"><div class="music-card"><div class="music-card-top"><div class="album">♫</div><div><h3>오늘의 음악</h3><p>초록 바다 · 음악 감상 중</p></div></div><div class="wave">${Array.from({length:25}, (_, i) => `<span style="height:${18 + ((i * 17) % 38)}px"></span>`).join('')}</div><div class="notice">전체 음악을 먼저 듣고 가사 퀴즈에 도전해요</div></div></div></section><section class="feature-grid"><article class="feature"><div class="feature-icon">🎛️</div><h3>선생님 음악 스튜디오</h3><p>MP3를 넣고 퀴즈로 사용할 가사 구간을 지정하세요.</p></article><article class="feature"><div class="feature-icon">🎧</div><h3>친구들의 학습 화면</h3><p>전체 음악을 감상한 뒤 지정된 가사를 맞혀보세요.</p></article><article class="feature"><div class="feature-icon">🌟</div><h3>힌트로 다시 도전</h3><p>오답 뒤 랜덤 힌트를 사용하며 음악을 더 자세히 들어요.</p></article></section>`;
  bindActions();
  const teacherButton = document.querySelector('[data-action="teacher"]');
  if (teacherButton) { teacherButton.title = '교사 비밀번호가 필요합니다'; teacherButton.textContent = '교사로 시작하기 🔒'; }
}

function getMelodyRecords() { return JSON.parse(localStorage.getItem('musicnol-melody-records') || '[]'); }
async function syncRemoteContent() {
  if (!window.musicStorage?.isConfigured()) return;
  try {
    const remote = await window.musicStorage.getClassContent();
    if (remote) { state.teacherContent = remote; localStorage.setItem('musicnol-content', JSON.stringify(remote)); }
    else if (state.teacherContent) await window.musicStorage.upsertClassContent({ ...state.teacherContent, melodyContent: state.melodyContent || undefined });
  } catch (error) { console.warn(error); }
}
async function syncRemoteMelodyContent() {
  if (!window.musicStorage?.isConfigured()) return;
  try {
    const remote = await window.musicStorage.getClassContent();
    if (remote?.melodyContent) { state.melodyContent = remote.melodyContent; localStorage.setItem('musicnol-melody', JSON.stringify(remote.melodyContent)); }
    const rows = await window.musicStorage.listMelodyRecords();
    localStorage.setItem('musicnol-melody-records', JSON.stringify(rows.map(row => ({ studentNumber: String(row.student_number), elapsed: Number(row.elapsed), updatedAt: row.updated_at }))));
  } catch (error) { console.warn(error); }
}
function melodyLeaderboard() { return getMelodyRecords().sort((a, b) => a.elapsed - b.elapsed || a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true })); }
function formatSeconds(value) { return `${Number(value || 0).toFixed(1)}초`; }
function renderMelodyChange() {
  setAccount('멜로디 체인지');
  app.innerHTML = `<a href="#" class="back" data-action="home">← 홈으로</a><section class="panel melody-change-page"><div class="eyebrow">New music game</div><h2>멜로디 체인지 🎵</h2><p>음원을 듣고 노래 제목을 가장 빠르게 맞혀보세요!</p><div class="melody-change-art">🎶 🐻 🎶</div><div class="melody-choice-grid"><button class="btn btn-primary" data-action="melody-teacher">교사로 음원 등록</button><button class="btn btn-secondary" data-action="melody-student">학생으로 참여</button></div></section>`;
  bindActions();
}

function renderMelodyTeacherUnlocked() {
  setAccount('멜로디 체인지 · 교사'); const c = state.melodyContent || {};
  app.innerHTML = `<a href="#" class="back" data-action="melody-change">← 멜로디 체인지</a><section class="panel melody-change-page melody-teacher-page"><div class="eyebrow">Teacher studio · Melody change</div><h2>멜로디 체인지 문제 만들기</h2><p>음원을 올리고 학생이 맞힐 노래 제목을 정답으로 입력하세요.</p><div class="field full"><label for="melody-title">노래 제목(정답)</label><input id="melody-title" class="field-input" placeholder="예: 초록 바다" value="${escapeHTML(c.title || '')}" /></div><div class="field full"><label>문제 음원</label><div class="upload"><div class="album">♫</div><div class="upload-copy"><strong id="melody-file-name">${escapeHTML(c.fileName || '음원 파일을 선택하세요')}</strong><span id="melody-file-meta">학생이 제목을 맞힐 때 재생됩니다.</span></div><label class="btn btn-ghost" for="melody-audio-file">파일 선택</label><input id="melody-audio-file" type="file" accept="audio/*" /></div></div><div class="actions"><button class="btn btn-primary" data-action="save-melody">멜로디 체인지 저장</button></div></section>`;
  document.querySelector('#melody-audio-file').addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; state.pendingMelodyFile = file; document.querySelector('#melody-file-name').textContent = file.name; document.querySelector('#melody-file-meta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type || 'audio'}`; });
  bindActions();
}

async function saveMelodyContent() {
  const title = document.querySelector('#melody-title')?.value.trim(); const file = state.pendingMelodyFile;
  if (!title) return alert('노래 제목을 입력해주세요.'); if (!file && !state.melodyContent?.audioUrl) return alert('문제 음원을 선택해주세요.');
  const content = { ...(state.melodyContent || {}), title, fileName: file?.name || state.melodyContent?.fileName || '' };
  try {
    if (file && window.musicStorage?.isConfigured()) { const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); const uploaded = await window.musicStorage.uploadAudio(file, `melody/${Date.now()}-${safeName}`); content.audioPath = uploaded.path; content.audioUrl = uploaded.publicUrl; }
    else if (file) { content.audioUrl = URL.createObjectURL(file); }
    state.melodyContent = content; state.pendingMelodyFile = null; localStorage.setItem('musicnol-melody', JSON.stringify(content));
    await window.musicStorage?.upsertClassContent({ ...(state.teacherContent || {}), melodyContent: content });
    alert('멜로디 체인지 음원과 정답을 저장했습니다.'); renderMelodyChange();
  } catch (error) { alert(error.message || '멜로디 체인지 저장에 실패했습니다.'); }
}

function renderMelodyStudentEntry() {
  setAccount('멜로디 체인지 · 학생'); const c = state.melodyContent;
  app.innerHTML = `<a href="#" class="back" data-action="melody-change">← 멜로디 체인지</a><section class="panel melody-change-page"><div class="eyebrow">Student room · Melody change</div><h2>멜로디 체인지에 참여하기</h2><p>${c?.title ? '학생 번호를 입력하고 게임을 시작하세요.' : '교사가 먼저 멜로디 체인지 음원과 정답을 저장해야 합니다.'}</p><div class="field"><label for="melody-student-number">학생 번호</label><input id="melody-student-number" class="field-input" inputmode="numeric" placeholder="예: 5" /></div><div class="actions"><button class="btn btn-primary" data-action="start-melody-game" ${c?.audioUrl ? '' : 'disabled'}>게임 시작 →</button></div></section>`;
  bindActions();
}

function renderMelodyGame() {
  const c = state.melodyContent; setAccount(`멜로디 체인지 · ${state.melodyStudentNumber}번`); clearInterval(state.melodyTimer); state.melodyTimer = null;
  app.innerHTML = `<a href="#" class="back" data-action="melody-student">← 학생 번호 변경</a><section class="panel melody-change-page melody-game-page"><div class="eyebrow">Student room · Melody change</div><h2>노래 제목을 맞혀보세요!</h2><p>재생 버튼을 누르는 순간부터 시간이 측정됩니다.</p><div class="melody-timer" id="melody-timer">00.0초</div><audio id="melody-audio" controls src="${escapeHTML(c.audioUrl || '')}"></audio><div class="field full"><label for="melody-answer">노래 제목</label><input id="melody-answer" class="field-input" placeholder="노래 제목을 입력하세요" /></div><div class="actions"><button class="btn btn-primary" data-action="submit-melody-answer">정답 저장</button></div><div id="melody-feedback"></div><div class="melody-ranking"><h3>멜로디 체인지 순위</h3>${melodyRankingHTML()}</div></section>`;
  const audio = document.querySelector('#melody-audio'); audio.addEventListener('play', () => { if (!state.melodyStartedAt) { state.melodyStartedAt = Date.now(); state.melodyTimer = setInterval(() => { state.melodyElapsed = (Date.now() - state.melodyStartedAt) / 1000; const timer = document.querySelector('#melody-timer'); if (timer) timer.textContent = formatSeconds(state.melodyElapsed); }, 100); } });
  bindActions();
}

function melodyRankingHTML() { const records = melodyLeaderboard(); if (!records.length) return '<p class="small">아직 정답을 맞힌 친구가 없어요.</p>'; return `<div class="record-table"><div class="record-row record-head"><span>순위</span><span>학생 번호</span><span>기록</span></div>${records.map((record, index) => `<div class="record-row ${record.studentNumber === state.melodyStudentNumber ? 'mine' : ''}"><strong>${index + 1}</strong><span>${escapeHTML(record.studentNumber)}번</span><strong>${formatSeconds(record.elapsed)}</strong></div>`).join('')}</div>`; }

function submitMelodyAnswer() {
  if (!state.melodyStartedAt) return alert('먼저 음원의 재생 버튼을 눌러주세요.'); const answer = document.querySelector('#melody-answer')?.value.trim(); if (!answer) return alert('노래 제목을 입력해주세요.');
  const elapsed = (Date.now() - state.melodyStartedAt) / 1000; clearInterval(state.melodyTimer); state.melodyTimer = null; state.melodyElapsed = elapsed; const feedback = document.querySelector('#melody-feedback');
  if (answer !== String(state.melodyContent.title || '').trim()) { state.melodyResult = 'wrong'; if (feedback) feedback.innerHTML = '<div class="notice melody-wrong">아쉬워요. 제목이 정확하지 않아요.</div>'; return; }
  const records = melodyLeaderboard().filter(record => record.studentNumber !== state.melodyStudentNumber); records.push({ studentNumber: state.melodyStudentNumber, elapsed: Number(elapsed.toFixed(1)), updatedAt: new Date().toISOString() }); localStorage.setItem('musicnol-melody-records', JSON.stringify(records)); state.melodyResult = 'correct'; if (feedback) feedback.innerHTML = `<div class="notice melody-correct">정답이에요! ${formatSeconds(elapsed)} 기록으로 저장됐어요.</div><div class="melody-ranking"><h3>현재 순위</h3>${melodyRankingHTML()}</div>`; document.querySelector('#melody-answer')?.setAttribute('disabled', 'disabled'); document.querySelector('[data-action="submit-melody-answer"]')?.setAttribute('disabled', 'disabled');
}

function renderTeacherUnlocked() {
  setAccount('교사 체험 계정'); const c = state.teacherContent || {};
  app.innerHTML = `<a href="#" class="back" data-action="home">← 홈으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio</div><h2>음악 콘텐츠 만들기</h2><p>MP3와 가사를 등록한 뒤 퀴즈 구간을 설정합니다.</p></div><span class="tag">교사 전용</span></div><div class="dashboard-grid"><section class="panel"><h3>01. 음악과 가사 등록</h3><div class="form-grid"><div class="field"><label for="title">곡 제목</label><input id="title" value="${escapeHTML(c.title || '')}" placeholder="예: 초록 바다" /></div><div class="field"><label for="artist">가수/출처</label><input id="artist" value="${escapeHTML(c.artist || '')}" placeholder="예: 놀라운 음악 교실" /></div><div class="field full"><label>MP3 파일</label><div class="upload"><div class="album">♫</div><div class="upload-copy"><strong id="file-name">${escapeHTML(c.fileName || 'MP3 파일을 선택하세요')}</strong><span id="file-meta">브라우저에서 임시 보관됩니다.</span></div><label class="btn btn-ghost" for="audio-file">파일 선택</label><input id="audio-file" type="file" accept="audio/*" /></div></div><div class="field full"><label for="lyrics">가사 (한 줄에 한 문장)</label><textarea id="lyrics" placeholder="가사를 줄바꿈해서 입력하세요">${escapeHTML((c.lyrics || []).map(x => x.text).join('\n'))}</textarea></div></div></section><aside class="panel"><h3>진행 순서</h3><div class="list-item"><div><strong>1. 전체 음악 감상</strong><p>학생이 먼저 곡 전체를 듣습니다.</p></div><span class="tag">필수</span></div><div class="list-item"><div><strong>2. 퀴즈 가사 구간</strong><p>싱크 화면에서 한 줄을 선택합니다.</p></div><span class="tag">다음</span></div><div class="list-item"><div><strong>3. 힌트 설정</strong><p>오답 후 3종 힌트가 랜덤 노출됩니다.</p></div><span class="tag">자동</span></div></aside></div><div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 보기</button><button class="btn btn-secondary" data-action="save-content">중간 저장</button><button class="btn btn-primary" data-action="ai-analyze">AI 자동 분석 시작</button><button class="btn btn-primary" data-action="to-sync">가사 싱크 설정 →</button></div>`;
  bindActions(); document.querySelector('#audio-file').addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; state.pendingFile = file; document.querySelector('#file-name').textContent = file.name; document.querySelector('#file-meta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type || 'audio'}`; });
}

function getQuizStages(content) { return content.quizStages?.length ? content.quizStages : [{ stage: 1, lyricIndex: content.quizLineIndex ?? 0 }]; }
function activeQuizIndex(content) { return getQuizStages(content).find(item => item.stage === state.quizStage)?.lyricIndex ?? 0; }
function getStageConfig(content, stage = state.quizStage) { return getQuizStages(content).find(item => item.stage === stage) || { stage, lyricIndex: content.quizLineIndex ?? 0, visibility: 'hide-all' }; }
function stageVisibility(content, stage = state.quizStage) { return getStageConfig(content, stage).visibility === 'hide-question' ? 'hide-question' : 'hide-all'; }
function cloneContent(content) { return JSON.parse(JSON.stringify(content)); }
function pushSyncHistory() { if (state.teacherContent) state.syncHistory.push(cloneContent(state.teacherContent)); if (state.syncHistory.length > 20) state.syncHistory.shift(); }
function undoSync() { const previous = state.syncHistory.pop(); if (!previous) return alert('되돌릴 작업이 없습니다.'); state.teacherContent = previous; renderSync(); }
async function resetSyncAndAudio() {
  const content = state.teacherContent;
  if (!content) return;
  if (!confirm('싱크를 초기화하고 Supabase에 저장된 기존 음원도 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
  pushSyncHistory();
  try {
    if (content.audioPath && window.musicStorage?.isConfigured()) await window.musicStorage.deleteAudio(content.audioPath);
    if (content.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(content.audioUrl);
    state.pendingFile = null;
    content.audioPath = '';
    content.audioUrl = '';
    content.fileName = '';
    content.lyrics.forEach((line, i) => {
      line.start = i * 4;
      line.end = i * 4 + 4;
    });
    state.teacherContent = content;
    localStorage.setItem('musicnol-content', JSON.stringify(content));
    await window.musicStorage?.upsertClassContent({ ...content, melodyContent: state.melodyContent || undefined });
    renderSync();
    alert('싱크와 기존 음원을 초기화했습니다.');
  } catch (error) {
    state.syncHistory.pop();
    alert(error.message || '음원 삭제에 실패했습니다.');
  }
}
async function resetTeacherAudio() {
  const content = document.querySelector('#lyrics') ? getDraft() : state.teacherContent;
  if (!content) return;
  if (!confirm('현재 음원을 초기화하고 Supabase에 저장된 음원 파일도 삭제할까요?')) return;
  try {
    if (content.audioPath && window.musicStorage?.isConfigured()) await window.musicStorage.deleteAudio(content.audioPath);
    if (content.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(content.audioUrl);
    state.pendingFile = null;
    content.audioPath = '';
    content.audioUrl = '';
    content.fileName = '';
    state.teacherContent = content;
    localStorage.setItem('musicnol-content', JSON.stringify(content));
    renderTeacher();
    alert('음원을 초기화했습니다.');
  } catch (error) {
    alert(error.message || '음원 삭제에 실패했습니다.');
  }
}
function getDraft() {
  const previous = state.teacherContent || {};
  const lines = document.querySelector('#lyrics').value.split('\n').map(x => x.trim()).filter(Boolean);
  return { ...previous, title: document.querySelector('#title').value.trim() || '새 음악', artist: document.querySelector('#artist').value.trim() || '직접 만든 수업 자료', fileName: state.pendingFile?.name || previous.fileName || '', audioUrl: state.pendingFile ? URL.createObjectURL(state.pendingFile) : previous.audioUrl || '', lyrics: lines.map((text, i) => previous.lyrics?.[i] ? { ...previous.lyrics[i], text } : { text, start: i * 4, end: i * 4 + 4 }), quizLineIndex: previous.quizLineIndex ?? 0, quizStages: previous.quizStages || [{ stage: 1, lyricIndex: previous.quizLineIndex ?? 0 }] };
}

function renderSync() {
  state.teacherContent = getDraft(); const c = state.teacherContent;
  app.innerHTML = `<a href="#" class="back" data-action="teacher">← 음악 등록으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio / 02</div><h2>가사 싱크와 퀴즈 구간</h2><p>퀴즈로 낼 가사 줄의 <strong>퀴즈 지정</strong> 버튼을 눌러주세요.</p></div><span class="tag">${c.lyrics.length}줄 등록됨</span></div><section class="panel"><div class="sync-layout"><div><div class="audio-box"><h3>${escapeHTML(c.title)}</h3><p class="small">${escapeHTML(c.fileName || '음원 미선택 · 데모 타이밍으로 미리보기')}</p><audio id="sync-audio" controls ${c.audioUrl ? `src="${c.audioUrl}"` : ''}></audio><div class="time-readout" id="sync-time">00:00.0</div><div class="sync-controls"><button class="btn btn-primary" data-action="mark-line">현재 시간에 줄 표시</button><button class="btn btn-secondary" data-action="reset-sync">싱크 초기화</button></div></div><div class="notice" style="margin-top:14px">학생은 전체 음악을 먼저 들은 뒤, 아래에서 지정한 한 가사를 맞힙니다.</div></div><div><h3>가사 타임라인</h3><div class="lyric-lines">${c.lyrics.map((line, i) => `<div class="lyric-row ${i === c.quizLineIndex ? 'active' : ''}" data-index="${i}"><input class="line-start" type="number" step="0.1" value="${line.start ?? 0}" /><span>${escapeHTML(line.text)}</span><button class="btn btn-ghost quiz-line-button" data-index="${i}">${i === c.quizLineIndex ? '퀴즈 지정됨' : '퀴즈 지정'}</button></div>`).join('')}</div></div></div><div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 미리보기</button><button class="btn btn-primary" data-action="save-content">싱크 저장하기</button></div></section>`;
  bindActions(); const audio = document.querySelector('#sync-audio'); audio.addEventListener('timeupdate', () => { document.querySelector('#sync-time').textContent = formatTime(audio.currentTime); highlightLyric(audio.currentTime); });
  document.querySelectorAll('.line-start').forEach(input => input.addEventListener('change', e => { const i = Number(e.target.closest('.lyric-row').dataset.index); c.lyrics[i].start = Number(e.target.value); c.lyrics[i].end = c.lyrics[i + 1]?.start || c.lyrics[i].start + 4; }));
  document.querySelectorAll('.stage-button').forEach(button => button.addEventListener('click', () => { state.quizStage = Number(button.dataset.stage); renderSync(); })); document.querySelectorAll('.stage-visibility').forEach(select => select.addEventListener('change', () => { const stage = Number(select.dataset.stage); const stages = getQuizStages(c).filter(item => item.stage !== stage); stages.push({ stage, lyricIndex: getStageConfig(c, stage).lyricIndex, visibility: select.value }); c.quizStages = stages.sort((a, b) => a.stage - b.stage); }));
  document.querySelectorAll('.quiz-line-button').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.index); c.quizStages = getQuizStages(c).filter(item => item.stage !== state.quizStage); c.quizStages.push({ stage: state.quizStage, lyricIndex: index }); c.quizLineIndex = c.quizStages.find(item => item.stage === 1)?.lyricIndex ?? index; state.quizStage = state.quizStage; renderSync(); }));
  document.querySelectorAll('.instrumental-button').forEach(button => button.addEventListener('click', () => addInstrumentalSegment(Number(button.dataset.index)))); document.querySelectorAll('.delete-segment-button').forEach(button => button.addEventListener('click', () => deleteSegment(Number(button.dataset.index))));
}

function highlightLyric(time) { const c = state.teacherContent?.lyrics || []; let index = c.findIndex((line, i) => time >= line.start && time < (c[i + 1]?.start ?? line.end ?? Infinity)); if (index < 0) index = 0; document.querySelectorAll('.lyric-row').forEach((row, i) => row.classList.toggle('active', i === index)); state.quizLineIndex = index; }
function markCurrentLine() { const audio = document.querySelector('#sync-audio'); const row = document.querySelector(`.lyric-row[data-index="${state.quizLineIndex}"]`); if (!audio || !row) return; pushSyncHistory(); row.querySelector('input').value = audio.currentTime.toFixed(1); state.teacherContent.lyrics[state.quizLineIndex].start = audio.currentTime; state.teacherContent.lyrics[state.quizLineIndex].end = state.teacherContent.lyrics[state.quizLineIndex + 1]?.start || audio.currentTime + 4; }
async function saveContent(successMessage = '') {
  if (document.querySelector('#lyrics')) state.teacherContent = getDraft();
  const content = { ...state.teacherContent, savedAt: new Date().toISOString() };
  if (state.pendingFile && window.musicStorage?.isConfigured()) {
    try {
      const safeName = state.pendingFile.name.toLowerCase().replace(/[^a-z0-9가-힣._-]/g, '-');
      const path = `teacher/${Date.now()}-${safeName}`;
      const uploaded = await window.musicStorage.uploadAudio(state.pendingFile, path);
      content.audioPath = uploaded.path;
      content.audioUrl = uploaded.publicUrl;
      content.fileName = state.pendingFile.name;
      state.pendingFile = null;
    } catch (error) {
      alert(error.message || '음원 업로드에 실패했습니다.');
      return;
    }
  } else if (state.pendingFile) {
    content.audioUrl = URL.createObjectURL(state.pendingFile);
    content.fileName = state.pendingFile.name;
  }
  state.teacherContent = content;
  localStorage.setItem('musicnol-content', JSON.stringify(content));
  await window.musicStorage?.upsertClassContent({ ...content, melodyContent: state.melodyContent || undefined });
  alert(successMessage || (window.musicStorage?.isConfigured() ? '음원을 Supabase Storage에 업로드하고 수업 자료를 저장했습니다.' : '현재는 로컬 임시 저장입니다. Supabase 설정 후 Storage 업로드가 활성화됩니다.'));
}

async function getAudioFileForAnalysis() { if (state.pendingFile) return state.pendingFile; const c = state.teacherContent; if (!c?.audioUrl) return null; const response = await fetch(c.audioUrl); if (!response.ok) throw new Error('저장된 음원을 가져오지 못했습니다.'); const blob = await response.blob(); return new File([blob], c.fileName || 'music.mp3', { type: blob.type || 'audio/mpeg' }); }
function startAIAnalysis() { if (document.querySelector('#lyrics')) state.teacherContent = getDraft(); renderSync(); setTimeout(() => analyzeSyncWithAI(), 0); }
async function analyzeSyncWithAI() { const c = state.teacherContent; const analyzeButton = document.querySelector('[data-action="ai-sync"]'); if (analyzeButton) { analyzeButton.disabled = true; analyzeButton.textContent = 'AI 분석 중...'; } const audioFile = await getAudioFileForAnalysis().catch(error => { alert(error.message); return null; }); if (!audioFile) { renderSync(); return alert('먼저 MP3 파일을 등록해주세요.'); } const lyricLines = c.lyrics.filter(line => !line.noLyrics); if (!lyricLines.length) { renderSync(); return alert('분석할 가사 줄이 없습니다.'); } const form = new FormData(); form.append('audio', audioFile); form.append('lyrics', JSON.stringify(lyricLines.map(line => line.text))); try { const response = await fetch('http://localhost:8787/analyze-sync', { method: 'POST', body: form }); if (!response.ok) throw new Error(`AI 분석 서버 오류 (${response.status})`); const result = await response.json(); if (!Array.isArray(result.matches) || !result.matches.length) throw new Error('AI가 가사 구간을 찾지 못했습니다.'); let matchIndex = 0; c.lyrics = c.lyrics.map(line => { if (line.noLyrics) return line; const match = result.matches[matchIndex++]; return match ? { ...line, start: Number(match.start.toFixed(2)), end: Number(match.end.toFixed(2)), aiConfidence: match.confidence } : line; }); const firstLyric = c.lyrics.find(line => !line.noLyrics); if (firstLyric) { c.firstPhraseStart = firstLyric.start; c.firstPhraseEnd = firstLyric.end; } alert('AI가 가사 싱크를 맞췄습니다. 타임라인에서 결과를 확인하고 필요한 부분만 조정해주세요.'); renderSync(); } catch (error) { alert(`${error.message}\n\n로컬 AI 싱크 서버가 http://localhost:8787 에서 실행 중인지 확인해주세요.`); renderSync(); } }

function renderStudentEntry() {
  setAccount('학생 입장');
  app.innerHTML = `<div class="student-layout"><a href="#" class="back" data-action="home">← 홈으로</a><section class="student-hero"><div class="eyebrow" style="color:#b9c9ff">Student entrance</div><h2>내 번호로 입장하기</h2><p>선생님에게 받은 자기 번호를 입력하면 학습 기록과 순위가 저장됩니다.</p></section><section class="quiz-card" style="margin-top:22px"><div class="field"><label for="student-number">학생 번호</label><input id="student-number" class="field-input" inputmode="numeric" maxlength="4" placeholder="예: 12" /></div><div class="notice" style="margin-top:14px">번호는 이름 대신 기록을 구분하기 위한 값입니다. 같은 번호로 다시 입장하면 기존 점수가 업데이트됩니다.</div><div class="actions"><button class="btn btn-primary" data-action="enter-student">학습 시작하기 →</button></div></section><section class="panel" style="margin-top:18px"><h3>현재 순위</h3>${leaderboardHTML()}</section></div>`;
  bindActions(); document.querySelector('#student-number').focus();
}

function leaderboardHTML() {
  const records = getOverallLeaderboard(); if (!records.length) return '<div class="empty">아직 기록이 없어요. 첫 번째 주인공이 되어보세요!</div>';
  return `<div class="record-table"><div class="record-row record-head"><span>전체 순위</span><span>학생 번호</span><span>총점</span></div>${records.map((record, index) => `<div class="record-row ${record.studentNumber === state.studentNumber ? 'mine' : ''}"><strong>${index + 1}</strong><span>${escapeHTML(record.studentNumber)}번 ${record.studentNumber === state.studentNumber ? '<em>나</em>' : ''}</span><strong>${Number(record.score) || 0} pt</strong></div>`).join('')}</div>`;
}

async function enterStudent() {
  const input = document.querySelector('#student-number'); const number = input?.value.trim();
  if (!number || !/^\d+$/.test(number)) return alert('학생 번호를 숫자로 입력해주세요.');
  state.studentNumber = number; state.quizStage = 1; await syncRemoteRecords(); const record = getRecords().find(item => item.studentNumber === number); state.score = record?.score || 0; state.stageScores = record?.stageScores || {}; state.stageHints = record?.stageHints || {}; state.listeningComplete = false; state.wrong = false; state.celebration = false; state.quizResult = ''; state.stageCompleted = false; state.selectedAnswer = ''; state.stageOneAnswer = ''; state.stageOneExpected = ''; state.usedHints = []; state.hintOrder = []; renderStudent();
}

function renderStudent() {
  setAccount('학생 체험 계정'); const c = contentForStudent(); const quizIndex = activeQuizIndex(c); const target = c.lyrics[quizIndex] || c.lyrics[0]; const celebration = ''; const listeningDone = state.listeningComplete;
  app.innerHTML = `<div class="student-layout"><a href="#" class="back" data-action="student-entry">← 학생 번호 변경</a><div class="student-hero"><div class="eyebrow" style="color:#b9c9ff">Student room · ${escapeHTML(state.studentNumber)}번</div><h2>${escapeHTML(c.title)}</h2><p>${escapeHTML(c.artist)} · 학생 학습 화면</p></div>${celebration}<section class="quiz-card" style="margin-top:18px"><div class="eyebrow">${listeningDone ? 'Step 1 · 문제 음악 듣기' : 'Step 1 · 전체 음악 듣기'}</div><h3>${listeningDone ? '이제 문제 음악을 들어보세요.' : '먼저 전체 음악을 들어보세요.'}</h3><p class="small">${listeningDone ? '문제 음악을 들은 뒤 아래 가사 퀴즈에 도전하세요.' : '음악을 충분히 들은 뒤 아래 버튼을 누르면 문제 음악과 가사 퀴즈가 열립니다.'}</p><audio id="student-audio" controls ${c.audioUrl ? `src="${c.audioUrl}"` : ''} style="width:100%;margin-top:10px"></audio><div class="progress" style="margin-top:13px"><span id="student-progress"></span></div><div class="actions"><button class="btn btn-primary" data-action="finish-listening">${listeningDone ? '문제 음악 감상 완료 →' : '전체 음악 감상 완료 →'}</button></div></section><div id="quiz-area" class="${state.listeningComplete ? '' : 'hidden'}"></div><section class="panel" style="margin-top:18px"><div class="section-head"><div><h3>우리 반 순위</h3><p>점수는 학생 번호별로 기록됩니다.</p></div><span class="tag">${getLeaderboard().length}명 기록</span></div>${leaderboardHTML()}</section></div>`;
  bindActions(); const audio = document.querySelector('#student-audio'); audio.addEventListener('timeupdate', () => { document.querySelector('#student-progress').style.width = audio.duration ? `${audio.currentTime / audio.duration * 100}%` : '0%'; const lines = c.lyrics; const index = lines.findIndex((line, i) => audio.currentTime >= line.start && audio.currentTime < (lines[i + 1]?.start ?? line.end ?? Infinity)); const current = index < 0 ? lines[0] : lines[index]; const next = lines[(index < 0 ? 0 : index) + 1]; document.querySelector('#student-progress').title = current?.noLyrics ? '♪ 간주 중' : (current?.text || ''); }); if (state.listeningComplete) renderQuizArea(c, target);
}

function renderQuizArea(c, target) {
  const area = document.querySelector('#quiz-area'); if (!area) return;
  const visibility = stageVisibility(c); const quizIndex = activeQuizIndex(c);
  const hints = state.hintOrder.map(type => `<button class="btn btn-ghost hint-button" data-hint="${type}">${type === 'space' ? '1. 띄어쓰기 보기' : type === 'initial' ? '2. 초성 보기' : '3. 0.75배속으로 듣기'}</button>`).join('');
  const hintResult = state.usedHints.map(type => `<div class="notice hint-result">${type === 'space' ? `띄어쓰기 힌트: <strong>${escapeHTML(target.text)}</strong>` : type === 'initial' ? `초성 힌트: <strong>${escapeHTML(getInitials(target.text))}</strong>` : '느린 재생 힌트: 아래 음악을 0.75배속으로 재생합니다.'}</div>`).join('');
  const stageButtons = [1, 2, 3].map(stage => `<button class="btn ${state.quizStage === stage ? 'btn-primary' : 'btn-secondary'} student-stage-button" data-stage="${stage}">${stage}단계</button>`).join('');
  const lyricBoard = c.lyrics.map((line, index) => { const visible = visibility === 'hide-question' && index !== quizIndex; const text = line.noLyrics ? '♪ 간주 중' : visible ? line.text : '？ ？ ？'; return `<div class="student-lyric-line ${index === quizIndex ? 'question-line' : ''}">${escapeHTML(text)}</div>`; }).join('');
  area.innerHTML = `<section class="lyric-stage"><div><div class="eyebrow" style="color:#b9c9ff">Step 2 · 가사 맞히기</div><div class="current">교사가 지정한 가사를 맞혀보세요</div><div class="next">한 글자를 맞힐 때마다 3점을 받아요.</div></div></section><section class="quiz-card"><div class="stage-tabs"><strong>학습 단계</strong>${stageButtons}</div><div class="student-lyric-board"><div class="small">${visibility === 'hide-all' ? '이번 단계는 가사를 보지 않고 문제를 풀어요.' : '문제 구간만 가려져 있어요.'}</div>${lyricBoard}</div><h3>가사 입력</h3><input id="lyric-answer" class="field-input" placeholder="들었던 가사를 입력하세요" value="${escapeHTML(state.selectedAnswer)}" /><div class="actions"><button class="btn btn-primary" data-action="submit-lyric">정답 제출</button></div>${state.wrong ? `<div class="notice" style="margin-top:15px"><strong>랜덤 힌트</strong> · 아래 힌트 중 하나를 선택하세요.</div><div class="hero-actions">${hints}</div>${hintResult}` : ''}</section><div class="score-card"><div><strong>나의 점수</strong><div class="small">맞힌 글자마다 3점이 기록됩니다.</div></div><span class="score">${state.score} pt</span></div>`;
  area.querySelector('.stage-tabs')?.remove();
  bindActions(); document.querySelector('#lyric-answer').addEventListener('input', e => state.selectedAnswer = e.target.value);
  document.querySelectorAll('.hint-button').forEach(b => b.addEventListener('click', () => useHint(b.dataset.hint, c)));
  document.querySelectorAll('.student-stage-button').forEach(b => b.addEventListener('click', () => { state.quizStage = Number(b.dataset.stage); state.selectedAnswer = ''; state.wrong = false; state.usedHints = []; state.hintOrder = []; renderStudent(); }));
}
function getInitials(text) { return [...text].map(char => { const code = char.charCodeAt(0) - 0xac00; if (code < 0 || code > 11171) return char === ' ' ? ' ' : char; return String.fromCharCode(0x1100 + Math.floor(code / 588)); }).join(''); }
function finishListening() { state.listeningComplete = true; state.wrong = false; state.selectedAnswer = ''; state.usedHints = []; state.hintOrder = []; renderStudent(); }
function submitLyric() { const c = contentForStudent(); const target = c.lyrics[activeQuizIndex(c)] || c.lyrics[0]; const expected = (target.blankText || target.text).replace(/\s/g, ''); const answer = state.selectedAnswer.replace(/\s/g, ''); if (!answer) return alert('가사를 입력해주세요.'); const correctCharacters = [...expected].reduce((score, character, index) => score + (answer[index] === character ? 1 : 0), 0); const stageScore = correctCharacters * 3; state.stageScores[state.quizStage] = stageScore; state.stageHints[state.quizStage] = 0; state.score = Object.values(state.stageScores).reduce((sum, value) => sum + value, 0); saveRecord(); state.wrong = false; state.stageCompleted = true; state.quizResult = answer === expected ? 'success' : 'miss'; state.celebration = true; renderStudent(); }
function useHint(type, c) { if (state.usedHints.includes(type)) return; state.usedHints.push(type); if (type === 'slow') { const audio = document.querySelector('#student-audio'); if (audio) { audio.playbackRate = 0.75; audio.play().catch(() => {}); } } renderQuizArea(c, c.lyrics[activeQuizIndex(c)] || c.lyrics[0]); }

function bindActions() { document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', e => { e.preventDefault(); const a = button.dataset.action; if (a === 'home') goHome(); if (a === 'teacher') renderTeacher(); if (a === 'student') renderStudentEntry(); if (a === 'student-entry') renderStudentEntry(); if (a === 'melody-change') renderMelodyChange(); if (a === 'melody-teacher') renderMelodyTeacher(); if (a === 'melody-student') renderMelodyStudentEntry(); if (a === 'start-melody-game') { const number = document.querySelector('#melody-student-number')?.value.trim(); if (!number || !/^\d+$/.test(number)) return alert('학생 번호를 숫자로 입력해주세요.'); state.melodyStudentNumber = number; state.melodyStartedAt = 0; state.melodyElapsed = 0; state.melodyResult = ''; renderMelodyGame(); } if (a === 'save-melody') saveMelodyContent(); if (a === 'submit-melody-answer') submitMelodyAnswer(); if (a === 'enter-student') enterStudent(); if (a === 'to-sync') renderSync(); if (a === 'mark-line') markCurrentLine(); if (a === 'set-first-start') setFirstPhrasePoint('start'); if (a === 'set-first-end') setFirstPhrasePoint('end'); if (a === 'apply-first-seconds') applyFirstPhraseSeconds(); if (a === 'apply-intro-seconds') applyIntroSeconds(); if (a === 'auto-sync') autoSyncLyrics(); if (a === 'ai-sync') analyzeSyncWithAI(); if (a === 'ai-analyze') startAIAnalysis(); if (a === 'add-intro') addIntroSegment(); if (a === 'undo-sync') undoSync(); if (a === 'reset-sync') { pushSyncHistory(); state.teacherContent.lyrics.forEach((line, i) => { line.start = i * 4; line.end = i * 4 + 4; }); renderSync(); } if (a === 'save-content') saveContent(); if (a === 'finish-listening') finishListening(); if (a === 'submit-lyric') submitLyric(); })); if (document.querySelector('.sync-setup') && !document.querySelector('[data-action="add-intro"]')) { document.querySelector('.sync-setup').insertAdjacentHTML('beforeend', '<button class="btn btn-secondary" data-action="add-intro">첫 가사 앞에 전주 추가</button><button class="btn btn-secondary" data-action="undo-sync">되돌리기</button>'); document.querySelector('[data-action="add-intro"]').addEventListener('click', addIntroSegment); document.querySelector('[data-action="undo-sync"]').addEventListener('click', undoSync); } }

function setFirstPhrasePoint(point) { const audio = document.querySelector('#sync-audio'); if (!audio) return; pushSyncHistory(); state.teacherContent.firstPhraseStart = point === 'start' ? audio.currentTime : (state.teacherContent.firstPhraseStart ?? 0); state.teacherContent.firstPhraseEnd = point === 'end' ? audio.currentTime : (state.teacherContent.firstPhraseEnd ?? 4); renderSync(); }
function applyFirstPhraseSeconds() { const start = Number(document.querySelector('#first-start-seconds')?.value); const end = Number(document.querySelector('#first-end-seconds')?.value); if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return alert('첫 가사 시작과 프레이즈 끝을 올바른 초 단위로 입력해주세요.'); pushSyncHistory(); state.teacherContent.firstPhraseStart = start; state.teacherContent.firstPhraseEnd = end; renderSync(); }
function applyIntroSeconds() { const start = Number(document.querySelector('#intro-start-seconds')?.value); const end = Number(document.querySelector('#intro-end-seconds')?.value); if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return alert('전주 시작과 끝을 올바른 초 단위로 입력해주세요.'); pushSyncHistory(); state.teacherContent.introStart = start; state.teacherContent.introEnd = end; if (state.teacherContent.lyrics[0]?.intro) { state.teacherContent.lyrics[0].start = start; state.teacherContent.lyrics[0].end = end; } renderSync(); }
function autoSyncLyrics() { const c = state.teacherContent; let currentStart = Number(c.firstPhraseStart); let phraseLength = Number(c.firstPhraseEnd) - currentStart; if (!Number.isFinite(phraseLength) || phraseLength <= 0) return alert('첫 프레이즈의 시작과 끝을 먼저 지정해주세요.'); pushSyncHistory(); c.lyrics.forEach(line => { if (line.restart) { const restartStart = Number(line.start); const restartEnd = Number(line.end); if (Number.isFinite(restartStart) && Number.isFinite(restartEnd) && restartEnd > restartStart) { currentStart = restartStart; phraseLength = restartEnd - restartStart; } return; } if (line.noLyrics) { currentStart = Math.max(currentStart, Number(line.end) || currentStart); return; } line.start = Number(currentStart.toFixed(2)); line.end = Number((currentStart + phraseLength).toFixed(2)); currentStart += phraseLength; }); renderSync(); }
function addInstrumentalSegment(index) { const c = state.teacherContent; const source = c.lyrics[index]; const start = source?.end ?? (source?.start || 0) + 4; pushSyncHistory(); c.lyrics.splice(index + 1, 0, { text: '♪ 간주 / 가사 없음', noLyrics: true, start, end: start + 4 }); if (c.quizLineIndex > index) c.quizLineIndex += 1; c.quizStages = getQuizStages(c).map(item => ({ ...item, lyricIndex: item.lyricIndex > index ? item.lyricIndex + 1 : item.lyricIndex })); renderSync(); }
function addRestartSegment(index) { const c = state.teacherContent; const source = c.lyrics[index]; const start = source?.end ?? (source?.start || 0) + 4; pushSyncHistory(); c.lyrics.splice(index + 1, 0, { text: '↻ 박자 다시 시작', noLyrics: true, restart: true, start, end: start + 4 }); if (c.quizLineIndex > index) c.quizLineIndex += 1; c.quizStages = getQuizStages(c).map(item => ({ ...item, lyricIndex: item.lyricIndex > index ? item.lyricIndex + 1 : item.lyricIndex })); renderSync(); }
function addIntroSegment() { const c = state.teacherContent; const start = Number(c.introStart ?? 0); const end = Number(c.introEnd ?? c.firstPhraseStart); if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return alert('전주 시작과 끝 시간을 먼저 지정해주세요.'); pushSyncHistory(); if (c.lyrics[0]?.noLyrics && c.lyrics[0].intro) { c.lyrics[0].start = start; c.lyrics[0].end = end; return renderSync(); } c.lyrics.unshift({ text: '♪ 전주 / 가사 없음', noLyrics: true, intro: true, start, end }); c.quizLineIndex = (c.quizLineIndex ?? 0) + 1; c.quizStages = getQuizStages(c).map(item => ({ ...item, lyricIndex: item.lyricIndex + 1 })); renderSync(); }
function deleteSegment(index) { const c = state.teacherContent; if (!c.lyrics[index]?.noLyrics) return; pushSyncHistory(); c.lyrics.splice(index, 1); c.quizStages = getQuizStages(c).map(item => ({ ...item, lyricIndex: item.lyricIndex > index ? item.lyricIndex - 1 : item.lyricIndex })); c.quizLineIndex = Math.max(0, (c.quizLineIndex ?? 0) - (c.quizLineIndex > index ? 1 : 0)); renderSync(); }
function timelineRowHTML(c, line, i) { return `<div class="lyric-row ${i === activeQuizIndex(c) ? 'active' : ''} ${line.noLyrics ? 'no-lyrics' : ''} ${line.restart ? 'restart-row' : ''}" data-index="${i}"><input class="line-start" type="number" step="0.1" value="${line.start ?? 0}" />${line.restart ? `<input class="restart-end" type="number" step="0.1" value="${line.end ?? 0}" />` : ''}<span>${escapeHTML(line.text)}</span><button class="btn btn-ghost quiz-line-button" data-index="${i}" ${line.noLyrics ? 'disabled' : ''}>${line.noLyrics ? (line.restart ? '박자 기준점' : '가사 없음') : (i === activeQuizIndex(c) ? `${state.quizStage}단계 지정됨` : `${state.quizStage}단계 지정`)}</button>${line.noLyrics ? `<button class="btn btn-danger delete-segment-button" data-index="${i}">구간 삭제</button>` : `<button class="btn btn-secondary instrumental-button" data-index="${i}">뒤에 간주 추가</button><button class="btn btn-secondary restart-button" data-index="${i}">박자 재시작</button>`}</div>`; }
function timelineSetsHTML(c) { const sets = [[]]; c.lyrics.forEach((line, index) => { if (line.restart && sets[sets.length - 1].length) sets.push([]); sets[sets.length - 1].push({ line, index }); }); return sets.map((set, setIndex) => `<section class="lyric-set"><div class="lyric-set-header"><strong>${setIndex + 1}세트</strong><span>${setIndex === 0 ? '첫 프레이즈 기준' : '박자 다시 시작 이후'}</span></div>${set.map(item => timelineRowHTML(c, item.line, item.index)).join('')}</section>`).join(''); }

function renderSync() {
  if (document.querySelector('#lyrics')) state.teacherContent = getDraft(); const c = state.teacherContent; c.quizStages ??= [{ stage: 1, lyricIndex: c.quizLineIndex ?? 0 }]; c.firstPhraseStart ??= c.lyrics.find(line => !line.noLyrics)?.start || 0; c.firstPhraseEnd ??= c.lyrics.find(line => !line.noLyrics)?.end || c.firstPhraseStart + 4; c.introStart ??= c.lyrics[0]?.intro ? c.lyrics[0].start : 0; c.introEnd ??= c.lyrics[0]?.intro ? c.lyrics[0].end : c.firstPhraseStart;
  const phraseLength = Math.max(0, c.firstPhraseEnd - c.firstPhraseStart);
  app.innerHTML = `<a href="#" class="back" data-action="teacher">← 음악 등록으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio / 02</div><h2>가사 싱크와 자동 배치</h2><p>AI 분석 결과를 확인하고 시간 입력칸에서 필요한 부분만 미세 조정합니다.</p></div><span class="tag">${c.lyrics.length}줄 등록됨</span></div><section class="panel"><div class="stage-tabs"><strong>문제 단계</strong>${[1,2,3].map(stage => `<button class="btn ${state.quizStage === stage ? 'btn-primary' : 'btn-secondary'} stage-button" data-stage="${stage}">${stage}단계</button>`).join('')}<span class="small">${state.quizStage}단계 문제 설정</span><select class="stage-visibility" data-stage="${state.quizStage}"><option value="hide-all" ${stageVisibility(c) === 'hide-all' ? 'selected' : ''}>전체 가사 숨김</option><option value="hide-question" ${stageVisibility(c) === 'hide-question' ? 'selected' : ''}>문제 부분만 숨김</option></select></div><div class="sync-layout"><div><div class="audio-box"><h3>${escapeHTML(c.title)}</h3><p class="small">${escapeHTML(c.fileName || '음원 미선택 · 데모 타이밍으로 미리보기')}</p><audio id="sync-audio" controls ${c.audioUrl ? `src="${c.audioUrl}"` : ''}></audio><div class="time-readout" id="sync-time">00:00.0</div><div class="notice sync-help">AI 분석 후 아래 시간 입력칸에서 앞뒤 시간을 조금씩 조정할 수 있습니다.</div><div class="intro-setup sync-setup"><div><span>전주 시작 (초)</span><input id="intro-start-seconds" type="number" min="0" step="0.1" value="${Number(c.introStart).toFixed(1)}" /></div><div><span>전주 끝 (초)</span><input id="intro-end-seconds" type="number" min="0" step="0.1" value="${Number(c.introEnd).toFixed(1)}" /></div><button class="btn btn-secondary" data-action="apply-intro-seconds">전주 시간 적용</button></div><div class="sync-setup"><div><span>첫 가사 시작 (초)</span><input id="first-start-seconds" type="number" min="0" step="0.1" value="${Number(c.firstPhraseStart).toFixed(1)}" /></div><div><span>첫 프레이즈 끝 (초)</span><input id="first-end-seconds" type="number" min="0" step="0.1" value="${Number(c.firstPhraseEnd).toFixed(1)}" /></div><button class="btn btn-secondary" data-action="apply-first-seconds">가사 시간 적용</button></div></div><div class="notice" style="margin-top:14px">먼저 간주가 끝나는 순간에 <strong>첫 가사 시작</strong>을 누르고, 첫 가사가 끝나는 순간에 <strong>첫 프레이즈 끝</strong>을 누르세요. 그 후 자동 배치를 실행합니다.</div></div><div><h3>가사 타임라인</h3><div class="lyric-lines">${timelineSetsHTML(c)}</div></div></div><div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 미리보기</button><button class="btn btn-primary" data-action="save-content">싱크 저장하기</button></div></section>`;
  bindActions(); const audio = document.querySelector('#sync-audio'); audio.addEventListener('timeupdate', () => { document.querySelector('#sync-time').textContent = formatTime(audio.currentTime); highlightLyric(audio.currentTime); });
  document.querySelectorAll('.line-start').forEach(input => input.addEventListener('change', e => { const i = Number(e.target.closest('.lyric-row').dataset.index); pushSyncHistory(); c.lyrics[i].start = Number(e.target.value); if (c.lyrics[i].restart) return; c.lyrics[i].end = c.lyrics[i + 1]?.start || c.lyrics[i].start + phraseLength; }));
  document.querySelectorAll('.quiz-line-button').forEach(button => button.addEventListener('click', () => { c.quizLineIndex = Number(button.dataset.index); state.quizLineIndex = c.quizLineIndex; renderSync(); }));
  document.querySelectorAll('.instrumental-button').forEach(button => button.addEventListener('click', () => addInstrumentalSegment(Number(button.dataset.index))));
  document.querySelectorAll('.restart-button').forEach(button => button.addEventListener('click', () => addRestartSegment(Number(button.dataset.index))));
  document.querySelectorAll('.restart-end').forEach(input => input.addEventListener('change', e => { const i = Number(e.target.closest('.lyric-row').dataset.index); pushSyncHistory(); c.lyrics[i].end = Number(e.target.value); }));
  document.querySelectorAll('.delete-segment-button').forEach(button => button.addEventListener('click', () => deleteSegment(Number(button.dataset.index))));
}
async function saveTeacherContent() {
  const content = { ...(state.teacherContent || {}) };
  const upload = async (file, kind) => {
    if (!file) return null;
    if (window.musicStorage?.isConfigured()) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9가-힣._-]/g, '-');
      const uploaded = await window.musicStorage.uploadAudio(file, `teacher/${kind}-${Date.now()}-${safeName}`);
      return { path: uploaded.path, url: uploaded.publicUrl, name: file.name };
    }
    return { path: '', url: URL.createObjectURL(file), name: file.name };
  };
  try {
    const full = await upload(state.pendingFullFile, 'full');
    const quiz = await upload(state.pendingQuizFile, 'quiz');
    if (full) { content.fullAudioPath = full.path; content.fullAudioUrl = full.url; content.fullFileName = full.name; }
    if (quiz) { content.quizAudioPath = quiz.path; content.quizAudioUrl = quiz.url; content.quizFileName = quiz.name; }
    content.audioUrl = content.quizAudioUrl || content.fullAudioUrl || content.audioUrl || '';
    content.fileName = content.quizFileName || content.fullFileName || content.fileName || '';
    content.savedAt = new Date().toISOString();
    state.teacherContent = content;
    state.pendingFullFile = null;
    state.pendingQuizFile = null;
    localStorage.setItem('musicnol-content', JSON.stringify(content));
    await window.musicStorage?.upsertClassContent({ ...content, melodyContent: state.melodyContent || undefined });
    alert(window.musicStorage?.isConfigured() ? '전체 음원과 문제 출제 음원을 Supabase Storage에 저장했습니다.' : '현재는 브라우저 임시 저장입니다.');
  } catch (error) {
    alert(error.message || '음원 저장에 실패했습니다.');
  }
}

function renderTeacher01() {
  setAccount('교사 체험 계정');
  const c = state.teacherContent || {};
  app.innerHTML = `<a href="#" class="back" data-action="home">← 홈으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio / 01</div><h2>음악 콘텐츠 만들기</h2><p>전체 감상용 음원과 문제 출제용 음원을 따로 등록합니다.</p></div><span class="tag">교사 전용</span></div><div class="dashboard-grid"><section class="panel"><h3>01. 음원 파일 등록</h3><div class="form-grid"><div class="field full"><label>전체 감상용 음원</label><div class="upload"><div class="album">♫</div><div class="upload-copy"><strong id="full-file-name">${escapeHTML(c.fullFileName || c.fileName || '전체 음원 파일을 선택하세요')}</strong><span>학생이 처음 전체 음악을 감상할 때 사용합니다.</span></div><label class="btn btn-ghost" for="full-audio-file">파일 선택</label><input id="full-audio-file" type="file" accept="audio/*" /></div></div><div class="field full"><label>문제 출제용 음원</label><div class="upload"><div class="album">?</div><div class="upload-copy"><strong id="quiz-file-name">${escapeHTML(c.quizFileName || '문제 출제용 음원 파일을 선택하세요')}</strong><span>가사 문제를 풀 때 재생할 음원입니다.</span></div><label class="btn btn-ghost" for="quiz-audio-file">파일 선택</label><input id="quiz-audio-file" type="file" accept="audio/*" /></div></div><div class="field"><label for="title">곡 제목</label><input id="title" value="${escapeHTML(c.title || '')}" placeholder="예: 동해물과 백두산이" /></div><div class="field"><label for="artist">가수/출처</label><input id="artist" value="${escapeHTML(c.artist || '')}" placeholder="예: 놀라운 음악 교실" /></div></div></section><aside class="panel"><h3>수업 흐름</h3><div class="list-item"><div><strong>1. 전체 음악 듣기</strong><p>전체 감상용 음원을 끝까지 듣습니다.</p></div><span class="tag">01</span></div><div class="list-item"><div><strong>2. 가사 문제 풀기</strong><p>문제 출제용 음원과 빈칸 가사를 사용합니다.</p></div><span class="tag">02</span></div></aside></div><div class="actions"><button class="btn btn-secondary" id="save-teacher-content">음원 저장하기</button><button class="btn btn-primary" data-action="to-sync">문제 출제 화면으로 →</button></div>`;
  bindActions();
  const nextButton = document.querySelector('[data-action="to-sync"]');
  const cleanNextButton = nextButton.cloneNode(true);
  nextButton.replaceWith(cleanNextButton);
  cleanNextButton.addEventListener('click', () => { state.teacherContent = { ...(state.teacherContent || {}), title: document.querySelector('#title').value.trim() || '새 음악', artist: document.querySelector('#artist').value.trim() || '직접 만든 수업 자료', lyrics: state.teacherContent?.lyrics || [] }; renderSync(); });
  document.querySelector('#full-audio-file').addEventListener('change', e => { const file = e.target.files[0]; if (file) { state.pendingFullFile = file; document.querySelector('#full-file-name').textContent = file.name; } });
  document.querySelector('#quiz-audio-file').addEventListener('change', e => { const file = e.target.files[0]; if (file) { state.pendingQuizFile = file; document.querySelector('#quiz-file-name').textContent = file.name; } });
  document.querySelector('#save-teacher-content').addEventListener('click', () => { const previous = state.teacherContent || {}; state.teacherContent = { ...previous, title: document.querySelector('#title').value.trim() || '새 음악', artist: document.querySelector('#artist').value.trim() || '직접 만든 수업 자료' }; saveTeacherContent(); });
}

function blankedLyric(text, blankText) {
  if (!blankText) return text;
  const index = text.indexOf(blankText);
  if (index < 0) return text;
  return `${text.slice(0, index)}${'＿'.repeat(Math.max(4, blankText.length))}${text.slice(index + blankText.length)}`;
}

function stageTwoMaskedLyric(text, blankText, firstAnswer) {
  if (!blankText) return text;
  const index = text.indexOf(blankText); if (index < 0) return text;
  const normalizedAnswer = (firstAnswer || '').replace(/\s/g, ''); let answerIndex = 0;
  const masked = [...blankText].map(character => {
    if (/\s/.test(character)) return character;
    const result = normalizedAnswer[answerIndex] === character ? character : '*'; answerIndex += 1; return result;
  }).join('');
  return `${text.slice(0, index)}${masked}${text.slice(index + blankText.length)}`;
}

function stageTwoExpected(firstExpected, firstAnswer) {
  const expected = (firstExpected || '').replace(/\s/g, '');
  const answer = (firstAnswer || '').replace(/\s/g, '');
  return [...expected].filter((character, index) => answer[index] !== character).join('');
}

function renderQuizAreaWithBlanks(c, target) {
  const area = document.querySelector('#quiz-area'); if (!area) return;
  const visibility = stageVisibility(c); const quizIndex = activeQuizIndex(c);
  const answer = target.blankText || target.text;
  const isStageTwo = state.quizStage === 2;
  const stageTwoAnswer = isStageTwo ? stageTwoExpected(state.stageOneExpected, state.stageOneAnswer) : '';
  const lyricBoard = c.lyrics.map((line, index) => { const isQuestion = index === quizIndex; let text = line.noLyrics ? '♪ 간주 중' : isQuestion ? (isStageTwo ? stageTwoMaskedLyric(line.text, line.blankText, state.stageOneAnswer) : blankedLyric(line.text, line.blankText)) : visibility === 'hide-all' ? '？ ？ ？' : line.text; return `<div class="student-lyric-line ${isQuestion ? 'question-line' : ''}">${escapeHTML(text)}</div>`; }).join('');
  area.innerHTML = `<section class="lyric-stage"><div><div class="eyebrow" style="color:#b9c9ff">Step ${isStageTwo ? 3 : 2} · 가사 맞히기</div><div class="current">${isStageTwo ? '별표(*)로 표시된 글자만 순서대로 다시 입력해보세요' : '교사가 지정한 빈칸 가사를 맞혀보세요'}</div><div class="next">${isStageTwo ? '맞힌 글자마다 2점을 추가로 받아요.' : '한 글자를 맞힐 때마다 3점을 받아요.'}</div></div></section><section class="quiz-card"><div class="student-lyric-board"><div class="small">${isStageTwo ? '1단계에서 맞힌 글자는 보이고, 틀린 글자는 *로 표시됩니다.' : '밑줄이 문제로 비워진 가사 부분입니다.'}</div>${lyricBoard}</div><h3>${isStageTwo ? '틀린 글자만 다시 입력' : '비워진 가사 입력'}</h3><input id="lyric-answer" class="field-input" placeholder="${isStageTwo ? '별표 글자만 순서대로 입력하세요' : '들었던 가사를 입력하세요'}" value="${escapeHTML(state.selectedAnswer)}" /><div class="actions"><button class="btn btn-primary" data-action="submit-lyric">정답 제출</button></div></section><div class="score-card"><div><strong>나의 점수</strong><div class="small">${isStageTwo ? `2단계는 맞힌 글자마다 2점이 추가됩니다. (${stageTwoAnswer.length}글자)` : '1단계는 맞힌 글자마다 3점입니다.'}</div></div><span class="score">${state.score} pt</span></div>`;
  bindActions(); document.querySelector('#lyric-answer').addEventListener('input', e => state.selectedAnswer = e.target.value);
}

function submitLyricWithBlank() {
  if (state.stageCompleted) return;
  const c = contentForStudent(); const target = c.lyrics[activeQuizIndex(c)] || c.lyrics[0]; const fullExpected = (target.blankText || target.text).replace(/\s/g, ''); const expected = state.quizStage === 2 ? stageTwoExpected(state.stageOneExpected || fullExpected, state.stageOneAnswer) : fullExpected; const answer = state.selectedAnswer.replace(/\s/g, '');
  if (!answer) return alert('가사를 입력해주세요.');
  const correctCharacters = [...expected].reduce((score, character, index) => score + (answer[index] === character ? 1 : 0), 0);
  const allCorrect = answer === expected;
  if (state.quizStage === 1) {
    state.stageOneAnswer = answer;
    state.stageOneExpected = expected;
    state.stageScores[1] = correctCharacters * 3;
    state.stageHints[1] = 0;
  } else {
    state.stageScores[2] = correctCharacters * 2;
    state.stageHints[2] = 0;
  }
  state.score = Object.values(state.stageScores).reduce((sum, value) => sum + value, 0);
  state.stageCompleted = true;
  state.quizResult = allCorrect ? 'success' : 'miss';
  state.celebration = true;
  // 1단계는 제출과 동시에 종료합니다. 오답이어도 힌트/재도전으로 넘어가지 않습니다.
  state.wrong = false;
  saveRecord();
  renderStudent();
}

renderQuizArea = renderQuizAreaWithBlanks;
submitLyric = submitLyricWithBlank;

function renderTeacher02Only() {
  setAccount('교사 체험 계정');
  const c = state.teacherContent || (state.teacherContent = {});
  c.lyrics ||= [];
  app.innerHTML = `<a href="#" class="back" data-action="teacher">← 음악 등록으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio / 02</div><h2>문제 출제 가사 만들기</h2><p>전체 가사를 입력한 뒤, 학생에게 비워서 보여줄 부분을 정합니다.</p></div><span class="tag">문제 출제 전용</span></div><section class="panel problem-lyrics-panel"><div class="problem-audio-note"><strong>문제 출제용 음원</strong><span>${escapeHTML(c.quizFileName || 'Teacher studio 01에서 문제용 음원을 먼저 등록하세요.')}</span></div><h3>문제용 전체 가사</h3><p class="small">한 줄에 한 프레이즈씩 입력하세요.</p><textarea id="lyrics" placeholder="동해물과 백두산이\n마르고 닳도록\n하느님이 보우하사\n우리나라 만세">${escapeHTML(c.lyrics.map(line => line.text).join('\n'))}</textarea><button class="btn btn-secondary" id="build-lyrics">가사 줄 만들기</button><div class="stage-tabs problem-stage-tabs"><strong>문제 단계</strong>${[1,2,3].map(stage => `<button class="btn ${state.quizStage === stage ? 'btn-primary' : 'btn-secondary'} stage-button" data-stage="${stage}">${stage}단계</button>`).join('')}<span class="small">${state.quizStage}단계 문제를 지정합니다.</span></div><div id="problem-lyric-list" class="problem-lyric-list"></div><div class="actions"><button class="btn btn-primary" data-action="save-content">문제 가사 저장하기</button></div></section>`;
  const renderProblemLines = () => {
    const list = document.querySelector('#problem-lyric-list');
    list.innerHTML = c.lyrics.map((line, index) => `<div class="problem-lyric-item"><div class="problem-lyric-top"><span class="line-number">${index + 1}</span><strong>${escapeHTML(line.text)}</strong><button class="btn btn-ghost stage-quiz-button" data-index="${index}">${getStageConfig(c, state.quizStage).lyricIndex === index ? `${state.quizStage}단계 지정됨` : `${state.quizStage}단계 문제로 지정`}</button></div><label>문제로 비울 부분</label><input class="blank-text-input" data-index="${index}" placeholder="예: 마르고 닳도록" value="${escapeHTML(line.blankText || '')}" /><div class="small preview-text">${escapeHTML(blankedLyric(line.text, line.blankText) || line.text)}</div></div>`).join('');
    list.querySelectorAll('.blank-text-input').forEach(input => input.addEventListener('input', e => { c.lyrics[Number(e.target.dataset.index)].blankText = e.target.value.trim(); e.target.nextElementSibling.textContent = blankedLyric(c.lyrics[Number(e.target.dataset.index)].text, e.target.value.trim()) || c.lyrics[Number(e.target.dataset.index)].text; }));
    list.querySelectorAll('.stage-quiz-button').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.index); const stages = getQuizStages(c).filter(item => item.stage !== state.quizStage); stages.push({ stage: state.quizStage, lyricIndex: index, visibility: getStageConfig(c, state.quizStage).visibility }); c.quizStages = stages.sort((a, b) => a.stage - b.stage); c.quizLineIndex = c.quizStages.find(item => item.stage === 1)?.lyricIndex ?? index; renderProblemLines(); }));
  };
  const buildLyrics = () => { const texts = document.querySelector('#lyrics').value.split('\n').map(text => text.trim()).filter(Boolean); c.lyrics = texts.map((text, index) => c.lyrics[index] ? { ...c.lyrics[index], text } : { text, start: index * 4, end: index * 4 + 4 }); renderProblemLines(); };
  document.querySelector('#build-lyrics').addEventListener('click', buildLyrics);
  document.querySelectorAll('.stage-button').forEach(button => button.addEventListener('click', () => { buildLyrics(); state.quizStage = Number(button.dataset.stage); renderSync(); }));
  renderProblemLines(); bindActions();
}

const renderStudentScreen = renderStudent;
renderStudent = function () {
  renderStudentScreen();
  const content = contentForStudent();
  const audio = document.querySelector('#student-audio');
  if (audio) {
    const source = state.listeningComplete ? (content.quizAudioUrl || content.audioUrl) : (content.fullAudioUrl || content.audioUrl);
    if (source && audio.src !== source) { audio.src = source; audio.load(); }
  }
  if (state.stageCompleted) {
    const target = content.lyrics[activeQuizIndex(content)] || content.lyrics[0] || {};
    const expected = (target.blankText || target.text || '').replace(/\s/g, '');
    const pointsPerCharacter = state.quizStage === 1 ? 3 : 2;
    const correctCharacters = Math.floor((state.stageScores[state.quizStage] || 0) / pointsPerCharacter);
    const rank = getOverallLeaderboard().findIndex(record => record.studentNumber === state.studentNumber) + 1;
    document.querySelector('.stage-result-modal')?.remove();
    const modal = document.createElement('div');
    modal.className = `stage-result-modal ${state.quizResult === 'success' ? 'is-success' : 'is-miss'}`;
    const stageLabel = `${state.quizStage}단계`;
    const nextButton = state.quizStage === 1 ? '<button class="btn btn-secondary stage-two-start">다시 도전</button>' : '';
    modal.innerHTML = `<div class="stage-result-dialog"><button class="stage-result-close" aria-label="결과창 닫기">×</button>${state.quizResult === 'success' ? '<div class="confetti" aria-hidden="true">🎉 ✨ 🎊 ✨ 🎉</div>' : ''}<img src="assets/music-classroom-hero.png" alt="음악교실 동물 친구들" /><strong>${stageLabel} 완료!</strong><span>${state.quizResult === 'success' ? '동물 친구들이 폭죽을 터뜨리며 축하해요!' : '동물 친구들이 “화이팅!” 하고 응원해요!'}</span><div class="stage-result-score"><b>${state.stageScores[state.quizStage] || 0}점</b><em>${correctCharacters}글자 정답</em></div><div class="stage-result-rank">현재 우리 반 ${rank}등 · 총 ${state.score}점</div><div class="stage-result-actions">${nextButton}<button class="btn btn-primary stage-result-confirm">확인</button></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.stage-result-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.stage-result-confirm').addEventListener('click', () => modal.remove());
    modal.querySelector('.stage-two-start')?.addEventListener('click', () => { modal.remove(); state.quizStage = 2; state.stageCompleted = false; state.quizResult = ''; state.celebration = false; state.selectedAnswer = ''; renderStudent(); });
    document.querySelector('#lyric-answer')?.setAttribute('disabled', 'disabled');
    document.querySelector('[data-action="submit-lyric"]')?.setAttribute('disabled', 'disabled');
    const quizCard = document.querySelector('.quiz-card');
    if (quizCard && !quizCard.querySelector('.stage-result')) {
      const result = document.createElement('div');
      result.className = 'notice stage-result';
      result.innerHTML = `<strong>${stageLabel} 결과</strong> · ${state.stageScores[state.quizStage] || 0}점 (${correctCharacters}글자 정답)`;
      quizCard.appendChild(result);
    }
  }
};

const renderTeacherScreen = renderTeacher01;
renderTeacher = function () {
  renderTeacherScreen();
  document.querySelector('[data-action="ai-analyze"]')?.remove();
  const back = document.querySelector('.back[data-action="home"]');
  if (back) {
    back.textContent = '← 이전으로';
    back.classList.add('btn', 'btn-secondary');
  }
};

function renderTeacher02Simple() {
  setAccount('교사 체험 계정');
  const c = state.teacherContent || (state.teacherContent = {});
  const existing = c.lyrics?.[0] || {};
  const defaultQuizLyric = '랄랄라 힘차게 달려요 다함께 남북 끝까지 저 산과 들에 인사를 건네며 친구들을 만날거야';
  const savedLyric = c.quizLyric || existing.text || '';
  const lyric = savedLyric === '네가 없는 거리에는' ? defaultQuizLyric : (savedLyric || defaultQuizLyric);
  const blank = c.quizBlank || existing.blankText || '';
  app.innerHTML = `<a href="#" class="back" data-action="teacher">← 음악 등록으로</a><div class="section-head"><div><div class="eyebrow">Teacher studio / 02</div><h2>문제 출제 가사 만들기</h2><p>문제 음원에 해당하는 가사 한 줄과 비워낼 부분을 입력합니다.</p></div><span class="tag">문제 출제 전용</span></div><section class="panel problem-lyrics-panel single-quiz-lyrics"><div class="problem-audio-note"><strong>문제 출제용 음원</strong><span>${escapeHTML(c.quizFileName || 'Teacher studio 01에서 문제용 음원을 먼저 등록하세요.')}</span></div><div class="field full"><label for="lyrics">문제 출제 가사 한 줄</label><textarea id="lyrics" rows="3" placeholder="예: 동해물과 백두산이 마르고 닳도록">${escapeHTML(lyric)}</textarea></div><div class="field full"><label for="quiz-blank">문제로 비울 부분</label><input id="quiz-blank" type="text" placeholder="예: 마르고 닳도록" value="${escapeHTML(blank)}" /><p class="small">입력한 부분이 학생 화면에서 빈칸으로 표시됩니다.</p></div><div class="quiz-preview"><strong>학생 화면 미리보기</strong><span id="quiz-preview-text">${escapeHTML(blankedLyric(lyric, blank) || lyric || '가사를 입력하면 미리보기가 표시됩니다.')}</span></div><div class="actions"><button class="btn btn-primary" id="save-quiz-lyric">문제 가사 저장하기</button></div></section>`;
  const updatePreview = () => { const text = document.querySelector('#lyrics').value.trim(); const hidden = document.querySelector('#quiz-blank').value.trim(); document.querySelector('#quiz-preview-text').textContent = blankedLyric(text, hidden) || text || '가사를 입력하면 미리보기가 표시됩니다.'; };
  document.querySelector('#lyrics').addEventListener('input', updatePreview);
  document.querySelector('#quiz-blank').addEventListener('input', updatePreview);
  document.querySelector('#save-quiz-lyric').addEventListener('click', async () => { const text = document.querySelector('#lyrics').value.trim(); const hidden = document.querySelector('#quiz-blank').value.trim(); if (!text) return alert('문제 출제 가사 한 줄을 입력해주세요.'); if (!hidden || !text.includes(hidden)) return alert('전체 가사 안에 포함된 비울 부분을 입력해주세요.'); c.quizLyric = text; c.quizBlank = hidden; c.lyrics = [{ ...(c.lyrics?.[0] || {}), text, blankText: hidden, start: c.lyrics?.[0]?.start || 0, end: c.lyrics?.[0]?.end || 4 }]; c.quizLineIndex = 0; c.quizStages = [{ stage: 1, lyricIndex: 0 }]; await saveContent('문제 가사가 저장되었습니다.'); });
  bindActions();
}

const renderSyncScreen = renderTeacher02Simple;
renderSync = function () {
  renderSyncScreen();
  const syncHelp = document.querySelector('.sync-help');
  if (syncHelp) syncHelp.textContent = '아래 시간 입력칸에서 앞뒤 시간을 조금씩 조정할 수 있습니다.';
  const content = state.teacherContent || {};
  const syncLayout = document.querySelector('.sync-layout');
  if (syncLayout && !document.querySelector('#lyrics')) {
    const editor = document.createElement('section');
    editor.className = 'panel lyric-editor-panel';
    editor.innerHTML = '<h3>전체 가사 입력</h3><p class="small">한 줄에 한 프레이즈씩 입력한 뒤, 아래 가사 목록에서 비워낼 부분을 적어주세요.</p><textarea id="lyrics" placeholder="동해물과 백두산이\n마르고 닳도록\n하느님이 보우하사\n우리나라 만세"></textarea>';
    editor.querySelector('#lyrics').value = (content.lyrics || []).map(line => line.text).join('\n');
    editor.querySelector('#lyrics').addEventListener('input', e => {
      const lines = e.target.value.split('\n').map(text => text.trim()).filter(Boolean);
      state.teacherContent.lyrics = lines.map((text, index) => state.teacherContent.lyrics?.[index] ? { ...state.teacherContent.lyrics[index], text } : { text, start: index * 4, end: index * 4 + 4 });
    });
    syncLayout.parentNode.insertBefore(editor, syncLayout);
  }
  document.querySelectorAll('.lyric-row').forEach(row => {
    const index = Number(row.dataset.index); const line = state.teacherContent?.lyrics?.[index];
    if (!line || row.querySelector('.blank-text-input')) return;
    const blankEditor = document.createElement('div');
    blankEditor.className = 'blank-text-editor';
    blankEditor.innerHTML = `<label>문제로 비울 부분</label><input class="blank-text-input" type="text" placeholder="예: 마르고 닳도록" value="${escapeHTML(line.blankText || '')}" /><span class="small">빈칸으로 만들 가사를 정확히 입력하세요.</span>`;
    blankEditor.querySelector('input').addEventListener('input', e => { line.blankText = e.target.value.trim(); });
    row.appendChild(blankEditor);
  });
  const problemAudio = document.querySelector('#sync-audio');
  if (problemAudio && (content.quizAudioUrl || content.audioUrl)) { problemAudio.src = content.quizAudioUrl || content.audioUrl; problemAudio.load(); }
  const timeReadout = document.querySelector('#sync-time');
  if (timeReadout && !document.querySelector('.manual-sync-controls')) {
    const controls = document.createElement('div');
    controls.className = 'sync-controls manual-sync-controls';
    controls.innerHTML = '<button class="btn btn-primary" type="button">현재 시점 → 첫 가사 시작</button><button class="btn btn-secondary" type="button">현재 시점 → 첫 프레이즈 끝</button>';
    controls.children[0].addEventListener('click', () => setFirstPhrasePoint('start'));
    controls.children[1].addEventListener('click', () => setFirstPhrasePoint('end'));
    timeReadout.insertAdjacentElement('afterend', controls);
  }
  const phraseSetup = document.querySelectorAll('.sync-setup')[1];
  if (phraseSetup && !phraseSetup.querySelector('[data-action="auto-sync"]')) {
    const autoButton = document.createElement('button');
    autoButton.type = 'button';
    autoButton.className = 'btn btn-ghost';
    autoButton.dataset.action = 'auto-sync';
    autoButton.textContent = '같은 박자로 전체 배치';
    autoButton.addEventListener('click', autoSyncLyrics);
    phraseSetup.appendChild(autoButton);
  }
  document.querySelectorAll('.quiz-line-button:not([disabled])').forEach(button => {
    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);
    replacement.addEventListener('click', () => {
      const index = Number(replacement.dataset.index);
      const content = state.teacherContent;
      const currentStage = state.quizStage;
      const currentConfig = getStageConfig(content, currentStage);
      const stages = getQuizStages(content).filter(item => item.stage !== currentStage);
      stages.push({ stage: currentStage, lyricIndex: index, visibility: currentConfig.visibility });
      content.quizStages = stages.sort((a, b) => a.stage - b.stage);
      content.quizLineIndex = content.quizStages.find(item => item.stage === 1)?.lyricIndex ?? index;
      state.quizLineIndex = index;
      renderSync();
    });
  });
  const audioBox = document.querySelector('.audio-box');
  document.querySelector('[data-action="reset-sync-audio"]')?.remove();
  if (audioBox && !document.querySelector('[data-action="reset-sync-only"]')) {
    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'btn btn-secondary';
    resetButton.dataset.action = 'reset-sync-only';
    resetButton.textContent = '싱크 초기화';
    resetButton.addEventListener('click', () => {
      if (!confirm('가사 싱크 시간을 초기화할까요? 음원 파일은 삭제되지 않습니다.')) return;
      pushSyncHistory();
      state.teacherContent.lyrics.forEach((line, i) => {
        line.start = i * 4;
        line.end = i * 4 + 4;
      });
      renderSync();
    });
    audioBox.appendChild(resetButton);
  }
  const back = document.querySelector('.back[data-action="teacher"]');
  if (back) {
    back.textContent = '← 이전으로';
    back.classList.add('btn', 'btn-secondary');
  }
};

function requireTeacherAccess(openScreen) {
  const password = window.prompt('교사로 시작하려면 교사 비밀번호를 입력하세요.');
  if (password === '1234') {
    openScreen();
  } else if (password !== null) {
    alert('비밀번호가 올바르지 않습니다.');
  }
}
function renderTeacher() { requireTeacherAccess(renderTeacherUnlocked); }
function renderMelodyTeacher() { requireTeacherAccess(renderMelodyTeacherUnlocked); }

document.addEventListener('click', event => {
  if (!event.target.closest('[data-action="submit-melody-answer"]')) return;
  setTimeout(() => {
    if (state.melodyResult !== 'correct' || !state.melodyStudentNumber) return;
    const record = getMelodyRecords().find(item => item.studentNumber === state.melodyStudentNumber);
    if (record) window.musicStorage?.upsertMelodyRecord({ student_number: record.studentNumber, elapsed: Number(record.elapsed), updated_at: record.updatedAt || new Date().toISOString() }).catch(error => console.warn(error));
  }, 0);
});

(async function boot() {
  await syncRemoteContent();
  await syncRemoteMelodyContent();
  renderHome();
})();
