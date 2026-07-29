# 놀라운 음악 교실

교사가 MP3와 가사를 등록하고, 음악 재생 시점에 맞춰 가사 싱크를 설정한 뒤 학생 화면에서 음악과 가사를 함께 학습하는 웹앱 MVP입니다.

## 현재 MVP

- 교사/학생 접근 화면 분리
- 교사 음악·가사 등록 화면
- MP3 파일 선택 및 브라우저 임시 재생
- 가사 줄별 시작 시간 설정
- 가사 싱크 미리보기
- 학생 음악 재생 및 현재 가사 표시
- 간단한 객관식 퀴즈와 점수
- 외부 API 없이 `localStorage` 기반 저장
- 따뜻한 2D 픽셀 음악 교실 히어로 일러스트

## 디자인 방향

초등학생이 편안하게 머물 수 있는 작은 음악 교실을 모티프로 합니다. 크림색 벽과 나무 바닥, 식물과 쿠션, 고양이 피아니스트·곰 지휘자·토끼 바이올리니스트·여우 드러머 캐릭터를 사용해 따뜻한 픽셀 아트 분위기를 냅니다. 외부 게임의 캐릭터나 로고를 복제하지 않고, 오리지널 동물 음악가 캐릭터로 구성합니다.

## 실행

별도 빌드 도구 없이 정적 파일로 실행할 수 있습니다.

```bash
npx serve .
```

또는 `index.html`을 브라우저에서 직접 열어도 됩니다. 실제 MP3 업로드와 계정/다중 학생 실시간 참여는 다음 단계에서 Supabase Auth, Storage, Realtime을 연결합니다.

## Supabase Storage 연결

1. Supabase Dashboard에서 `music-files` 버킷을 만듭니다. 파일 업로드는 버킷이 먼저 존재해야 합니다.
2. `supabase-config.example.js`를 `supabase-config.js`로 복사합니다.
3. `url`과 `anonKey`를 Supabase 프로젝트 설정의 값으로 교체합니다.
4. `supabase-config.js`는 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다.
5. 교사 화면에서 MP3를 선택하고 가사 싱크 저장을 누르면 `teacher/날짜-파일명.mp3` 경로로 업로드됩니다.

현재 구현은 간단한 MVP를 위해 Storage 버킷의 공개 재생 URL을 사용합니다. 실제 학생 수업에서 음원을 보호하려면 버킷을 비공개로 만들고, 교사·학생 로그인과 Storage RLS 정책 및 signed URL을 추가해야 합니다.
# AI 자동 싱크 서버

교사 화면의 `AI 자동 싱크 맞추기` 버튼은 로컬 Whisper 서버를 사용합니다. 웹앱과 별도로 한 번 실행해두면 MP3와 입력 가사를 분석해 가사 줄별 시작·끝 시간을 반환합니다.

PowerShell에서 프로젝트 폴더를 연 뒤 실행하세요.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-ai-sync.txt
uvicorn ai-sync-server:app --host 0.0.0.0 --port 8787
```

처음 실행할 때 Whisper `small` 모델을 내려받습니다. 이후 교사 화면에서 MP3와 가사를 등록하고 `AI 자동 싱크 맞추기`를 누르면 됩니다. 결과는 자동 적용되지만, 노래 발음·반주·반복 가사에 따라 오차가 생길 수 있으므로 교사가 타임라인을 확인하고 저장하세요.
