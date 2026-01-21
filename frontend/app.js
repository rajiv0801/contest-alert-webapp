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

  let isConnected = false;

  // -------------------- Mock Contest Data --------------------
  let contests = [];

  async function loadContests() {
    const result = await res.json();
    if (!Array.isArray(result)) {
      console.error("Invalid contest response:", result);
      contests = [];
      return;
    }
    contests = result;

    console.log("Contests loaded:", contests);
    console.log("Count:", contests.length);

    renderContests();
  }

  loadContests();

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

  renderContests(); // initial render

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

  //------------------For Farmating dd/mm/yyyy-------------------

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // -------------------- Render Contests --------------------
  function renderContests() {
    contestList.innerHTML = "";

    const selectedPlatforms = Array.from(platformInputs)
      .filter((i) => i.checked)
      .map((i) => i.value);

    if (selectedPlatforms.length === 0) {
      contestList.innerHTML = `
        <p class="empty-msg">Select a platform to view contests.</p>
      `;
      return;
    }

    const filtered = contests
      .filter((contest) =>
        selectedPlatforms.includes(contest.platform.toLowerCase()),
      )
      .sort((a, b) => a.startTime - b.startTime);

    if (filtered.length === 0) {
      contestList.innerHTML = `
        <p class="empty-msg">No contests available.</p>
      `;
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
          <span class="platform-badge">${contest.platform.toUpperCase()}</span>
          <span class="reminder-text">Reminder preview</span>
        </div>
      `;

      contestList.appendChild(card);
    });
  }

  // -------------------- UI Helpers --------------------
  function connectUI() {
    isConnected = true;

    userEmail.innerText = "Connected: ananya@gmail.com";
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
