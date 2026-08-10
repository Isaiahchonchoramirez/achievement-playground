/* ==========================================================================
   Achievement Playground — app.js

   This file has one job: read data/contributors.json and turn each entry
   into a card on the page.

   You do NOT need to edit this file to add yourself. Edit
   data/contributors.json instead. But you are very welcome to improve it.

   Heads up: opening index.html by double-clicking it will not work, because
   browsers block fetch() on file:// URLs. Run a tiny local server instead:

       python3 -m http.server 8000     # then visit http://localhost:8000
   ========================================================================== */

(function () {
  'use strict';

  var DATA_URL = 'data/contributors.json';

  var grid = document.getElementById('contributor-grid');
  var status = document.getElementById('contributor-status');

  if (!grid || !status) return;

  /**
   * Put a message in the status line above the grid.
   * state is one of: "loading", "ready", "error".
   */
  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  /**
   * Build the initials shown when someone has no GitHub avatar.
   * "Ada Lovelace" -> "AL"
   */
  function initialsOf(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (word) { return word.charAt(0).toUpperCase(); })
      .join('');
  }

  /**
   * Create one contributor card.
   * Everything is built with createElement / textContent rather than
   * innerHTML, so a contributor's text can never inject markup.
   */
  function createCard(person) {
    var item = document.createElement('li');
    var card = document.createElement('article');
    card.className = 'card';

    // --- head: avatar + name + handle ---
    var head = document.createElement('div');
    head.className = 'card-head';

    var avatar = document.createElement('img');
    avatar.className = 'card-avatar';
    avatar.src = 'https://github.com/' + encodeURIComponent(person.github) + '.png?size=160';
    avatar.alt = '';                 // decorative: the name is right beside it
    avatar.loading = 'lazy';
    avatar.width = 52;
    avatar.height = 52;

    // If GitHub does not serve an avatar, swap in initials instead.
    avatar.addEventListener('error', function () {
      var fallback = document.createElement('div');
      fallback.className = 'card-avatar card-avatar-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      fallback.textContent = initialsOf(person.name);
      avatar.replaceWith(fallback);
    });

    var names = document.createElement('div');

    var name = document.createElement('h3');
    name.className = 'card-name';
    name.textContent = person.name;

    var handle = document.createElement('a');
    handle.className = 'card-handle';
    handle.href = 'https://github.com/' + encodeURIComponent(person.github);
    handle.textContent = '@' + person.github;
    handle.rel = 'noopener';
    handle.setAttribute('aria-label', person.name + ' on GitHub');

    names.append(name, handle);
    head.append(avatar, names);

    // --- goal ---
    var goal = document.createElement('p');
    goal.className = 'card-goal';
    goal.textContent = person.goal;

    // --- favourite technology ---
    var tech = document.createElement('span');
    tech.className = 'card-tech';
    tech.textContent = person.favoriteTech;

    card.append(head, goal, tech);
    item.append(card);
    return item;
  }

  function renderEmpty() {
    var item = document.createElement('li');
    item.className = 'card-empty';
    item.textContent =
      'No contributors yet. You could be the first — see CONTRIBUTING.md.';
    grid.append(item);
  }

  function render(people) {
    grid.replaceChildren();

    if (people.length === 0) {
      renderEmpty();
      setStatus('No contributors yet.', 'ready');
      return;
    }

    // Sort by name so the grid order does not depend on who merged first.
    var sorted = people.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    var fragment = document.createDocumentFragment();
    sorted.forEach(function (person) {
      fragment.append(createCard(person));
    });
    grid.append(fragment);

    setStatus(
      sorted.length + (sorted.length === 1 ? ' contributor' : ' contributors') + ' loaded.',
      'ready'
    );
  }

  /**
   * A contributor needs all four fields as non-empty strings.
   * The workflow rejects bad data before it is merged, but the page
   * should still degrade gracefully if something slips through.
   */
  function isUsable(person) {
    return (
      person &&
      typeof person === 'object' &&
      ['name', 'github', 'favoriteTech', 'goal'].every(function (key) {
        return typeof person[key] === 'string' && person[key].trim() !== '';
      })
    );
  }

  setStatus('Loading contributors…', 'loading');

  fetch(DATA_URL)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Could not load ' + DATA_URL + ' (HTTP ' + response.status + ')');
      }
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('contributors.json must contain an array of contributors.');
      }
      render(data.filter(isUsable));
    })
    .catch(function (error) {
      console.error(error);
      setStatus(
        'Could not load the contributor list. ' +
        'If you opened this file directly, run a local server instead: ' +
        'python3 -m http.server 8000',
        'error'
      );
    });
})();
