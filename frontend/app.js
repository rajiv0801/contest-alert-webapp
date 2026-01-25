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

// -------------------- DARK MODE --------------------
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("darkmode-toggle");
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
});

// -------------------- MAIN APP --------------------
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLoginBtn");
  const userEmail = document.getElementById("userEmail");
  const badge = document.getElementById("connectionBadge");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");
  const platformInputs = document.querySelectorAll(".check-container input");
  const alertSelect = document.getElementById("alertTime");
  const contestList = document.getElementById("contestList");
  const loader = document.getElementById("loader");

  let isConnected = false;
  let contests = [];

  //-------------For Refreshing Contest List---------------

  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  let refreshTimer = null;

  // -------------------- Load Contests --------------------
  async function loadContests(showLoader = true) {
    try {
      if (showLoader) {
        loader.classList.remove("hidden");
        contestList.innerHTML = "";
      }

      const response = await fetch("http://localhost:5000/api/contests");
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("Invalid contest payload:", data);
        contestList.innerHTML = `<p class="empty-msg">Invalid data received.</p>`;
        return;
      }

      contests = data;
      renderContests();
    } catch (err) {
      console.error("Failed to load contests:", err.message);
      contestList.innerHTML = `<p class="empty-msg">Failed to load contests.</p>`;
    } finally {
      if (showLoader) {
        loader.classList.add("hidden");
      }
    }
  }

  loadContests();

  refreshTimer = setInterval(() => {
    console.log("Auto refreshing contests...");
    loadContests(false); // silent refresh
  }, REFRESH_INTERVAL);

  // -------------------- Restore Saved State --------------------
  const savedPlatforms = JSON.parse(localStorage.getItem("platforms") || "[]");
  const savedAlert = localStorage.getItem("alertTime");
  const savedConnection = localStorage.getItem("connected");

  platformInputs.forEach((input) => {
    if (savedPlatforms.includes(input.value)) {
      input.checked = true;
    }
  });

  if (savedAlert) {
    alertSelect.value = savedAlert;
  }

  if (savedConnection === "true") {
    connectUI();
  } else {
    disconnectUI();
  }

  // -------------------- Checkbox Change --------------------
  platformInputs.forEach((input) => {
    input.addEventListener("change", renderContests);
  });

  // -------------------- Google Button --------------------
  googleBtn.addEventListener("click", () => {
    if (!isConnected) {
      localStorage.setItem("connected", "true");
      connectUI();
      statusMsg.innerText = "Account connected successfully.";
    } else {
      localStorage.removeItem("connected");
      disconnectUI();
      statusMsg.innerText = "Account disconnected.";
    }
  });

  // -------------------- Save Preferences --------------------
  saveBtn.addEventListener("click", () => {
    const selectedPlatforms = Array.from(platformInputs)
      .filter((i) => i.checked)
      .map((i) => i.value);

    if (selectedPlatforms.length === 0) {
      statusMsg.innerText = "Please select at least one platform.";
      return;
    }

    localStorage.setItem("platforms", JSON.stringify(selectedPlatforms));
    localStorage.setItem("alertTime", alertSelect.value);

    statusMsg.innerText = "Preferences saved successfully.";
  });

  // -------------------- Formatting Helpers --------------------
  function formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString();
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // -------------------- Render Contests --------------------
  function renderContests() {
    contestList.innerHTML = "";

    const selectedPlatforms = Array.from(platformInputs)
      .filter((i) => i.checked)
      .map((i) => i.value);

    if (selectedPlatforms.length === 0) {
      contestList.innerHTML = `<p class="empty-msg">Select a platform to view contests.</p>`;
      return;
    }

    const filtered = contests
      .filter((contest) => {
        const normalized = normalizePlatform(contest.platform);
        return selectedPlatforms.includes(normalized);
      })
      .sort((a, b) => a.startTime - b.startTime);

    if (filtered.length === 0) {
      contestList.innerHTML = `<p class="empty-msg">No contests available.</p>`;
      return;
    }

    filtered.forEach((contest) => {
      const card = document.createElement("div");
      card.className = "contest-card";

      card.innerHTML = `
        <div class="contest-title">${contest.name}</div>
        <div class="contest-meta">
          ${formatDate(contest.startTime)} • ${formatTime(contest.startTime)}
        </div>
        <div class="contest-footer">
          <span class="platform-badge">
            ${normalizePlatform(contest.platform).toUpperCase()}
          </span>
          <a class="contest-link" href="${contest.url}" target="_blank">
            Open
          </a>
        </div>
      `;

      contestList.appendChild(card);
    });
  }

  // -------------------- UI Helpers --------------------
  function connectUI() {
    isConnected = true;
    userEmail.innerText = "Connected: demo@gmail.com";
    googleBtn.innerHTML = `<i class="ri-refresh-line"></i><span>Switch Account</span>`;
    saveBtn.disabled = false;

    badge.innerText = "Connected";
    badge.classList.remove("badge-off");
    badge.classList.add("badge-on");
  }

  function disconnectUI() {
    isConnected = false;
    userEmail.innerText = "Not connected";
    googleBtn.innerHTML = `<i class="ri-google-line"></i><span>Connect Google Account</span>`;
    saveBtn.disabled = true;

    badge.innerText = "Not Connected";
    badge.classList.remove("badge-on");
    badge.classList.add("badge-off");
  }
});
