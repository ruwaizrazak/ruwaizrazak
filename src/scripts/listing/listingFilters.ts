export function initializeFilters() {
  const collectionFilter = document.querySelector('.collection-filter') as HTMLSelectElement;
  const tagDropdown = document.querySelector('#tagDropdown') as HTMLSelectElement;
  const showMoreBtn = document.querySelector('#showMoreTags') as HTMLButtonElement;
  const showLessBtn = document.querySelector('#showLessTags') as HTMLButtonElement;
  const additionalTags = document.querySelector('#additionalTags') as HTMLElement;
  const posts = document.querySelectorAll('.post-item') as NodeListOf<HTMLElement>;

  if (!posts.length) return;

  let currentCollection = 'all';
  let currentTag = 'all';

  posts.forEach(post => { post.style.display = 'block'; });

  if (showMoreBtn && additionalTags) {
    showMoreBtn.addEventListener('click', () => {
      additionalTags.style.display = 'flex';
      showMoreBtn.style.display = 'none';
    });
  }

  if (showLessBtn && additionalTags && showMoreBtn) {
    showLessBtn.addEventListener('click', () => {
      additionalTags.style.display = 'none';
      showMoreBtn.style.display = 'inline-block';
    });
  }

  if (tagDropdown) {
    tagDropdown.value = 'all';
    tagDropdown.addEventListener('change', (e) => {
      currentTag = (e.target as HTMLSelectElement).value;
      filterPosts();
    });
  }

  if (collectionFilter) {
    collectionFilter.value = 'all';
    collectionFilter.addEventListener('change', (e) => {
      currentCollection = (e.target as HTMLSelectElement).value;
      filterPosts();
    });
  }

  const tagLinks = document.querySelectorAll('a[data-tag]') as NodeListOf<HTMLAnchorElement>;
  tagLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tag = link.dataset.tag;
      tagLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (tagDropdown && tag) tagDropdown.value = tag;
      if (tag) { currentTag = tag; filterPosts(); }
    });
  });

  function filterPosts() {
    posts.forEach(post => {
      const postCollection = post.dataset.collection;
      const postTags = post.dataset.tags ? post.dataset.tags.split(' ') : [];
      const matchesCollection = currentCollection === 'all' || postCollection === currentCollection;
      const matchesTag = currentTag === 'all' || postTags.includes(currentTag);
      post.style.display = matchesCollection && matchesTag ? 'block' : 'none';
    });
  }

  filterPosts();
}
