// js/utils/mockApi.js
// Intercepta chamadas a /api/* e simula backend usando localStorage.

const REVIEWS_KEY  = 'aa_reviews_v1';
const COMMENTS_KEY = 'aa_comments_v1';
const IDS_KEY      = 'aa_ids_v1';

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function nextId(kind) {
  const ids = load(IDS_KEY, { review: 1, comment: 1 });
  const id  = ids[kind];
  ids[kind] = id + 1;
  save(IDS_KEY, ids);
  return id;
}

function jsonResponse(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function notFound(msg='Not found') { return jsonResponse({ error: msg }, 404); }
function badRequest(msg='Bad request') { return jsonResponse({ error: msg }, 400); }

async function handleApi(url, opts={}) {
  const u = new URL(url, location.origin);
  const path = u.pathname; // /api/...
  const method = (opts.method || 'GET').toUpperCase();

  // ---------------- REVIEWS ----------------
  // GET /api/reviews?placeId=1
  if (path === '/api/reviews' && method === 'GET') {
    const placeId = u.searchParams.get('placeId');
    const all = load(REVIEWS_KEY, []);
    const filtered = placeId ? all.filter(r => String(r.placeId) === String(placeId)) : all;
    return jsonResponse(filtered);
  }

  // POST /api/reviews
  if (path === '/api/reviews' && method === 'POST') {
    const body = JSON.parse(opts.body || '{}');
    if (!('placeId' in body) || !('rating' in body) || !('anonId' in body)) {
      return badRequest('Campos obrigatórios: placeId, rating, anonId');
    }
    const all = load(REVIEWS_KEY, []);
    const now = new Date().toISOString();
    const newItem = {
      id: nextId('review'),
      placeId: String(body.placeId),
      rating: Number(body.rating),
      comment: String(body.comment || ''),
      anonId: String(body.anonId),
      createdAt: now, updatedAt: now
    };
    all.push(newItem);
    save(REVIEWS_KEY, all);
    return jsonResponse(newItem, 201);
  }

  // PUT /api/reviews/:id
  if (path.startsWith('/api/reviews/') && method === 'PUT') {
    const id = Number(path.split('/').pop());
    const body = JSON.parse(opts.body || '{}');
    const all = load(REVIEWS_KEY, []);
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return notFound('Review não encontrada');
    if ('rating' in body)  all[idx].rating  = Number(body.rating);
    if ('comment' in body) all[idx].comment = String(body.comment || '');
    all[idx].updatedAt = new Date().toISOString();
    save(REVIEWS_KEY, all);
    return jsonResponse(all[idx]);
  }

  // GET /api/reviews/average/:placeId
  if (path.startsWith('/api/reviews/average/') && method === 'GET') {
    const placeId = path.split('/').pop();
    const all = load(REVIEWS_KEY, []);
    const rows = all.filter(r => String(r.placeId) === String(placeId));
    const count = rows.length;
    const avg = count ? (rows.reduce((s,r)=>s+r.rating,0) / count) : 0;
    return jsonResponse({ avgRating: String(avg), count });
  }

  // ---------------- COMMENTS ----------------
  // GET /api/comments?placeId=1
  if (path === '/api/comments' && method === 'GET') {
    const placeId = u.searchParams.get('placeId');
    if (!placeId) return badRequest('Parâmetro placeId é obrigatório');
    const all = load(COMMENTS_KEY, []);
    const rows = all.filter(c => String(c.placeId) === String(placeId));

    // monta árvore (root/respostas)
    const map = {};
    rows.forEach(c => { map[c.id] = { ...c, respostas: [] }; });
    const roots = [];
    rows.forEach(c => {
      if (c.parentCommentId && map[c.parentCommentId]) {
        map[c.parentCommentId].respostas.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    // ordem: mais recentes primeiro (igual ao backend)
    roots.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    roots.forEach(r => r.respostas.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)));
    return jsonResponse(roots);
  }

  // POST /api/comments   (novo comentário ou resposta)
  if (path === '/api/comments' && method === 'POST') {
    const body = JSON.parse(opts.body || '{}');
    const { placeId, text, anonId, parentCommentId } = body;
    if (!placeId || !text || !anonId) return badRequest('Campos obrigatórios: placeId, text, anonId');
    const all = load(COMMENTS_KEY, []);
    const now = new Date().toISOString();
    const newItem = {
      id: nextId('comment'),
      placeId: Number(placeId),
      text: String(text),
      anonId: String(anonId),
      parentCommentId: parentCommentId ? Number(parentCommentId) : null,
      likeCount: 0,
      createdAt: now, updatedAt: now
    };
    all.push(newItem);
    save(COMMENTS_KEY, all);
    return jsonResponse(newItem, 201);
  }

  // POST /api/comments/:id/like
  if (path.startsWith('/api/comments/') && path.endsWith('/like') && method === 'POST') {
    const id = Number(path.split('/')[3]);
    const all = load(COMMENTS_KEY, []);
    const item = all.find(c => c.id === id);
    if (!item) return notFound('Comentário não encontrado');
    item.likeCount += 1;
    item.updatedAt = new Date().toISOString();
    save(COMMENTS_KEY, all);
    return jsonResponse({ likeCount: item.likeCount });
  }

  // DELETE /api/comments/:id/like
  if (path.startsWith('/api/comments/') && path.endsWith('/like') && method === 'DELETE') {
    const id = Number(path.split('/')[3]);
    const all = load(COMMENTS_KEY, []);
    const item = all.find(c => c.id === id);
    if (!item) return notFound('Comentário não encontrado');
    item.likeCount = Math.max(0, item.likeCount - 1);
    item.updatedAt = new Date().toISOString();
    save(COMMENTS_KEY, all);
    return jsonResponse({ likeCount: item.likeCount });
  }

  // DELETE /api/comments/:id  (opcional)
  if (path.startsWith('/api/comments/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    let all = load(COMMENTS_KEY, []);
    // remove filhos
    all = all.filter(c => c.parentCommentId !== id);
    const before = all.length;
    all = all.filter(c => c.id !== id);
    if (all.length === before) return notFound('Comentário não encontrado');
    save(COMMENTS_KEY, all);
    return new Response(null, { status: 204 });
  }

  // fallback
  return notFound('Rota da API mock não encontrada');
}

// patch do fetch
const _origFetch = window.fetch.bind(window);
window.fetch = function(url, opts) {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    return handleApi(url, opts);
  }
  // usa fetch normal para assets, html, etc.
  return _origFetch(url, opts);
};
