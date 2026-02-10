let selectedContest = null;
let isUserLoggedIn = false;
let myReminders = [];

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

  const googleBtn = document.getElementById("loginBtn");

  const mainSaveBtn = document.getElementById("saveBtn");

  if (mainSaveBtn) {
    mainSaveBtn.onclick = async () => {
      if (!isUserLoggedIn) {
        alert("Connect Google account first");
        return;
      }

      // If ANY platform already saved → act as STOP ALL
      if (myReminders.length > 0) {
        const ok = confirm("Disable all scheduled reminders?");
        if (!ok) return;

        await deleteAllReminders();
        return;
      }

      // otherwise normal create
      await createForSelectedPlatforms();
    };
  }

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

  async function createForSelectedPlatforms() {
    if (!isUserLoggedIn) {
      alert("Connect Google account first");
      return;
    }

    const platforms = getSelectedPlatforms();

    if (platforms.length === 0) {
      alert("Select at least one platform checkbox");
      return;
    }

    for (const p of platforms) {
      await createReminder(p);
    }

    await refreshApp();
  }

  // -------------------- DELETE REMINDER --------------------
  async function deleteAllReminders() {
    try {
      await fetch("http://localhost:5000/api/reminders/clear/all", {
        method: "DELETE",
        credentials: "include",
      });

      myReminders = [];
      await renderContests();
    } catch (err) {
      alert("Unable to remove reminders");
    }
  }

  //---------------------- LOAD REMINDER ---------------
  async function loadMyReminders() {
    try {
      const res = await fetch("http://localhost:5000/api/reminders/my", {
        credentials: "include",
      });

      myReminders = await res.json();
    } catch {
      myReminders = [];
    }
  }

  function isSaved(platform) {
    return myReminders.some((r) => r.platform === platform);
  }

  async function refreshApp() {
    await loadMyReminders();
    renderContests();
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

        const loginBtn = document.getElementById("loginBtn");
        if (loginBtn) loginBtn.style.display = "none";

        const badge = document.getElementById("connectionBadge");
        if (badge) {
          badge.innerText = "Connected";
          badge.classList.remove("badge-off");
          badge.classList.add("badge-on");
        }

        document.getElementById("guestText")?.classList.add("hidden");
        document.getElementById("userInfo")?.classList.remove("hidden");

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

        const reminderBtn = document.getElementById("saveBtn");
        if (reminderBtn) {
          reminderBtn.disabled = false;
          reminderBtn.title = "";
        }

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

  function updateMainButtonText() {
  const btn = document.getElementById("saveBtn");
  if (!btn) return;

  if (myReminders.length > 0) {
    btn.innerText = "Stop All Reminders";
  } else {
    btn.innerText = "Create Reminders";
  }
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
  loadMyReminders(); // NEW

  platformInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentPage = 1;
      renderContests();
    });
  });

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

    // mark checkboxes if already scheduled
    platformInputs.forEach((input) => {
      const p = input.value.toLowerCase();
      if (isSaved(p)) {
        input.parentElement.classList.add("active-platform");
      } else {
        input.parentElement.classList.remove("active-platform");
      }
    });

    if (selectedPlatforms.length === 0) {
      pageInfo.innerText = "";
      contestList.innerHTML = `<p class="empty-msg">Select at least one platform.</p>`;
      return;
    }

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

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

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
                    ${
                      isSaved(contest.platform)
                        ? '<span class="active-tag">Scheduled</span>'
                        : ""
                    }
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

      btn.onclick = async (e) => {
        const platform = e.target.getAttribute("data-platform");

        if (!isUserLoggedIn) {
          alert("Connect Google account first");
          return;
        }

        if (isSaved(platform)) {
          await deleteReminder(platform);
        } else {
          await createReminder(platform);
        }

        await refreshApp();
        updateMainButtonText();

      };
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
