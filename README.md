# Avalia Aqui - Frontend

Frontend estatico do projeto Avalia Aqui, uma interface web para avaliar estabelecimentos, visualizar ranking e interagir em comentarios anonimos.

Esta versao nao depende de backend real. As chamadas para `/api/*` sao interceptadas por um mock em JavaScript e os dados sao persistidos no `localStorage` do navegador.

## Demo

Acesse a demo publicada:

[https://avalia-aqui.vercel.app/](https://avalia-aqui.vercel.app/)

## Funcionalidades

- Tela inicial com acesso a votacao, ranking e comentarios.
- Votacao por estrelas de 1 a 5 para cada estabelecimento.
- Persistencia de votos no navegador usando `localStorage`.
- Ranking calculado pela media das avaliacoes salvas localmente.
- Busca de estabelecimentos nas telas de votacao e ranking.
- Carrossel para escolher o estabelecimento na area de comentarios.
- Paginas individuais de comentarios para 7 estabelecimentos.
- Comentarios anonimos com respostas.
- Likes e unlikes em comentarios e respostas.
- Ordenacao de comentarios por mais recentes ou mais curtidos.
- Simulacao de API REST diretamente no frontend.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- LocalStorage
- Vercel para deploy da demo

## Estrutura do projeto

```text
.
+-- assets/
|   +-- imagens, botoes, estrelas e backgrounds
+-- css/
|   +-- carrossel.css
|   +-- comentarios.css
|   +-- style.css
+-- js/
|   +-- carrossel.js
|   +-- estabelecimento.js
|   +-- ranks.js
|   +-- votes.js
|   +-- utils/
|       +-- anon.js
|       +-- mockApi.js
+-- index.html
+-- vote.html
+-- rank.html
+-- carrossel.html
+-- estabelecimento1.html ... estabelecimento7.html
+-- README.md
```

## Como executar localmente

Como o projeto usa modulos JavaScript, rode os arquivos por um servidor local em vez de abrir o HTML diretamente pelo explorador de arquivos.

Com Python:

```bash
python -m http.server 3000
```

Depois acesse:

```text
http://localhost:3000
```

Tambem e possivel usar qualquer servidor estatico, como a extensao Live Server do VS Code.

## Paginas

- `/index.html`: tela inicial.
- `/vote.html`: votacao por estrelas.
- `/rank.html`: ranking por media de avaliacoes.
- `/carrossel.html`: selecao de estabelecimento para comentarios.
- `/estabelecimento1.html` a `/estabelecimento7.html`: paginas de comentarios por estabelecimento.

## API mock

O arquivo `js/utils/mockApi.js` sobrescreve `window.fetch` para interceptar chamadas iniciadas com `/api/`. Isso permite que o frontend use os mesmos endpoints esperados por uma API real, mas armazenando tudo no navegador.

### Avaliacoes

| Metodo | Rota | Descricao |
| --- | --- | --- |
| GET | `/api/reviews?placeId=1` | Lista avaliacoes de um estabelecimento. |
| POST | `/api/reviews` | Cria uma avaliacao. |
| PUT | `/api/reviews/:id` | Atualiza uma avaliacao existente. |
| GET | `/api/reviews/average/:placeId` | Retorna media e quantidade de avaliacoes. |

Exemplo de avaliacao:

```json
{
  "placeId": 1,
  "rating": 5,
  "comment": "",
  "anonId": "id-anonimo"
}
```

### Comentarios

| Metodo | Rota | Descricao |
| --- | --- | --- |
| GET | `/api/comments?placeId=1` | Lista comentarios e respostas de um estabelecimento. |
| POST | `/api/comments` | Cria comentario ou resposta. |
| POST | `/api/comments/:id/like` | Adiciona um like. |
| DELETE | `/api/comments/:id/like` | Remove um like. |
| DELETE | `/api/comments/:id` | Remove um comentario e suas respostas diretas. |

Exemplo de comentario:

```json
{
  "placeId": 1,
  "text": "Otimo atendimento!",
  "anonId": "id-anonimo"
}
```

Exemplo de resposta:

```json
{
  "placeId": 1,
  "text": "Concordo com a avaliacao.",
  "anonId": "id-anonimo",
  "parentCommentId": 3
}
```

## Dados salvos no navegador

O projeto usa as seguintes chaves no `localStorage`:

- `anonId`: identificador anonimo do usuario.
- `aa_reviews_v1`: avaliacoes salvas.
- `aa_comments_v1`: comentarios salvos.
- `aa_ids_v1`: controle de IDs incrementais.
- `likedComments`: comentarios curtidos pelo usuario.

Os dados ficam apenas no navegador usado. Ao limpar o armazenamento local do site, as avaliacoes e comentarios da demo tambem sao apagados.

## Deploy

Como o projeto e estatico e agora os arquivos principais estao na raiz, a publicacao pode apontar diretamente para a raiz do repositorio.

Nao ha etapa de build, instalacao de dependencias ou servidor Node.js neste frontend.

## Observacoes

- Esta versao foi feita para demonstracao com `localStorage`.
- As informacoes nao sao compartilhadas entre usuarios diferentes.
- Para persistencia real em producao, conecte o frontend a uma API/backend.
- A pasta `public` foi removida da raiz porque seu conteudo foi movido para o nivel principal do repositorio.

## Autor

Projeto desenvolvido por [PedroRossZny](https://github.com/PedroRossZny).
