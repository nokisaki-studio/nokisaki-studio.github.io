// 見本帳: 見本(.leaf)ごとにつまみを作り、押すとその 1 枚までめくる。
// 見本を足すときは index.html に <section class="leaf" id="…" data-tab="…"> を 1 つ足すだけ。
// #id 付きの URL(例: https://nokisaki-studio.github.io/#nijimi)で、その見本を開いた状態で表示する。
(() => {
  const book = document.querySelector('[data-book]');
  if (!book) return;
  const tabsBox = book.querySelector('[data-tabs]');
  const leaves = [...book.querySelectorAll('.leaf')];
  if (!tabsBox || leaves.length === 0) return;

  document.documentElement.classList.add('has-book');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 900px)');

  tabsBox.setAttribute('role', 'tablist');
  tabsBox.setAttribute('aria-label', '見本');
  const orient = () => tabsBox.setAttribute('aria-orientation', wide.matches ? 'vertical' : 'horizontal');
  orient();
  wide.addEventListener('change', orient);

  const tabs = leaves.map((leaf, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab';
    tab.id = `tab-${leaf.id}`;
    tab.textContent = leaf.dataset.tab || leaf.querySelector('h2')?.textContent || leaf.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', leaf.id);
    leaf.setAttribute('role', 'tabpanel');
    leaf.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => open(i, true));
    tabsBox.append(tab);
    return tab;
  });

  let current = -1;
  let mover = null;

  // めくっている途中で次を押されたら、今の動きを終わらせてから始める
  const settle = () => {
    leaves.forEach((l) => l.classList.remove('is-leaving', 'is-returning', 'is-under'));
    mover = null;
  };

  function open(i, byUser) {
    if (i === current || !leaves[i]) return;
    settle();
    const prev = leaves[current];
    const next = leaves[i];

    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });

    // 動きを減らす設定では、めくらずに切り替えるだけ
    if (prev && !reduce.matches) {
      if (i > current) {
        // 前へ: 今の 1 枚が綴じ目を軸にめくれて、下の 1 枚が出る
        mover = prev;
        prev.classList.add('is-leaving');
      } else {
        // 戻る: めくった 1 枚が綴じ目から戻ってきて重なる
        mover = next;
        next.classList.add('is-returning');
        prev.classList.add('is-under');
      }
      const m = mover;
      m.addEventListener('animationend', function done(e) {
        if (e.target !== m || e.pseudoElement) return;
        m.removeEventListener('animationend', done);
        if (mover === m) settle();
      });
    }

    prev?.classList.remove('is-open');
    next.classList.add('is-open');
    current = i;

    if (byUser) history.replaceState(null, '', `#${next.id}`);
  }

  tabsBox.addEventListener('keydown', (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let to = null;
    if (e.key in keys) to = (current + keys[e.key] + leaves.length) % leaves.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = leaves.length - 1;
    if (to === null) return;
    e.preventDefault();
    open(to, true);
    tabs[to].focus();
  });

  const fromHash = () => {
    const k = leaves.findIndex((l) => `#${l.id}` === location.hash);
    return k < 0 ? 0 : k;
  };
  addEventListener('hashchange', () => open(fromHash(), false));
  reduce.addEventListener?.('change', settle);

  open(fromHash(), false);
})();
