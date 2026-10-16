(() => {
  const controls = document.getElementById('archive-filter');
  const select = document.getElementById('tag-filter');
  const status = document.getElementById('archive-status');
  if (!controls || !select || !status) return;
  const entries = Array.from(document.querySelectorAll('.archive > li[data-tags]'), item => ({ item, tags: JSON.parse(item.dataset.tags) }));
  let unknownOption;

  function applyLocation() {
    const params = new URL(window.location.href).searchParams;
    const tag = params.get('tag');
    const selected = tag !== null ? 'tag:' + tag : params.get('untagged') === '1' ? 'untagged' : '';
    if (unknownOption) { unknownOption.remove(); unknownOption = undefined; }
    if (selected && !Array.from(select.options).some(option => option.value === selected)) {
      unknownOption = new Option(tag, selected);
      select.add(unknownOption);
    }
    select.value = selected;
    let count = 0;
    for (const { item, tags } of entries) {
      const visible = selected === '' || (selected === 'untagged' ? tags.length === 0 : tags.includes(tag));
      item.hidden = !visible;
      if (visible) count++;
    }
    status.textContent = count === 0 ? 'No entries match this filter.' : `${count} ${count === 1 ? 'entry' : 'entries'}`;
    status.hidden = selected === '';
    const empty = document.getElementById('archive-empty');
    if (empty) empty.hidden = selected !== '';
  }

  function navigate(url) {
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    applyLocation();
  }

  select.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    url.searchParams.delete('untagged');
    if (select.value === 'untagged') url.searchParams.set('untagged', '1');
    else if (select.value.startsWith('tag:')) url.searchParams.set('tag', select.value.slice(4));
    navigate(url);
  });

  document.querySelector('.archive')?.addEventListener('click', event => {
    const link = event.target.closest('a.tag');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(new URL(link.href));
    select.focus({ preventScroll: true });
  });
  window.addEventListener('popstate', applyLocation);
  applyLocation();
  controls.hidden = false;
})();
