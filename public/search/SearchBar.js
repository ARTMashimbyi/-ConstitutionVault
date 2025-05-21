// public/search/SearchBar.js

/**
 * Renders a search bar as a semantic <form> that auto‐searches on typing.
 * Includes a visually‐hidden <label> for accessibility, a spinner, and a voice‐search button.
 *
 * @param {(query: string) => void} onSearchCallback
 * @returns {HTMLFormElement}
 */
export function renderSearchBar(onSearchCallback) {
  // 1) Create the form
  const form = document.createElement('form');
  form.className = 'search-bar';
  form.setAttribute('role', 'search');

  // 2) Visually-hidden label for screen readers
  const label = document.createElement('label');
  label.className = 'visually-hidden';
  label.htmlFor  = 'search-input';
  label.textContent = 'Search constitutional archive';

  // 3) The actual input
  const input = document.createElement('input');
  input.type        = 'search';
  input.id          = 'search-input';
  input.name        = 'searchQuery';
  input.placeholder = 'Search title, author, category, keywords…';
  input.className   = 'search-input';
  input.setAttribute('aria-label', 'Search');

  // 4) Loading spinner
  const spinner = document.createElement('div');
  spinner.className = 'spinner hidden';
  spinner.setAttribute('aria-hidden', 'true');

  // 5) Voice‐search button
  const micBtn = document.createElement('button');
  micBtn.type        = 'button';
  micBtn.className   = 'mic-btn';
  micBtn.setAttribute('aria-label', 'Start voice search');
  micBtn.textContent = '🎤';

  // 6) Prevent real form‐submit
  form.addEventListener('submit', e => e.preventDefault());

  // 7) Debounce input → search + spinner control
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    spinner.classList.remove('hidden');
    timer = setTimeout(() => {
      onSearchCallback(input.value.trim());
      spinner.classList.add('hidden');
    }, 300);
  });

  // 8) Initialize Web Speech API for voice input
  try {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'en-US';

    recognition.addEventListener('result', event => {
      const transcript = event.results[0][0].transcript;
      input.value = transcript;
      onSearchCallback(transcript.trim());
    });

    micBtn.addEventListener('click', () => {
      recognition.start();
    });
  } catch {
    // Browser doesn’t support speech; hide mic button
    micBtn.style.display = 'none';
  }

  // 9) Assemble everything
  form.append(label, input, spinner, micBtn);
  return form;
}
