console.log("JS Loaded");

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("darkmode-toggle");

    if (!themeToggle) {
        console.error("Toggle element not found");
        return;
    }

    themeToggle.addEventListener("change", () => {
        console.log("Toggle clicked:", themeToggle.checked);
        document.body.classList.toggle("dark", themeToggle.checked);
    });
});
