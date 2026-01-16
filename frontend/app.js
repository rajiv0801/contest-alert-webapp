
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
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
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
