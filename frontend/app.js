let selectedContest = null;
let isUserLoggedIn = false;

// ----------------- For Platform Logo-------------------

function getPlatformLogo(contest) {
  const p = (contest.platform || "").toLowerCase();

  if (p === "codechef") return "https://cdn.codechef.com/images/cc-logo.svg";

  if (p === "leetcode")
    return "https://leetcode.com/static/images/LeetCode_logo.png";

  if (p === "codeforces")
    return "https://sta.codeforces.com/s/0/images/codeforces-logo.png";

  if (p === "atcoder") return "https://img.atcoder.jp/assets/atcoder.png";

  // final backup
  return "https://clist.by/static/core/img/default.png";
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

  // -------------------- Reminder Create --------------------
  async function createReminder(platform) {
    if (!isUserLoggedIn) {
      alert("Connect Google account first to create reminders");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          platform: platform,
          time: new Date().toISOString(),
        }),
      });

      if (res.status === 401) {
        alert("Session expired. Please connect again.");
        return;
      }

      const data = await res.json();
      alert("Reminder added for " + platform);
    } catch (err) {
      alert("Please connect Google account first");
    }
  }

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

      // const ok = confirm("You will be redirected to select a Google account.");
      // if (!ok) return;

      // Silence network errors during OAuth redirect
      window.addEventListener("beforeunload", () => {
        window.onerror = () => true;
      });

      window.location.href = "http://localhost:5000/auth/google";
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
          isUserLoggedIn = false;
          resetUserUI();
          return;
        }

        isUserLoggedIn = true;

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

        // ----- USER INFO SAFE BINDING -----
        const avatarEl = document.getElementById("userAvatar");
        const nameEl = document.getElementById("userName");
        const emailEl = document.getElementById("userEmail");

        if (avatarEl) {
          avatarEl.src = data.user.photo || data.user.picture || "";
          avatarEl.onerror = () => {
            avatarEl.src = "/default-avatar.png";
          };
        }

        if (nameEl) nameEl.innerText = data.user.name || "";
        if (emailEl) emailEl.innerText = data.user.email || "";
        // -----------------------------------

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
        console.log("REAL CONTEST DATA:", contests[0]);

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
    if (!Array.isArray(contests)) {
      console.log("contests not array:", contests);
      contests = [];
    }

    contestList.innerHTML = "";

    const selectedPlatforms = getSelectedPlatforms();

    if (selectedPlatforms.length === 0) {
      pageInfo.innerText = "";
      contestList.innerHTML = `<p class="empty-msg">Select at least one platform.</p>`;
      return;
    }

    // ----- SMART PLATFORM MATCH -----
    const filtered = contests.filter((c) => {
      const name = (
        (c.resource && c.resource.name) ||
        c.platform ||
        c.host ||
        ""
      ).toLowerCase();

      return selectedPlatforms.some((p) => name.includes(p.toLowerCase()));
    });

    filtered.sort((a, b) => a.startTime - b.startTime);

    if (filtered.length === 0) {
      pageInfo.innerText = "";
      contestList.innerHTML = `<p class="empty-msg">No contests available.</p>`;
      return;
    }

    // ----- PAGINATION -----
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    // ----- RENDER CARDS -----
    pageItems.forEach((contest) => {
      contestList.innerHTML += `
      <div class="contest-card">

        <div class="modern-card">

          <div class="card-header">
            <span class="time">
              ${formatDate(contest.startTime)} • ${formatTime(contest.startTime)}
            </span>
          </div>

          <div class="card-body">
            <div class="title-row">

              <img class="platform-logo"
                src="${getPlatformLogo(contest)}"
                onerror="this.src='https://clist.by/static/core/img/default.png'" />

              <div class="contest-title">
                ${contest.name}
              </div>

            </div>
          </div>

          <div class="card-actions">
            <a class="btn-open" href="${contest.url}" target="_blank">
              Open
            </a>

            <button class="savebtn"
                    data-platform="${contest.platform}">
              Create Reminder
            </button>
          </div>

        </div>
      </div>
    `;
    });

    // ----- REMINDER BUTTONS -----
    document.querySelectorAll(".savebtn").forEach((btn) => {
      if (!isUserLoggedIn) {
        btn.disabled = true;
        btn.title = "Connect Google account first";
      }

      btn.onclick = (e) => {
        const platform = e.target.getAttribute("data-platform");
        createReminder(platform);
      };
    });

    // ----- PAGINATION UI -----
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
