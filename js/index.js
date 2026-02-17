/* ===============================
   1) Vidéo : ralentir la lecture
   =============================== */
const video = document.querySelector(".hero__video");
if (video) {
  video.playbackRate = 0.9;
}

/* ===============================
   2) Navbar : style au scroll
   =============================== */
const navbar = document.querySelector(".navbar");

function handleNavbarScroll() {
  if (!navbar) return;
  if (window.scrollY > 60) navbar.classList.add("scrolled");
  else navbar.classList.remove("scrolled");
}

window.addEventListener("scroll", handleNavbarScroll);
handleNavbarScroll();

/* ===============================
   2.5) Burger menu (mobile)
   =============================== */
const navbarBurger = document.getElementById("navbarBurger");
const navbarMobileMenu = document.getElementById("navbarMobileMenu");
const mobileMenuLinks = navbarMobileMenu?.querySelectorAll(".navbar__link") || [];

function toggleBurger() {
  const isOpen = navbarBurger.classList.toggle("is-active");
  navbarMobileMenu?.classList.toggle("is-open", isOpen);
  navbarBurger?.setAttribute("aria-expanded", isOpen);
}

function closeBurger() {
  navbarBurger?.classList.remove("is-active");
  navbarMobileMenu?.classList.remove("is-open");
  navbarBurger?.setAttribute("aria-expanded", "false");
}

navbarBurger?.addEventListener("click", toggleBurger);

// Fermer le menu quand on clique sur un lien
mobileMenuLinks.forEach((link) => {
  link.addEventListener("click", closeBurger);
});

// Fermer le menu au scroll
window.addEventListener("scroll", closeBurger);

/* ===============================
   3) Toasts futuristes (remplace alert)
   Nécessite : <div id="toastContainer" class="toast-container"></div>
   =============================== */
function showToast(type, title, message, duration = 2400) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const icon = type === "success" ? "✓" : type === "error" ? "!" : "i";

  toast.innerHTML = `
    <div class="toast__icon">${icon}</div>
    <div>
      <p class="toast__title">${title}</p>
      <p class="toast__msg">${message}</p>
    </div>
    <button class="toast__close" type="button" aria-label="Close">×</button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector(".toast__close");
  const removeToast = () => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };

  closeBtn.addEventListener("click", removeToast);
  setTimeout(removeToast, duration);
}

/* ===============================
   4) Reveal au scroll (IntersectionObserver)
   =============================== */
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length > 0) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealEls.forEach((el) => io.observe(el));
}

/* ===============================
   5) LocalStorage utils (users + currentUser)
   =============================== */
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function getCurrentUserSafe() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}

/* ===============================
   6) Switch formulaires (tabs + liens)
   =============================== */
const tabs = document.querySelectorAll(".auth__tab");
const forms = document.querySelectorAll(".auth__form");
const switchButtons = document.querySelectorAll("[data-switch]");

function setActiveForm(target) {
  if (tabs.length === 0 || forms.length === 0) return;

  tabs.forEach((t) =>
    t.classList.toggle("is-active", t.dataset.target === target)
  );

  forms.forEach((f) =>
    f.classList.toggle("is-active", f.dataset.form === target)
  );
}

if (tabs.length > 0) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveForm(tab.dataset.target));
  });
}

if (switchButtons.length > 0) {
  switchButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveForm(btn.dataset.switch));
  });
}

/* ===============================
   Floating profile (FAB + panel)
   =============================== */
const profileFab = document.getElementById("profileFab");
const profilePanel = document.getElementById("profilePanel");
const profileBackdrop = document.getElementById("profileBackdrop");
const profileClose = document.getElementById("profileClose");
const profileLogout = document.getElementById("profileLogout");

const profileInitial = document.getElementById("profileInitial");
const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileStatus = document.getElementById("profileStatus");

function openProfile() {
  profilePanel?.classList.add("is-open");
  profileBackdrop?.classList.add("is-open");
  profilePanel?.setAttribute("aria-hidden", "false");
}

function closeProfile() {
  profilePanel?.classList.remove("is-open");
  profileBackdrop?.classList.remove("is-open");
  profilePanel?.setAttribute("aria-hidden", "true");
}

/* ===============================
   Navbar Auth (Connexion <-> Profil)
   =============================== */
const navAuthLink = document.getElementById("navAuthLink");
const navAuthLinkMobile = document.getElementById("navAuthLinkMobile");

function updateNavbarAuth() {
  if (!navAuthLink) return;

  const user = getCurrentUserSafe();

  if (user && user.username) {
    navAuthLink.textContent = "Profil";
    navAuthLink.href = "#";
    navAuthLink.onclick = (e) => {
      e.preventDefault();
      openProfile?.();
    };

    if (navAuthLinkMobile) {
      navAuthLinkMobile.textContent = "Profil";
      navAuthLinkMobile.href = "#";
      navAuthLinkMobile.onclick = (e) => {
        e.preventDefault();
        closeBurger();
        openProfile?.();
      };
    }
  } else {
    navAuthLink.textContent = "Connexion";
    navAuthLink.href = "#login";
    navAuthLink.onclick = null;

    if (navAuthLinkMobile) {
      navAuthLinkMobile.textContent = "Connexion";
      navAuthLinkMobile.href = "#login";
      navAuthLinkMobile.onclick = null;
    }
  }
}

/* ===============================
   Update UI Profile (rond + panel)
   =============================== */
function updateProfileUI() {
  const user = getCurrentUserSafe();

  if (user && user.username) {
    const initial = user.username.trim().charAt(0).toUpperCase();
    if (profileInitial) profileInitial.textContent = initial;
    if (profileAvatar) profileAvatar.textContent = initial;
    if (profileName) profileName.textContent = user.username;
    if (profileStatus) profileStatus.textContent = "Connecté";
    if (profileFab) profileFab.classList.add("is-auth");
    if (profileLogout) profileLogout.style.display = "block";
  } else {
    if (profileInitial) profileInitial.textContent = "?";
    if (profileAvatar) profileAvatar.textContent = "?";
    if (profileName) profileName.textContent = "Invité";
    if (profileStatus) profileStatus.textContent = "Non connecté";
    if (profileFab) profileFab.classList.remove("is-auth");
    if (profileLogout) profileLogout.style.display = "none";
  }
}

updateProfileUI();

profileFab?.addEventListener("click", () => {
  updateProfileUI();
  openProfile();
});

profileClose?.addEventListener("click", closeProfile);
profileBackdrop?.addEventListener("click", closeProfile);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProfile();
});

/* ===============================
   Auth UI state (guest vs connected)
   =============================== */
const authCard = document.querySelector(".auth__card");
const userAvatar = document.getElementById("userAvatar");
const userNameEl = document.getElementById("userName");
const scoreGame1 = document.getElementById("scoreGame1");
const scoreGame2 = document.getElementById("scoreGame2");
const scoreGame3 = document.getElementById("scoreGame3");
const btnLogout = document.getElementById("btnLogout");

function getUserScores(email) {
  const key = `scores_${email}`;
  try {
    return (
      JSON.parse(localStorage.getItem(key)) || { game1: 0, game2: 0, game3: 0 }
    );
  } catch {
    return { game1: 0, game2: 0, game3: 0 };
  }
}

function renderAuthState() {
  if (!authCard) return;

  const user = getCurrentUserSafe();

  if (user && user.username && user.email) {
    authCard.classList.add("is-auth");

    const initial = user.username.trim().charAt(0).toUpperCase();
    if (userAvatar) userAvatar.textContent = initial;
    if (userNameEl) userNameEl.textContent = user.username;

    const scores = getUserScores(user.email);
    if (scoreGame1) scoreGame1.textContent = scores.game1 ?? 0;
    if (scoreGame2) scoreGame2.textContent = scores.game2 ?? 0;
    if (scoreGame3) scoreGame3.textContent = scores.game3 ?? 0;
  } else {
    authCard.classList.remove("is-auth");

    // option: remettre sur login quand on redevient invité
    setActiveForm("login");
  }
}

/* ===============================
   LOGOUT unique (la vraie déconnexion)
   =============================== */
function logout() {
  localStorage.removeItem("currentUser");

  // sync UI partout
  updateProfileUI();
  renderAuthState();
  updateNavbarAuth();

  // UX
  closeProfile?.();
  showToast("info", "Déconnexion", "Tu es maintenant déconnecté.");
}

/* Boutons logout (panel + card) */
profileLogout?.addEventListener("click", logout);

if (btnLogout) {
  btnLogout.addEventListener("click", logout);
}

/* ===============================
   7) Form Register : création de compte + stockage
   =============================== */
const registerForm = document.querySelector('[data-form="register"]');

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = registerForm.username.value.trim();
    const email = registerForm.email.value.trim().toLowerCase();
    const password = registerForm.password.value;
    const confirm = registerForm.confirm.value;

    if (password !== confirm) {
      showToast("error", "Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    const users = getUsers();

    const userExists = users.some((u) => u.email === email);
    if (userExists) {
      showToast("error", "Compte existant", "Cet email est déjà utilisé. Connecte-toi.");
      return;
    }

    const newUser = { username, email, password };
    users.push(newUser);
    saveUsers(users);

    setCurrentUser(newUser);

    // sync UI
    updateProfileUI();
    renderAuthState();
    updateNavbarAuth();

    showToast("success", "Compte créé", "Bienvenue ! Tu es connecté.");
    registerForm.reset();
    setActiveForm("login");
  });
}

/* ===============================
   8) Form Login : connexion + currentUser
   =============================== */
const loginForm = document.querySelector('[data-form="login"]');

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;

    const users = getUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      showToast("error", "Connexion refusée", "Email ou mot de passe incorrect.");
      return;
    }

    setCurrentUser(user);

    // sync UI
    updateProfileUI();
    renderAuthState();
    updateNavbarAuth();

    showToast("success", "Connexion OK", `Bienvenue ${user.username} !`);
    loginForm.reset();
  });
}

/* ===============================
   Games carousel (3 cards)
   =============================== */
const track = document.getElementById("gameTrack");
const prevBtn = document.getElementById("prevGame");
const nextBtn = document.getElementById("nextGame");
const dotsWrap = document.getElementById("gameDots");

if (track && prevBtn && nextBtn && dotsWrap) {
  const slides = Array.from(track.children);
  let index = 0;

  // crée les dots
  dotsWrap.innerHTML = slides
    .map((_, i) => `<button class="carousel__dot ${i === 0 ? "is-active" : ""}" data-index="${i}" aria-label="Aller au jeu ${i + 1}"></button>`)
    .join("");

  const dots = Array.from(dotsWrap.querySelectorAll(".carousel__dot"));

  function updateCarousel() {
    track.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));

    // si tu veux bloquer aux extrémités :
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
  }

  prevBtn.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    updateCarousel();
  });

  nextBtn.addEventListener("click", () => {
    index = Math.min(slides.length - 1, index + 1);
    updateCarousel();
  });

  dotsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".carousel__dot");
    if (!btn) return;
    index = Number(btn.dataset.index);
    updateCarousel();
  });

  // navigation clavier (optionnel)
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
  });

  updateCarousel();
}

//Init (au chargement)
renderAuthState();
updateNavbarAuth();

/* Debug */
const currentUser = getCurrentUser();
if (currentUser) console.log("Utilisateur connecté :", currentUser.username);
else console.log("Aucun utilisateur connecté");