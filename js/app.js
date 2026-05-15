/**
 * Bugren导航 - 前端逻辑
 * 纯静态，JSON驱动，前端搜索+分类筛选
 */

(function () {
  "use strict";

  // DOM references
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const categoryTabs = document.getElementById("categoryTabs");
  const contentArea = document.getElementById("contentArea");
  const resultInfo = document.getElementById("resultInfo");
  const backTop = document.getElementById("backTop");

  // State
  let allData = null;
  let activeCategory = "all";

  // ===== Data Loading =====
  async function loadData() {
    try {
      const resp = await fetch("./data/resources.json");
      if (!resp.ok) throw new Error("加载失败");
      allData = await resp.json();
      renderCategoryTabs();
      renderContent();
    } catch (e) {
      contentArea.innerHTML =
        '<div class="empty-state"><div class="empty-icon">😵</div><p>数据加载失败，请刷新重试</p></div>';
    }
  }

  // ===== Render Category Tabs =====
  function renderCategoryTabs() {
    if (!allData) return;

    // Calculate total
    const total = allData.categories.reduce((s, c) => s + c.items.length, 0);

    let html = `<button class="cat-tab active" data-cat="all">
      <span class="cat-icon">🔥</span>全部<span class="cat-count">${total}</span>
    </button>`;

    allData.categories.forEach((cat) => {
      html += `<button class="cat-tab" data-cat="${cat.id}">
        <span class="cat-icon">${cat.icon}</span>${cat.name}<span class="cat-count">${cat.items.length}</span>
      </button>`;
    });

    categoryTabs.innerHTML = html;

    // Bind click
    categoryTabs.querySelectorAll(".cat-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activeCategory = tab.dataset.cat;
        categoryTabs.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderContent();
      });
    });
  }

  // ===== Filter Logic =====
  function getFilteredItems() {
    if (!allData) return [];

    const keyword = searchInput.value.trim().toLowerCase();
    const result = [];

    allData.categories.forEach((cat) => {
      // Category filter
      if (activeCategory !== "all" && cat.id !== activeCategory) return;

      const matchedItems = cat.items.filter((item) => {
        if (!keyword) return true;
        // Search in title, desc, tags
        const inTitle = item.title.toLowerCase().includes(keyword);
        const inDesc = item.desc.toLowerCase().includes(keyword);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(keyword));
        return inTitle || inDesc || inTags;
      });

      if (matchedItems.length > 0) {
        result.push({
          ...cat,
          items: matchedItems,
        });
      }
    });

    return result;
  }

  // ===== Render Content =====
  function renderContent() {
    const filtered = getFilteredItems();
    const keyword = searchInput.value.trim();

    // Result info
    if (keyword) {
      const count = filtered.reduce((s, c) => s + c.items.length, 0);
      resultInfo.innerHTML = `找到 <span>${count}</span> 个与「${escapeHtml(keyword)}」相关的资源`;
      resultInfo.classList.add("visible");
    } else {
      resultInfo.classList.remove("visible");
    }

    if (filtered.length === 0) {
      contentArea.innerHTML =
        '<div class="empty-state"><div class="empty-icon">🔍</div><p>没有找到相关资源，试试其他关键词</p></div>';
      return;
    }

    let html = "";

    filtered.forEach((cat) => {
      html += `<section class="resource-section">`;
      html += `<h2 class="section-title"><span class="sec-icon">${cat.icon}</span>${cat.name}</h2>`;
      html += `<div class="cards-grid">`;

      cat.items.forEach((item, idx) => {
        html += `
          <div class="resource-card" style="animation-delay: ${idx * 0.04}s">
            <div class="card-header">
              <h3 class="card-title">${highlightKeyword(item.title, keyword)}</h3>
            </div>
            <p class="card-desc">${highlightKeyword(item.desc, keyword)}</p>
            <div class="card-footer">
              <div class="card-tags">
                ${item.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
              </div>
              <a href="${item.link}" class="card-btn" target="_blank" rel="noopener">
                获取<span class="btn-arrow">→</span>
              </a>
            </div>
          </div>`;
      });

      html += `</div></section>`;
    });

    contentArea.innerHTML = html;
  }

  // ===== Helpers =====
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightKeyword(text, keyword) {
    if (!keyword) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(keyword)})`, "gi");
    return escaped.replace(regex, '<mark style="background:rgba(108,92,231,0.3);color:#e8e8e8;padding:0 2px;border-radius:2px;">$1</mark>');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ===== Search Events =====
  let searchTimer = null;

  searchInput.addEventListener("input", () => {
    const hasValue = searchInput.value.length > 0;
    searchClear.classList.toggle("visible", hasValue);

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      renderContent();
    }, 200);
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.classList.remove("visible");
    renderContent();
    searchInput.focus();
  });

  // ===== Back to Top =====
  window.addEventListener("scroll", () => {
    backTop.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });

  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ===== Init =====
  loadData();
})();
