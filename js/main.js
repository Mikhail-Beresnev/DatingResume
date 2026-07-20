// Mobile nav toggle
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });

  // Highlight the active page in the nav
  const current = window.location.pathname.split("/").pop() || "index.html";
  links.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });
}

// Fade-in-on-scroll for elements with .reveal
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

// Apply form: client-side validation + mock submit
function initApplyForm() {
  const form = document.getElementById("apply-form");
  if (!form) return;

  const successBanner = document.getElementById("success-banner");
  const errorBanner = document.getElementById("error-banner");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll("[required]").forEach((input) => {
      const field = input.closest(".field");
      const isEmpty = !input.value || !input.value.trim();
      if (isEmpty) {
        valid = false;
        field.classList.add("invalid");
      } else {
        field.classList.remove("invalid");
      }
    });

    const email = form.querySelector("#email");
    if (email && email.value && !/^\S+@\S+\.\S+$/.test(email.value)) {
      valid = false;
      email.closest(".field").classList.add("invalid");
    }

    successBanner.classList.remove("show");
    errorBanner.classList.remove("show");

    if (!valid) {
      return;
    }

    submitBtn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      successBanner.classList.add("show");
      successBanner.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      errorBanner.classList.add("show");
      errorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// Expandable hobby cards on the About Me page
function initHobbies() {
  const toggles = document.querySelectorAll(".hobby-toggle");
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    const panel = btn.nextElementSibling;
    const inner = panel.querySelector(".hobby-panel-inner");

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? "0px" : inner.scrollHeight + "px";
    });
  });

  // Keep open panels correctly sized if the window is resized
  window.addEventListener("resize", () => {
    toggles.forEach((btn) => {
      if (btn.getAttribute("aria-expanded") === "true") {
        const panel = btn.nextElementSibling;
        panel.style.maxHeight = panel.querySelector(".hobby-panel-inner").scrollHeight + "px";
      }
    });
  });
}

// Expandable must-have / nice-to-have points on the Looking For page
function initPoints() {
  const toggles = document.querySelectorAll(".point-toggle");
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    const panel = btn.nextElementSibling;
    const inner = panel.querySelector(".point-panel-inner");

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? "0px" : inner.scrollHeight + "px";
    });
  });
}

// Expandable quick-fact cards on the About Me page
function initFacts() {
  const toggles = document.querySelectorAll("button.fact-toggle");
  if (!toggles.length) return;

  toggles.forEach((btn) => {
    const panel = btn.nextElementSibling;
    if (!panel || !panel.classList.contains("fact-panel")) return;
    const inner = panel.querySelector(".fact-panel-inner");

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = isOpen ? "0px" : inner.scrollHeight + "px";
    });
  });
}

// Clicking a photo in "A Few Photos of Me" expands it front-and-center,
// bumping the rest of the photos into a row below.
//
// order/flex-basis/width changes triggered by swapping classes are not
// individually animatable in a way that stays in sync with each other, so
// this uses the FLIP technique: measure each item's position/size before the
// change (First), let the class swap snap instantly (Last), then apply an
// inverse transform and animate it away to "" (Invert, Play). That turns any
// instant layout jump into a smooth, synchronized transform animation.
function initPhotoGallery() {
  const grid = document.querySelector(".photo-grid");
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll(".photo-item"));

  function flip(mutate) {
    const firstRects = items.map((item) => item.getBoundingClientRect());

    items.forEach((item) => {
      item.style.transition = "none";
      item.style.transform = "none";
    });

    mutate();

    items.forEach((item, i) => {
      const first = firstRects[i];
      const last = item.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = last.width ? first.width / last.width : 1;
      const sy = last.height ? first.height / last.height : 1;

      item.style.transformOrigin = "top left";
      item.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    });

    // Force a reflow so the browser registers the inverted transform above
    // before we animate it away — otherwise both would apply in one frame.
    grid.getBoundingClientRect();

    requestAnimationFrame(() => {
      items.forEach((item) => {
        item.style.transition = "transform 0.4s ease";
        item.style.transform = "";
      });
    });
  }

  items.forEach((item) => {
    item.addEventListener("transitionend", (e) => {
      if (e.propertyName === "transform") item.style.transition = "";
    });

    const slot = item.querySelector(".photo-slot");
    slot.addEventListener("click", () => {
      const alreadyFeatured = item.classList.contains("is-featured");

      flip(() => {
        items.forEach((other) => other.classList.remove("is-featured"));
        if (alreadyFeatured) {
          grid.classList.remove("gallery-active");
        } else {
          item.classList.add("is-featured");
          grid.classList.add("gallery-active");
        }
      });

      if (!alreadyFeatured) {
        item.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  initApplyForm();
  initHobbies();
  initFacts();
  initPoints();
  initPhotoGallery();
});
