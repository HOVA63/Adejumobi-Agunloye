const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

document.documentElement.dataset.theme = initialTheme;

const themeToggle = document.querySelector("[data-theme-toggle]");

if (themeToggle) {
    const updateThemeLabel = () => {
        const isDark = document.documentElement.dataset.theme === "dark";
        themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
        themeToggle.setAttribute("title", `Switch to ${isDark ? "light" : "dark"} mode`);
    };

    updateThemeLabel();

    themeToggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = nextTheme;
        localStorage.setItem("theme", nextTheme);
        updateThemeLabel();
    });
}

async function loadItems() {
    const response = await fetch("books.json");
    const items = await response.json();

    const container = document.getElementById("books");

    container.innerHTML = items.map(item => `
        <div class="img">
            <a href="${item.link}" target="_blank">
                <img src="${item.img}" alt="${item.title}">
                <p>${item.title}</p>
            </a>
        </div>
    `).join("");
}
loadItems();

async function loadlinks() {
    const response = await fetch("svg.json");
    const items = await response.json();

    const container = document.getElementById("links");

    container.innerHTML = items.map(item => `
        <div class="svg">
            <a href="${item.href}" aria-label="${item["aria-label"]}" target="_blank" rel="noopener noreferrer">
                ${item.svg}
            </a>
        </div>
    `).join("");
}
loadlinks();