const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const backdrop = document.querySelector(".nav-backdrop");
const navLinks = document.querySelectorAll(".nav-list a");

function closeMenu() {
  if (!menuToggle || !nav) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Apri menu");

  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");

  if (backdrop) {
    backdrop.hidden = true;
  }
}

function openMenu() {
  if (!menuToggle || !nav) return;

  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Chiudi menu");

  nav.classList.add("is-open");
  document.body.classList.add("menu-open");

  if (backdrop) {
    backdrop.hidden = false;
  }
}

menuToggle?.addEventListener("click", () => {
  const isOpen =
    menuToggle.getAttribute("aria-expanded") === "true";

  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

backdrop?.addEventListener("click", closeMenu);

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});


/* =========================
   REVEAL ANIMATIONS
========================= */

const revealElements =
  document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {

  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");

          observer.unobserve(entry.target);
        });

      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

} else {

  revealElements.forEach((element) => {
    element.classList.add("visible");
  });

}


/* =========================
   ACCORDION SERVIZI
   Una sola categoria aperta
   alla volta.
========================= */

const serviceGroups =
  document.querySelectorAll(
    "details.service-group"
  );

serviceGroups.forEach((group) => {

  group.addEventListener("toggle", () => {

    if (!group.open) return;

    serviceGroups.forEach((otherGroup) => {

      if (otherGroup !== group) {
        otherGroup.open = false;
      }

    });

  });

});