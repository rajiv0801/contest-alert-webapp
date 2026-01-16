//This is for dark mode
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("darkmode-toggle");
  const savedTheme = localStorage.getItem("theme");
  // If user already selected a theme
  if (savedTheme) {
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      themeToggle.checked = true;
    }
  }
  // Otherwise follow system preference
  else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) {
      document.body.classList.add("dark");
      themeToggle.checked = true;
    }
  }
  // Toggle handler
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

const googleBtn = document.getElementById("googleLoginBtn");
const userEmail = document.getElementById("userEmail");

googleBtn.addEventListener("click", () => {
  userEmail.innerText = "Connected: example@gmail.com";
});

// This is for saving the platform preference

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLoginBtn");
  const userEmail = document.getElementById("userEmail");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");
  const platformInputs = document.querySelectorAll(".check-container input");
  const alertSelect = document.getElementById("alertTime");

  let isConnected = false;

  // ---------- Restore Saved State ----------
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

  // ---------- Google Button Click ----------
  googleBtn.addEventListener("click", () => {
    if (!isConnected) {
      // Simulate connect
      localStorage.setItem("connected", "true");
      connectUI();
      statusMsg.innerText = "Account connected successfully.";
    } else {
      // Switch account (disconnect)
      localStorage.removeItem("connected");
      disconnectUI();
      statusMsg.innerText = "Account disconnected. You can connect again.";
    }
  });

  // ---------- Save Preferences ----------
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

  // ---------- UI Helpers ----------
  function connectUI() {
    isConnected = true;
    userEmail.innerText = "Connected: user@gmail.com";
    googleBtn.innerHTML = `<i class="ri-refresh-line"></i><span>Switch Account</span>`;
    saveBtn.disabled = false;
  }

  function disconnectUI() {
    isConnected = false;
    userEmail.innerText = "Not connected";
    googleBtn.innerHTML = `<i class="ri-google-line"></i><span>Connect Google Account</span>`;
    saveBtn.disabled = true;
  }
});
