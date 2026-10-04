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
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        fireworksCanvas.width = Math.floor(window.innerWidth * pixelRatio);
        fireworksCanvas.height = Math.floor(window.innerHeight * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const createBurst = (x, y) => {
        const burstHues = [42, 52, 185, 195, 330, 280];
        const hue = burstHues[Math.floor(Math.random() * burstHues.length)];
        const particleCount = 64;

        for (let index = 0; index < particleCount; index += 1) {
            const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.1;
            const speed = 1.6 + Math.random() * 4.7;
            particles.push({
                x,
                y,
                previousX: x,
                previousY: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                life: 65 + Math.random() * 45,
                hue: (hue + Math.random() * 28 - 14 + 360) % 360,
                size: 1.7 + Math.random() * 2.4
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
        context.globalCompositeOperation = "lighter";

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];
            particle.previousX = particle.x;
            particle.previousY = particle.y;
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
            context.globalAlpha = Math.min(particle.life / 28, 1);
            context.strokeStyle = `hsl(${particle.hue}, 100%, 72%)`;
            context.lineWidth = particle.size;
            context.lineCap = "round";
            context.moveTo(particle.previousX, particle.previousY);
            context.lineTo(particle.x, particle.y);
            context.stroke();
        }

        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
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
    launchRandomBurst();
    const automaticShow = window.setInterval(launchRandomBurst, 520);
    window.setTimeout(() => {
        window.clearInterval(automaticShow);
        fireworksEnabled = true;
        fireworksStatus.hidden = false;
    }, 5000);

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", event => {
        if (!fireworksEnabled || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
        if (event.timeStamp - lastPointerBurstTime < 32) return;

        lastPointerBurstTime = event.timeStamp;
        launchAt(event.clientX, event.clientY);
    });
    window.addEventListener("pointerdown", event => {
        if (!fireworksEnabled) return;
        launchAt(event.clientX, event.clientY);
    });
}