// ------------------- Platform Normalizer -------------------
function normalizePlatform(raw) {
  if (!raw) return "other";
  const p = raw.toLowerCase();

  if (p.includes("codeforces")) return "codeforces";
  if (p.includes("leetcode")) return "leetcode";
  if (p.includes("atcoder")) return "atcoder";
  if (p.includes("codechef")) return "codechef";

  return "other";
}

function getPlatformBadgeClass(raw) {
  return `badge-${normalizePlatform(raw)}`;
}

// -------------------- MAIN APP --------------------
document.addEventListener("DOMContentLoaded", () => {
  const platformInputs = document.querySelectorAll(".check-container input");
  const contestList = document.getElementById("contestList");
  const loader = document.getElementById("loader");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  const googleBtn = document.getElementById("loginBtn"); // ✅ fixed id

  // -------------------- DARK MODE --------------------
  const themeToggle = document.getElementById("darkmode-toggle");

  if (themeToggle) {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      themeToggle.checked = true;
    }

    themeToggle.addEventListener("change", () => {
      if (themeToggle.checked) {
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.body.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    });
  }

  // -------------------- Google Login --------------------
  if (googleBtn) {
    googleBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const ok = confirm("You will be redirected to select a Google account.");
      if (ok) {
        googleBtn.innerText = "Redirecting...";
        googleBtn.style.opacity = "0.7";
        googleBtn.style.pointerEvents = "none";

        window.location.href = "http://localhost:5000/auth/google";
      }
    });
  }

  let contests = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 6;

  //---------------- For logout logic-----------------------

  function resetUserUI() {
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) loginBtn.style.display = "flex";

    const badge = document.getElementById("connectionBadge");
    if (badge) {
      badge.innerText = "Not Connected";
      badge.classList.remove("badge-on");
      badge.classList.add("badge-off");
    }

    const info = document.getElementById("userName");
    if (info) {
      info.innerText = "Please connect Google account to enable reminders";
    }

    // Disable reminder button when logged out
    const reminderBtn = document.getElementById("saveBtn");
    if (reminderBtn) {
      reminderBtn.disabled = true;
      reminderBtn.title = "Connect Google account first";
    }

    document.getElementById("guestText")?.classList.remove("hidden");
    document.getElementById("userInfo")?.classList.add("hidden");

    document.getElementById("userAvatar").src = "";
    document.getElementById("userName").innerText = "";
    document.getElementById("userEmail").innerText = "";
  }

  // -------------------- Load User Status --------------------
  function loadUserStatus() {
    fetch("http://localhost:5000/api/users/me", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.loggedIn) {
          resetUserUI();
          return;
        }

        // Hide connect button
        const loginBtn = document.getElementById("loginBtn");
        if (loginBtn) loginBtn.style.display = "none";

        // Badge
        const badge = document.getElementById("connectionBadge");
        if (badge) {
          badge.innerText = "Connected";
          badge.classList.remove("badge-off");
          badge.classList.add("badge-on");
        }

        // User info
        document.getElementById("guestText")?.classList.add("hidden");
        document.getElementById("userInfo")?.classList.remove("hidden");

        document.getElementById("userAvatar").src = data.user.photo;
        document.getElementById("userName").innerText = data.user.name;
        document.getElementById("userEmail").innerText = data.user.email;

        // Enable reminder button when logged in
        const reminderBtn = document.getElementById("saveBtn");
        if (reminderBtn) {
          reminderBtn.disabled = false;
          reminderBtn.title = "";
        }

        // Logout
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.onclick = () => {
            fetch("http://localhost:5000/auth/logout", {
              credentials: "include",
            }).finally(() => {
              resetUserUI();
              window.location.reload();
            });
          };
        }
      })
      .catch(() => {
        const badge = document.getElementById("connectionBadge");
        if (badge) {
          badge.innerText = "Offline";
          badge.classList.remove("badge-on");
          badge.classList.add("badge-off");
        }
      });
  }

  // -------------------- Fetch Contests --------------------
  function loadContests() {
    loader.style.display = "block";

    fetch("http://localhost:5000/api/contests")
      .then((res) => res.json())
      .then((data) => {
        contests = data || [];
        currentPage = 1;
        renderContests();
      })
      .catch((err) => {
        console.error("Contest fetch failed:", err);
        contestList.innerHTML = `<p class="empty-msg">Failed to load contests. Refresh the page.</p>`;
      })
      .finally(() => {
        loader.style.display = "none";
      });
  }

  loadUserStatus();
  loadContests();

  // -------------------- Checkbox Filter --------------------
  platformInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentPage = 1;
      renderContests();
    });
  });

  // -------------------- Helpers --------------------
  function getSelectedPlatforms() {
    return Array.from(platformInputs)
      .filter((i) => i.checked)
      .map((i) => i.value.toLowerCase().trim());
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString();
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // -------------------- Render --------------------
  function renderContests() {
    contestList.innerHTML = "";

    const selectedPlatforms = getSelectedPlatforms();

    if (selectedPlatforms.length === 0) {
      pageInfo.innerText = "";
      contestList.innerHTML = `<p class="empty-msg">Select at least one platform.</p>`;
      return;
    }

    const filtered = contests
      .filter((c) => selectedPlatforms.includes(normalizePlatform(c.platform)))
      .sort((a, b) => a.startTime - b.startTime);

    if (filtered.length === 0) {
      pageInfo.innerText = "";
      contestList.innerHTML = `<p class="empty-msg">No contests available.</p>`;
      return;
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    pageItems.forEach((contest) => {
      const card = document.createElement("div");
      card.className = "contest-card";

      card.innerHTML = `
        <div class="contest-title">${contest.name}</div>
        <div class="contest-meta">
          ${formatDate(contest.startTime)} • ${formatTime(contest.startTime)}
        </div>
        <div class="contest-footer">
          <span class="platform-badge ${getPlatformBadgeClass(contest.platform)}">
            ${normalizePlatform(contest.platform).toUpperCase()}
          </span>
          <a class="contest-link" href="${contest.url}" target="_blank">Open</a>
        </div>
      `;

      contestList.appendChild(card);
    });

    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  // -------------------- Pagination --------------------
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderContests();
    }
  });

  nextBtn.addEventListener("click", () => {
    currentPage++;
    renderContests();
  });
});
