document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const backToTop = document.getElementById("backToTop");
  const contactForm = document.getElementById("contactForm");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });

  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("visible", window.scrollY > 400);
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      projectCards.forEach((card) => {
        if (filter === "all" || card.dataset.category === filter) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) return;

    const btn = contactForm.querySelector(".btn");
    const originalText = btn.textContent;
    btn.textContent = "发送成功!";
    btn.style.background = "#22c55e";

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
      contactForm.reset();
    }, 2000);
  });

  const animateNumbers = () => {
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseInt(el.dataset.target);
      const duration = 1500;
      const step = target / (duration / 16);
      let current = 0;

      const update = () => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          return;
        }
        el.textContent = Math.floor(current);
        requestAnimationFrame(update);
      };
      update();
    });
  };

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

  document.querySelectorAll(".skill-card, .project-card, .about-text, .about-avatar, .contact-info, .contact-form").forEach((el) => {
    el.classList.add("fade-in");
    observer.observe(el);
  });

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumbers();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  const statsSection = document.querySelector(".about-stats");
  if (statsSection) statsObserver.observe(statsSection);
});
