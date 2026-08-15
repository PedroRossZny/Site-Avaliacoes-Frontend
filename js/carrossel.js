const carossel = document.getElementById('carossel');

const items = [
  { label: 'estabelecimento1', image: 'assets/estab 1.jpeg', link: 'estabelecimento1.html' },
  { label: 'estabelecimento2', image: 'assets/estab 2.jpeg', link: 'estabelecimento2.html'},
  { label: 'estabelecimento3', image: 'assets/estab 3.jpeg', link: 'estabelecimento3.html'},
  { label: 'estabelecimento4', image: 'assets/estab 4.jpeg', link: 'estabelecimento4.html'},
  { label: 'estabelecimento5', image: 'assets/estab 5.jpeg', link: 'estabelecimento5.html'},
  { label: 'estabelecimento6', image: 'assets/estab 6.jpeg', link: 'estabelecimento6.html'},
  { label: 'estabelecimento7', image: 'assets/estab 7.jpeg', link: 'estabelecimento7.html'}
];

let currentIndex = 0;

function renderCarossel() {
  carossel.innerHTML = '';

  const leftIndex = (currentIndex - 1 + items.length) % items.length;
  const centerIndex = currentIndex;
  const rightIndex = (currentIndex + 1) % items.length;

const createBox = (item, position) => {
  const div = document.createElement('div');
  div.classList.add('option-box');
  if (position !== 'center') div.classList.add('side');

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.label;
  img.classList.add('option-image');

  const label = document.createElement('span');
  label.textContent = item.label;
  label.classList.add('box-label');

  div.addEventListener('click', () => {
    window.location.href = item.link;
  });

  div.appendChild(img);
  div.appendChild(label);
  return div;
};

  carossel.appendChild(createBox(items[leftIndex], 'left'));
  carossel.appendChild(createBox(items[centerIndex], 'center'));
  carossel.appendChild(createBox(items[rightIndex], 'right'));
}

document.querySelector('.left').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  renderCarossel();
});

document.querySelector('.right').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % items.length;
  renderCarossel();
});

window.addEventListener('load', renderCarossel);
