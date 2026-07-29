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
  }
};
