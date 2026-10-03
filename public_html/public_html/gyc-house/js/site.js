/**
 * GYC House — shared site behaviour (nav, reveals, forms)
 */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile nav */
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-nav-mobile]");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Scroll reveals */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* Year in footer */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /**
   * Forms: validate with HTML5, store payload in localStorage,
   * show success, optionally open mailto for ops handoff.
   */
  document.querySelectorAll("form[data-gyc-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      if (!form.checkValidity()) {
        form.reportValidity();
        if (status) {
          status.className = "form-status show err";
          status.textContent = "Please complete the required fields.";
        }
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      data._form = form.getAttribute("data-gyc-form");
      data._submittedAt = new Date().toISOString();
      data._page = location.pathname;

      try {
        const key = "gyc-house-submissions";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push(data);
        localStorage.setItem(key, JSON.stringify(prev));
      } catch {
        /* private mode etc. */
      }

      if (status) {
        status.className = "form-status show ok";
        status.innerHTML =
          form.getAttribute("data-success") ||
          "Thanks — we received your submission. We aim to reply within 5 business days.";
      }

      form.reset();

      /* Optional ops handoff via mailto if data-mailto is set */
      const mail = form.getAttribute("data-mailto");
      if (mail) {
        const subject = encodeURIComponent(
          form.getAttribute("data-mail-subject") || "GYC House inquiry"
        );
        const body = encodeURIComponent(
          Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        );
        /* Delay so user sees success first */
        setTimeout(() => {
          window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`;
        }, 400);
      }
    });
  });
})();
