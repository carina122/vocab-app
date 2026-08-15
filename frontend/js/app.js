/**
 * app.js — shared behaviour across all WordBox pages:
 * nav active-state, toast notifications, and a local-only fallback
 * so the UI is still explorable if the backend isn't running.
 */
document.addEventListener('DOMContentLoaded', () => {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.tab-list a').forEach((a) => {
    if (a.getAttribute('href') === here) a.classList.add('active');
  });
});

function showToast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}

/* Fallback sample deck used only when the backend API is unreachable,
   so reviewers can see flashcard behaviour without deploying anything. */
const SAMPLE_DECK = {
  id: 'sample',
  name: 'Sample: Everyday French',
  language: 'French',
  cards: [
    { id: 'c1', term: 'la fenêtre', translation: 'the window', example: 'Ouvre la fenêtre, il fait chaud.' },
    { id: 'c2', term: 'apprendre', translation: 'to learn', example: "J'apprends le français." },
    { id: 'c3', term: 'le souvenir', translation: 'the memory / souvenir', example: 'Ce voyage restera un bon souvenir.' },
    { id: 'c4', term: 'quotidien', translation: 'everyday, daily', example: 'C\'est notre routine quotidienne.' },
    { id: 'c5', term: 'la bibliothèque', translation: 'the library', example: 'Je révise à la bibliothèque.' },
  ],
};

window.WordBoxApp = { showToast, SAMPLE_DECK };
