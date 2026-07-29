const app = document.querySelector('#app');
const accountLabel = document.querySelector('#account-label');

const state = {
  role: null,
  teacherContent: JSON.parse(localStorage.getItem('musicnol-content') || 'null'),
  selectedOption: null,
  score: 0,
  currentLyric: 0
};

const demoContent = {
  title: '초록 바다',
  artist: '놀라운 음악 교실',
  lyrics: [
    { text: '초록빛 바다 사이로', start: 0, end: 4 },
    { text: '작은 배가 지나가요', start: 4, end: 8 },
    { text: '두 손을 높이 올리고', start: 8, end: 12 },
    { text: '우리 함께 노래해요', start: 12, end: 16 }
  ],
  question: '이 노래가 표현하는 장소는 어디일까요?',
  options: ['바다', '산속', '도서관', '운동장'],
  answer: '바다'
};

function setAccount(label) { accountLabel.textContent = label; }
function escapeHTML(value = '') { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
function formatTime(seconds) { const value = Number(seconds) || 0; return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toFixed(1).padStart(4, '0')}`; }
function goHome() { state.role = null; setAccount('체험 모드'); renderHome(); }

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow">Music × Play × Learn</div>
        <h1>음악을 듣는 순간,<br /><em>교실이 무대</em>가 됩니다.</h1>
        <p class="hero-copy">교사는 음악과 가사를 직접 준비하고, 학생은 노래를 듣고 따라 부르며 즐겁게 배웁니다. API 없이도 시작할 수 있는 음악 수업용 웹앱 MVP입니다.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-action="teacher">교사로 시작하기</button>
          <button class="btn btn-secondary" data-action="student">학생으로 참여하기</button>
        </div>
      </div>
      <div class="hero-art">
        <div class="music-card">
          <div class="music-card-top"><div class="album">♫</div><div><h3>오늘의 음악</h3><p>초록 바다 · 음악 감상 중</p></div></div>
          <div class="wave">${Array.from({ length: 25 }, (_, i) => `<span style="height:${18 + ((i * 17) % 38)}px"></span>`).join('')}</div>
          <div class="notice">가사가 음악에 맞춰 한 줄씩 나타나요</div>
        </div>
      </div>
    </section>
    <section class="feature-grid">
      <article class="feature"><div class="feature-icon">🎛️</div><h3>교사 음악 스튜디오</h3><p>MP3를 넣고 가사가 나오는 시점을 직접 맞춰보세요.</p></article>
      <article class="feature"><div class="feature-icon">🎧</div><h3>학생 학습 화면</h3><p>음악과 가사를 함께 보며 퀴즈와 감상 활동에 참여합니다.</p></article>
      <article class="feature"><div class="feature-icon">✦</div><h3>API 없이 시작</h3><p>현재 버전은 브라우저 저장소를 사용해 가볍게 체험할 수 있습니다.</p></article>
    </section>`;
  bindActions();
}

function renderTeacher() {
  state.role = 'teacher'; setAccount('교사 체험 계정');
  const content = state.teacherContent || {};
  app.innerHTML = `
    <a href="#" class="back" data-action="home">← 홈으로</a>
    <div class="section-head"><div><div class="eyebrow">Teacher studio</div><h2>음악 콘텐츠 만들기</h2><p>음악을 넣고, 가사가 나오는 순간을 설정해보세요.</p></div><span class="tag">교사 전용</span></div>
    <div class="dashboard-grid">
      <section class="panel">
        <h3>01. 음악과 가사 등록</h3>
        <div class="form-grid">
          <div class="field"><label for="title">곡 제목</label><input id="title" value="${escapeHTML(content.title || '')}" placeholder="예: 초록 바다" /></div>
          <div class="field"><label for="artist">가수/출처</label><input id="artist" value="${escapeHTML(content.artist || '')}" placeholder="예: 놀라운 음악 교실" /></div>
          <div class="field full"><label>MP3 파일</label><div class="upload"><div class="album">♫</div><div class="upload-copy"><strong id="file-name">${escapeHTML(content.fileName || 'MP3 파일을 선택하세요')}</strong><span id="file-meta">브라우저에서만 임시 보관됩니다.</span></div><label class="btn btn-ghost" for="audio-file">파일 선택</label><input id="audio-file" type="file" accept="audio/mpeg,audio/mp3,audio/*" /></div></div>
          <div class="field full"><label for="lyrics">가사 (한 줄에 한 문장)</label><textarea id="lyrics" placeholder="가사를 줄바꿈해서 입력하세요">${escapeHTML((content.lyrics || []).map(line => line.text).join('\n'))}</textarea></div>
        </div>
      </section>
      <aside class="panel"><h3>교사 체크리스트</h3><div class="list-item"><div><strong>음원 파일</strong><p>수업에서 사용할 MP3</p></div><span class="tag">필수</span></div><div class="list-item"><div><strong>가사 문장</strong><p>한 줄에 한 문장씩 입력</p></div><span class="tag">필수</span></div><div class="list-item"><div><strong>가사 싱크</strong><p>다음 단계에서 설정</p></div><span class="tag">다음</span></div><div class="notice" style="margin-top:16px">실제 서비스에서는 교사 계정으로 저장되지만, 현재 MVP는 이 브라우저에만 저장됩니다.</div></aside>
    </div>
    <div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 보기</button><button class="btn btn-primary" data-action="to-sync">가사 싱크 설정 →</button></div>`;
  bindActions();
  document.querySelector('#audio-file').addEventListener('change', event => {
    const file = event.target.files[0]; if (!file) return;
    state.pendingFile = file;
    document.querySelector('#file-name').textContent = file.name;
    document.querySelector('#file-meta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type || 'audio'}`;
  });
}

function getDraftContent() {
  const lines = document.querySelector('#lyrics').value.split('\n').map(text => text.trim()).filter(Boolean);
  const previous = state.teacherContent || {};
  return {
    ...previous,
    title: document.querySelector('#title').value.trim() || '새 음악',
    artist: document.querySelector('#artist').value.trim() || '직접 만든 수업 자료',
    fileName: state.pendingFile?.name || previous.fileName || '',
    audioUrl: state.pendingFile ? URL.createObjectURL(state.pendingFile) : previous.audioUrl || '',
    lyrics: lines.map((text, index) => previous.lyrics?.[index] ? { ...previous.lyrics[index], text } : ({ text, start: index * 4, end: index * 4 + 4 }))
  };
}

function renderSync() {
  state.teacherContent = getDraftContent(); const content = state.teacherContent;
  app.innerHTML = `
    <a href="#" class="back" data-action="teacher">← 음악 등록으로</a>
    <div class="section-head"><div><div class="eyebrow">Teacher studio / 02</div><h2>가사 싱크 설정</h2><p>음악을 재생하면서 각 가사가 시작되는 순간을 표시하세요.</p></div><span class="tag">${content.lyrics.length}줄 등록됨</span></div>
    <section class="panel"><div class="sync-layout"><div><div class="audio-box"><h3>${escapeHTML(content.title)}</h3><p class="small">${escapeHTML(content.fileName || '음원 미선택 · 데모 타이밍으로 미리보기')}</p><audio id="sync-audio" controls ${content.audioUrl ? `src="${content.audioUrl}"` : ''}></audio><div class="time-readout" id="sync-time">00:00.0</div><div class="sync-controls"><button class="btn btn-primary" data-action="mark-line">현재 시간에 줄 표시</button><button class="btn btn-secondary" data-action="reset-sync">싱크 초기화</button></div></div><div class="notice" style="margin-top:14px">음원을 재생하다가 가사 줄을 선택한 뒤 <strong>현재 시간에 줄 표시</strong>를 누르면 시작 시점이 저장됩니다.</div></div><div><h3>가사 타임라인</h3><div class="lyric-lines" id="lyric-lines">${content.lyrics.map((line, index) => `<div class="lyric-row" data-index="${index}"><input class="line-start" type="number" step="0.1" value="${line.start ?? 0}" /><span>${escapeHTML(line.text)}</span><small>${formatTime(line.start)}</small></div>`).join('')}</div></div></div><div class="actions"><button class="btn btn-secondary" data-action="student">학생 화면 미리보기</button><button class="btn btn-primary" data-action="save-content">싱크 저장하기</button></div></section>`;
  bindActions();
  const audio = document.querySelector('#sync-audio');
  audio.addEventListener('timeupdate', () => { document.querySelector('#sync-time').textContent = formatTime(audio.currentTime); highlightLyric(audio.currentTime); });
  document.querySelectorAll('.line-start').forEach(input => input.addEventListener('change', event => { const index = Number(event.target.closest('.lyric-row').dataset.index); content.lyrics[index].start = Number(event.target.value); content.lyrics[index].end = content.lyrics[index + 1]?.start || content.lyrics[index].start + 4; event.target.closest('.lyric-row').querySelector('small').textContent = formatTime(content.lyrics[index].start); }));
}

function highlightLyric(time) { const lyrics = state.teacherContent?.lyrics || []; let index = lyrics.findIndex((line, i) => time >= line.start && time < (lyrics[i + 1]?.start ?? line.end ?? Infinity)); if (index < 0) index = 0; document.querySelectorAll('.lyric-row').forEach((row, i) => row.classList.toggle('active', i === index)); state.currentLyric = index; }

function markCurrentLine() { const audio = document.querySelector('#sync-audio'); const row = document.querySelector(`.lyric-row[data-index="${state.currentLyric}"]`); if (!audio || !row) return; const input = row.querySelector('input'); input.value = audio.currentTime.toFixed(1); state.teacherContent.lyrics[state.currentLyric].start = audio.currentTime; state.teacherContent.lyrics[state.currentLyric].end = state.teacherContent.lyrics[state.currentLyric + 1]?.start || audio.currentTime + 4; row.querySelector('small').textContent = formatTime(audio.currentTime); }

function saveContent() { state.teacherContent = { ...state.teacherContent, savedAt: new Date().toISOString() }; localStorage.setItem('musicnol-content', JSON.stringify(state.teacherContent)); alert('음악과 가사 싱크를 이 브라우저에 저장했습니다.'); }

function renderStudent() {
  state.role = 'student'; setAccount('학생 체험 계정'); const content = state.teacherContent?.lyrics?.length ? state.teacherContent : demoContent;
  app.innerHTML = `<div class="student-layout"><a href="#" class="back" data-action="home">← 홈으로</a><div class="student-hero"><div class="eyebrow" style="color:#b9c9ff">Student room</div><h2>${escapeHTML(content.title || demoContent.title)}</h2><p>${escapeHTML(content.artist || demoContent.artist)} · 학생 학습 화면</p></div><div class="lyric-stage"><div><div class="current" id="current-lyric">${escapeHTML(content.lyrics[0]?.text || '음악을 재생해보세요')}</div><div class="next" id="next-lyric">${escapeHTML(content.lyrics[1]?.text || '')}</div></div></div><div class="student-controls"><audio id="student-audio" controls ${content.audioUrl ? `src="${content.audioUrl}"` : ''}></audio><span class="tag">가사 싱크 ON</span></div><div class="progress"><span id="student-progress"></span></div><section class="quiz-card"><div class="eyebrow">Quick quiz</div><h3>${escapeHTML(content.question || demoContent.question)}</h3><div class="quiz-options">${(content.options || demoContent.options).map(option => `<button class="option" data-option="${escapeHTML(option)}">${escapeHTML(option)}</button>`).join('')}</div><div class="actions"><button class="btn btn-primary" data-action="submit-answer">정답 제출</button></div></section><div class="score-card"><div><strong>나의 점수</strong><div class="small">정답을 맞히면 점수를 얻어요</div></div><span class="score" id="student-score">${state.score} pt</span></div></div>`;
  bindActions();
  const audio = document.querySelector('#student-audio'); audio.addEventListener('timeupdate', () => { const t = audio.currentTime; const lines = content.lyrics; const index = lines.findIndex((line, i) => t >= line.start && t < (lines[i + 1]?.start ?? line.end ?? Infinity)); const current = index < 0 ? lines[0] : lines[index]; document.querySelector('#current-lyric').textContent = current?.text || ''; document.querySelector('#next-lyric').textContent = lines[(index < 0 ? 0 : index) + 1]?.text || ''; document.querySelector('#student-progress').style.width = audio.duration ? `${(t / audio.duration) * 100}%` : '0%'; });
}

function submitAnswer() { const content = state.teacherContent?.lyrics?.length ? state.teacherContent : demoContent; if (!state.selectedOption) return alert('정답을 하나 선택해주세요.'); const correct = state.selectedOption === (content.answer || demoContent.answer); state.score = correct ? state.score + 100 : state.score; document.querySelector('#student-score').textContent = `${state.score} pt`; alert(correct ? '정답이에요! +100점' : `아쉬워요. 정답은 ${content.answer || demoContent.answer}입니다.`); }

function bindActions() { document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); const action = button.dataset.action; if (action === 'home') goHome(); if (action === 'teacher') renderTeacher(); if (action === 'student') renderStudent(); if (action === 'to-sync') renderSync(); if (action === 'mark-line') markCurrentLine(); if (action === 'reset-sync') { state.teacherContent.lyrics.forEach((line, i) => { line.start = i * 4; line.end = i * 4 + 4; }); renderSync(); } if (action === 'save-content') saveContent(); if (action === 'submit-answer') submitAnswer(); })); document.querySelectorAll('.option').forEach(option => option.addEventListener('click', () => { state.selectedOption = option.dataset.option; document.querySelectorAll('.option').forEach(item => item.classList.toggle('selected', item === option)); })); }

renderHome();
