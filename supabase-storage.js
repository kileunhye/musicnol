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
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': file.type || 'audio/mpeg',
        'x-upsert': 'true'
      },
      body: file
    });
    if (!response.ok) throw new Error(`Storage 업로드 실패 (${response.status})`);
    return {
      path,
      publicUrl: `${config.url.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`
    };
  }
};
