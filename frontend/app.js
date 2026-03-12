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

      // otherwise normal create
      await createForSelectedPlatforms();
    };
  }

  // -------------------- Reminder Create --------------------
  async function createReminder(contest) {
    if (!isUserLoggedIn) {
      alert("Connect Google account first to create reminders");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/reminders/contest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contestId: contest.id,
          contestName: contest.name,
          platform: contest.platform,
          startTime: contest.startTime,
          contestLink: contest.url,
          reminderTime: new Date(new Date(contest.startTime).getTime() - 15 * 60000).toISOString() // 15 mins before by default or use alertTime
        }),
      });

      if (res.status === 401) {
        alert("Session expired. Please connect again.");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create reminder");
      
      alert("Reminder added for " + contest.name);
    } catch (err) {
      alert(err.message || "Please connect Google account first");
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
      try {
        const res = await fetch("http://localhost:5000/api/reminders/platform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ platform: p }),
        });
        
        if (res.status === 401) {
          alert("Session expired. Please connect again.");
          return;
        }
      } catch (err) {
        console.error("Failed to subscribe to platform", p, err);
      }
    }
    
    alert("Subscribed to selected platforms!");
    await refreshApp();
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

  function isSaved(contestId) {
    return myReminders.some(
      (r) => r.contestId === contestId && r.active === true,
    );
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
              data-id="${contest.id}">
              ${
                isSaved(contest.id)
                  ? '<span class="active-tag">Scheduled</span>'
                  : "Create Reminder"
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
        const contestId = e.target.getAttribute("data-id");
        const contestObj = contests.find(c => c.id === contestId);

        if (!isUserLoggedIn) {
          alert("Connect Google account first");
          return;
        }

        if (isSaved(contestId)) {
          await deleteUserReminder("contest", contestId);
        } else if (contestObj) {
          await createReminder(contestObj);
        }

        await refreshApp();
        updateMainButtonText();
      };
    });

    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  // -------------------- Saved Reminders Modal --------------------
  const savedReminderBtn = document.getElementById("savedReminderBtn");
  const modal = document.getElementById("savedRemindersModal");
  const closeModal = document.querySelector(".close-modal");
  const remindersLoader = document.getElementById("remindersLoader");
  const remindersList = document.getElementById("remindersList");

  if (savedReminderBtn && modal && closeModal) {
    savedReminderBtn.addEventListener("click", () => {
      if (!isUserLoggedIn) {
        alert("Connect Google account first to view your reminders.");
        return;
      }
      modal.classList.remove("hidden");
      renderSavedReminders();
    });

    closeModal.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    // Close when clicking outside of the modal
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }

  async function renderSavedReminders() {
    remindersList.innerHTML = "";
    remindersLoader.style.display = "block";

    await loadMyReminders(); // ensure we have fresh data
    
    remindersLoader.style.display = "none";

    if (!myReminders || myReminders.length === 0) {
      remindersList.innerHTML = `<p class="empty-msg" style="text-align: center; color: #666;">You don't have any saved reminders yet.</p>`;
      return;
    }

    // Separate active ones; filter out disabled or past reminders if necessary
    const activeReminders = myReminders.filter(r => !r.disabled);
    
    if(activeReminders.length === 0){
        remindersList.innerHTML = `<p class="empty-msg" style="text-align: center; color: #666;">No active reminders found.</p>`;
        return;
    }

    activeReminders.forEach(reminder => {
      const isPlatform = reminder.type === "platform";
      const title = isPlatform ? `${reminder.platform.toUpperCase()} (All Contests)` : reminder.contestName;
      const details = isPlatform 
        ? `Reminding before every contest on ${reminder.platform}` 
        : `${formatDate(reminder.startTime)} • ${formatTime(reminder.startTime)}`;
      
      const badgeClass = isPlatform ? "reminder-type-badge platform" : "reminder-type-badge";
      const badgeText = isPlatform ? "Platform" : "Contest";

      remindersList.innerHTML += `
        <div class="reminder-item" data-id="${reminder._id}">
          <div class="reminder-info">
            <div class="reminder-title">
              <span class="${badgeClass}">${badgeText}</span>
              ${title}
            </div>
            <div class="reminder-details">${details}</div>
          </div>
          <button class="delete-reminder-btn" 
                  data-type="${reminder.type}" 
                  data-target="${isPlatform ? reminder.platform : reminder.contestId}">
            Delete
          </button>
        </div>
      `;
    });

    // Add event listeners to newly created delete buttons
    document.querySelectorAll(".delete-reminder-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const type = e.target.getAttribute("data-type");
        const target = e.target.getAttribute("data-target");
        
        const confirmMsg = type === "platform" 
          ? `Are you sure you want to remove ALL reminders for ${target}?` 
          : "Remove this contest reminder?";
          
        if(confirm(confirmMsg)) {
          e.target.innerText = "Deleting...";
          e.target.disabled = true;
          await deleteUserReminder(type, target);
          await renderSavedReminders(); // Re-render the list
          await refreshApp(); // Refresh main UI
          updateMainButtonText();
        }
      });
    });
  }

  async function deleteUserReminder(type, target) {
    try {
      let url = "";
      if (type === "platform") {
        url = `http://localhost:5000/api/reminders/platform/${target}`;
      } else {
        url = `http://localhost:5000/api/reminders/contest/${target}`;
      }

      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include"
      });
      
      const data = await res.json();
      if(!res.ok) throw new Error(data.message || "Failed to delete");
      
    } catch(err) {
      console.error("Delete reminder error:", err);
      alert("Error deleting reminder: " + err.message);
    }
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
