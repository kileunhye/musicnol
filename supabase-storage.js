// Small browser-only Storage adapter. It keeps the MVP dependency-free and
// uses Supabase's Storage REST endpoint directly.
window.musicStorage = {
  isConfigured() {
    const config = window.SUPABASE_CONFIG || {};
    return Boolean(config.url && config.anonKey && !config.url.includes('YOUR_PROJECT_REF') && !config.anonKey.includes('YOUR_SUPABASE'));
  },

  async uploadAudio(file, path) {
    if (!this.isConfigured()) throw new Error('Supabase 설정이 없습니다. supabase-config.js를 만들어주세요.');
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(config.bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': file.type || 'audio/mpeg'
      },
      body: file
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Storage 업로드 실패 (${response.status})${detail ? `\n${detail}` : ''}`);
    }
    return {
      path,
      publicUrl: `${config.url.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`
    };
  },

  async deleteAudio(path) {
    if (!this.isConfigured()) return;
    if (!path) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/storage/v1/object/${encodeURIComponent(config.bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        apikey: config.anonKey
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Storage 음원 삭제 실패 (${response.status}). Supabase Storage DELETE 정책을 확인해주세요.${detail ? `\n${detail}` : ''}`);
    }
  },

  async upsertStudentScore(record) {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/student_scores?on_conflict=student_number,stage`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(record)
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`학생 점수 저장 실패 (${response.status})${detail ? `\n${detail}` : ''}`);
    }
  },

  async listStudentScores() {
    if (!this.isConfigured()) return [];
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/student_scores?select=student_number,stage,score,hints_used,updated_at&order=stage.asc,score.desc`;
    const response = await fetch(endpoint, {
      headers: { apikey: config.anonKey }
    });
    if (!response.ok) throw new Error(`학생 점수 조회 실패 (${response.status})`);
    return response.json();
  },

  async clearStudentScores() {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/student_scores?student_number=not.is.null`;
    const response = await fetch(endpoint, { method: 'DELETE', headers: { apikey: config.anonKey } });
    if (!response.ok) throw new Error(`학생 점수 초기화 실패 (${response.status})`);
  },

  async getClassContent() {
    if (!this.isConfigured()) return null;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/class_content?id=eq.1&select=content`;
    const response = await fetch(endpoint, { headers: { apikey: config.anonKey } });
    if (!response.ok) throw new Error(`수업 콘텐츠 조회 실패 (${response.status})`);
    const rows = await response.json();
    return rows[0]?.content || null;
  },

  async upsertClassContent(content) {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/class_content?on_conflict=id`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({ id: 1, content, updated_at: new Date().toISOString() })
    });
    if (!response.ok) throw new Error(`수업 콘텐츠 저장 실패 (${response.status})`);
  },

  async getQuizContent() {
    if (!this.isConfigured()) return null;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/quiz_content?id=eq.1&select=lyric,blank_text,updated_at`;
    const response = await fetch(endpoint, { headers: { apikey: config.anonKey } });
    if (!response.ok) throw new Error(`문제 가사 조회 실패 (${response.status})`);
    const rows = await response.json();
    return rows[0] || null;
  },

  async upsertQuizContent(content) {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/quiz_content?on_conflict=id`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({ id: 1, lyric: content.lyric, blank_text: content.blankText, updated_at: new Date().toISOString() })
    });
    if (!response.ok) throw new Error(`문제 가사 저장 실패 (${response.status})`);
  },

  async listMelodyRecords() {
    if (!this.isConfigured()) return [];
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/melody_records?select=student_number,elapsed,updated_at&order=elapsed.asc,student_number.asc`;
    const response = await fetch(endpoint, { headers: { apikey: config.anonKey } });
    if (!response.ok) throw new Error(`멜로디 기록 조회 실패 (${response.status})`);
    return response.json();
  },

  async clearMelodyRecords() {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/melody_records?student_number=not.is.null`;
    const response = await fetch(endpoint, { method: 'DELETE', headers: { apikey: config.anonKey } });
    if (!response.ok) throw new Error(`멜로디 기록 초기화 실패 (${response.status})`);
  },

  async resetStudentData(teacherPassword) {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/rpc/reset_student_data`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_password: teacherPassword })
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`학생 데이터 초기화 실패 (${response.status})${detail ? `: ${detail}` : ''}`);
    }
  },

  async upsertMelodyRecord(record) {
    if (!this.isConfigured()) return;
    const config = window.SUPABASE_CONFIG;
    const endpoint = `${config.url.replace(/\/$/, '')}/rest/v1/melody_records?on_conflict=student_number`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error(`멜로디 기록 저장 실패 (${response.status})`);
  }
};
