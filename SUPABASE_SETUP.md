# Supabase 원격 저장 설정

Supabase Dashboard의 SQL Editor에서 `supabase-content.sql` 내용을 한 번 실행하세요.

이 작업으로 다음 데이터가 모든 기기에서 공유됩니다.

- `class_content`: 수업 정보, 가사, 싱크, 음원 공개 URL, 멜로디 체인지 문제
- `student_scores`: 일반 음악 퀴즈 점수
- `melody_records`: 멜로디 체인지 기록
- `quiz_content`: 문제 출제 가사와 빈칸 정보. 항상 1개 행을 새 내용으로 덮어씁니다.

기존 PC 자료를 옮기려면 SQL 실행 후 PC에서 배포된 사이트를 새로 열고, 교사 화면에서 콘텐츠를 한 번 저장하세요. MP3가 브라우저 임시 저장(`blob:`) 상태였다면 파일 선택으로 음원을 다시 업로드해야 합니다.
