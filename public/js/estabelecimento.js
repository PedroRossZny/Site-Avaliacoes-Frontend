import { getAnonId } from './utils/anon.js';

const placeId = Number(document.body.dataset.placeId);
const listaComentarios = document.getElementById('lista-comentarios');
const form = document.getElementById('form-comentario');
const input = document.getElementById('comentario-input');
const seletorOrdenacao = document.getElementById('ordenar');

const likedCommentsKey = 'likedComments';

if (!sessionStorage.getItem('likesInitialized')) {
  localStorage.removeItem(likedCommentsKey);
  sessionStorage.setItem('likesInitialized', 'true');
}

let localComments = [];

async function sendLikeToServer(commentId) {
  const res = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao enviar like');
  const json = await res.json();
  return json.likeCount;
}

async function removeLikeFromServer(commentId) {
  const res = await fetch(`/api/comments/${commentId}/like`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao remover like');
  const json = await res.json();
  return json.likeCount;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return alert('Escreva algo antes de enviar.');
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, text, anonId: getAnonId() })
    });
    if (!res.ok) throw new Error('Falha ao enviar comentário');
    input.value = '';
    await loadComments();
  } catch (err) {
    console.error('Erro ao enviar comentário:', err);
  }
});

seletorOrdenacao.addEventListener('change', loadComments);

async function loadComments() {
  try {
    const res = await fetch(`/api/comments?placeId=${placeId}`);
    if (!res.ok) throw new Error(res.statusText);
    const comments = await res.json();

    const likedIds = JSON.parse(localStorage.getItem(likedCommentsKey) || '[]');

    localComments = comments.map(c => ({
      ...c,
      curtido: likedIds.includes(c.id),
      respostas: (c.respostas || []).map(r => ({
        ...r,
        curtido: likedIds.includes(r.id)
      })),
      mostrarRespostas: false
    }));

    renderComments();
  } catch (err) {
    console.error('Erro ao carregar comentários:', err);
    listaComentarios.innerHTML = '<li>Falha ao carregar comentários.</li>';
  }
}

function renderComments() {
  const sorted = [...localComments];
  if (seletorOrdenacao.value === 'curtidas') {
    sorted.sort((a, b) => b.likeCount - a.likeCount || new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  listaComentarios.innerHTML = '';
  sorted.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comentario';

    const meta = document.createElement('div');
    meta.className = 'comentario-meta';
    meta.innerHTML = `<strong>Anônimo</strong> <small>${new Date(c.createdAt).toLocaleString()}</small>`;

    const texto = document.createElement('div');
    texto.className = 'comentario-texto';
    texto.textContent = c.text;

    const actions = document.createElement('div');
    actions.className = 'acoes';

    const btnLike = document.createElement('button');
    btnLike.className = 'curtir-btn';
    btnLike.textContent = c.curtido ? `❤️ ${c.likeCount}` : `🤍 ${c.likeCount}`;
    if (c.curtido) btnLike.style.color = 'red';
    btnLike.addEventListener('click', async () => {
      try {
        if (c.curtido) {
          const newCount = await removeLikeFromServer(c.id);
          c.likeCount = newCount;
          c.curtido = false;
          const ids = JSON.parse(localStorage.getItem(likedCommentsKey) || '[]');
          const updated = ids.filter(id => id !== c.id);
          localStorage.setItem(likedCommentsKey, JSON.stringify(updated));
        } else {
          const newCount = await sendLikeToServer(c.id);
          c.likeCount = newCount;
          c.curtido = true;
          const ids = JSON.parse(localStorage.getItem(likedCommentsKey) || '[]');
          ids.push(c.id);
          localStorage.setItem(likedCommentsKey, JSON.stringify(ids));
        }
        renderComments();
      } catch (err) {
        console.error('Erro ao alternar like do comentário:', err);
      }
    });

    const btnReply = document.createElement('button');
    btnReply.className = 'responder-btn';
    btnReply.textContent = 'Responder';
    actions.append(btnLike, btnReply);

    const replyForm = document.createElement('form');
    replyForm.className = 'form-resposta';
    replyForm.style.display = 'none';
    replyForm.innerHTML = `
      <textarea placeholder="Escreva uma resposta..." required></textarea>
      <button type="submit">Enviar</button>
    `;
    btnReply.addEventListener('click', () => {
      replyForm.style.display = replyForm.style.display === 'none' ? 'flex' : 'none';
    });
    replyForm.addEventListener('submit', async e => {
      e.preventDefault();
      const txt = replyForm.querySelector('textarea').value.trim();
      if (!txt) return;
      try {
        const resp = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeId, text: txt, anonId: getAnonId(), parentCommentId: c.id })
        });
        if (!resp.ok) throw new Error();
        await loadComments();
      } catch (err) {
        console.error('Erro ao enviar resposta:', err);
      }
    });

    const respContainer = document.createElement('div');
    respContainer.className = 'resposta-container';
    if (c.respostas.length) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'toggle-respostas-btn';
      toggleBtn.textContent = c.mostrarRespostas
        ? `Ocultar resposta${c.respostas.length > 1 ? 's' : ''}`
        : `Ver ${c.respostas.length} resposta${c.respostas.length > 1 ? 's' : ''}`;
      toggleBtn.addEventListener('click', () => {
        c.mostrarRespostas = !c.mostrarRespostas;
        renderComments();
      });

      const listResp = document.createElement('div');
      listResp.className = 'respostas';
      listResp.style.display = c.mostrarRespostas ? 'block' : 'none';
      c.respostas.forEach(r => {
        const divR = document.createElement('div');
        divR.className = 'comentario-resposta';

        const metaR = document.createElement('div');
        metaR.className = 'comentario-meta';
        metaR.innerHTML = `<strong>Anônimo</strong> <small>${new Date(r.createdAt).toLocaleString()}</small>`;

        const textoR = document.createElement('div');
        textoR.className = 'comentario-texto';
        textoR.textContent = r.text;

        const btnLikeR = document.createElement('button');
        btnLikeR.className = 'curtir-btn';
        btnLikeR.textContent = r.curtido ? `❤️ ${r.likeCount}` : `🤍 ${r.likeCount}`;
        if (r.curtido) btnLikeR.style.color = 'red';
        btnLikeR.addEventListener('click', async () => {
          try {
            if (r.curtido) {
              const newCountR = await removeLikeFromServer(r.id);
              r.likeCount = newCountR;
              r.curtido = false;
              const idsR = JSON.parse(localStorage.getItem(likedCommentsKey) || '[]');
              const updatedR = idsR.filter(id => id !== r.id);
              localStorage.setItem(likedCommentsKey, JSON.stringify(updatedR));
            } else {
              const newCountR = await sendLikeToServer(r.id);
              r.likeCount = newCountR;
              r.curtido = true;
              const idsR = JSON.parse(localStorage.getItem(likedCommentsKey) || '[]');
              idsR.push(r.id);
              localStorage.setItem(likedCommentsKey, JSON.stringify(idsR));
            }
            renderComments();
          } catch (err) {
            console.error('Erro ao alternar like da resposta:', err);
          }
        });

        const actionsR = document.createElement('div');
        actionsR.className = 'acoes';
        actionsR.append(btnLikeR);

        divR.append(metaR);

        const bodyR = document.createElement('div');
        bodyR.className = 'comentario-body';
        bodyR.append(textoR, actionsR);
        divR.append(bodyR);

        listResp.appendChild(divR);
      });
      respContainer.append(toggleBtn, listResp);
    }

    div.append(meta, texto, actions, replyForm, respContainer);
    listaComentarios.appendChild(div);
  });
}

loadComments();
