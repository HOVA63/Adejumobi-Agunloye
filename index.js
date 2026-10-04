const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

document.documentElement.dataset.theme = initialTheme;

document.querySelectorAll(".menu-toggle").forEach(menuToggle => {
    const navigation = menuToggle.closest(".header-limit");

    menuToggle.addEventListener("click", () => {
        const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isExpanded));
        menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
        navigation.classList.toggle("menu-open", !isExpanded);
    });
});

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
    const container = document.getElementById("books");
    if (!container) return;

    const response = await fetch("books.json");
    const items = await response.json();

    container.innerHTML = items.map(item => `
        <div class="img">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
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

    const markup = items.map(item => `
        <div class="svg">
            <a href="${item.href}" aria-label="${item["aria-label"]}" target="_blank" rel="noopener noreferrer">
                ${item.svg}
            </a>
        </div>
    `).join("");

    document.querySelectorAll(".social-media_links").forEach(container => {
        container.innerHTML = markup;
    });
}
loadlinks();

const fireworksCanvas = document.querySelector("[data-fireworks-canvas]");
const fireworksStatus = document.querySelector("[data-fireworks-status]");

if (fireworksCanvas && fireworksStatus) {
    const context = fireworksCanvas.getContext("2d");
    const particles = [];
    let animationFrame;
    let lastFrameTime = 0;
    let lastPointerBurstTime = 0;
    let fireworksEnabled = false;

    const resizeCanvas = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        fireworksCanvas.width = Math.floor(window.innerWidth * pixelRatio);
        fireworksCanvas.height = Math.floor(window.innerHeight * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const createBurst = (x, y) => {
        const hue = Math.floor(Math.random() * 360);
        const particleCount = 54;

        for (let index = 0; index < particleCount; index += 1) {
            const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.12;
            const speed = 1.2 + Math.random() * 3.6;
            particles.push({
                x,
                y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                life: 55 + Math.random() * 35,
                hue: (hue + Math.random() * 34 - 17 + 360) % 360,
                size: 1.2 + Math.random() * 1.8
            });
        }
    };

    const launchAt = (x, y) => {
        createBurst(x, y);
        if (!animationFrame) {
            lastFrameTime = 0;
            animationFrame = window.requestAnimationFrame(animateFireworks);
        }
    };

    const animateFireworks = (time) => {
        if (!context) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const delta = Math.min((time - (lastFrameTime || time)) / 16.67, 2);
        lastFrameTime = time;

        context.clearRect(0, 0, width, height);

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];
            particle.x += particle.velocityX * delta;
            particle.y += particle.velocityY * delta;
            particle.velocityX *= 0.985;
            particle.velocityY = particle.velocityY * 0.985 + 0.035 * delta;
            particle.life -= delta;

            if (particle.life <= 0) {
                particles.splice(index, 1);
                continue;
            }

            context.beginPath();
            context.fillStyle = `hsla(${particle.hue}, 100%, 68%, ${Math.min(particle.life / 24, 1)})`;
            context.shadowBlur = 14;
            context.shadowColor = `hsl(${particle.hue}, 100%, 65%)`;
            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            context.fill();
        }

        context.shadowBlur = 0;
        animationFrame = particles.length ? window.requestAnimationFrame(animateFireworks) : null;
    };

    const launchRandomBurst = () => {
        launchAt(
            window.innerWidth * (0.12 + Math.random() * 0.76),
            window.innerHeight * (0.16 + Math.random() * 0.42)
        );
    };

    resizeCanvas();
    launchRandomBurst();
    const automaticShow = window.setInterval(launchRandomBurst, 650);
    window.setTimeout(() => {
        window.clearInterval(automaticShow);
        fireworksEnabled = true;
        fireworksStatus.hidden = false;
    }, 5000);

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", event => {
        if (!fireworksEnabled || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
        if (event.timeStamp - lastPointerBurstTime < 75) return;

        lastPointerBurstTime = event.timeStamp;
        launchAt(event.clientX, event.clientY);
    });
    window.addEventListener("pointerdown", event => {
        if (!fireworksEnabled) return;
        launchAt(event.clientX, event.clientY);
    });
}