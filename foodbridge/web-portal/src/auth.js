/**
 * Authentication Module for FoodBridge Web Portal
 * Handles User Login, Registration, Session Management, and Role Switching.
 */

export function initAuth({ api, onUserChange, toast }) {
  let currentUser = JSON.parse(localStorage.getItem("fb_user") || "null");
  let existingUsers = [];

  const modalEl = document.getElementById("auth-modal");
  const modalOverlay = document.getElementById("auth-modal-overlay");
  const loginBtn = document.getElementById("header-login-btn");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userDropdown = document.getElementById("user-dropdown");

  // Fetch registered users list from API if available
  async function loadExistingUsers() {
    try {
      const users = await api("/api/users");
      if (Array.isArray(users)) {
        existingUsers = users;
        renderUserSelectList();
      }
    } catch (_e) {
      // Graceful fallback if endpoint unavailable
    }
  }

  function renderUserSelectList() {
    const select = document.getElementById("existing-user-select");
    if (!select) return;

    if (existingUsers.length === 0) {
      select.innerHTML = `<option value="">No registered accounts found yet</option>`;
      return;
    }

    select.innerHTML = `<option value="">-- Choose Existing User Account --</option>` +
      existingUsers.map(u => `<option value="${u.id}" data-role="${u.role}" data-name="${u.name}" data-org="${u.org || ''}">
        ${u.name} (${u.role.toUpperCase()}${u.org ? ` • ${u.org}` : ''})
      </option>`).join("");
  }

  function updateUserUI() {
    const guestState = document.getElementById("header-guest-state");
    const userState = document.getElementById("header-user-state");
    const avatarRoleBadge = document.getElementById("avatar-role-badge");
    const userAvatarCircle = document.getElementById("user-avatar-circle");
    const dropdownUserName = document.getElementById("dropdown-user-name");
    const dropdownUserOrg = document.getElementById("dropdown-user-org");
    const dropdownRoleBadge = document.getElementById("dropdown-role-badge");
    
    const bannerGuestAlert = document.getElementById("banner-guest-alert");
    const heroGreeting = document.getElementById("hero-user-greeting");

    if (currentUser) {
      if (guestState) guestState.style.display = "none";
      if (userState) userState.style.display = "flex";
      
      const initials = currentUser.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "FB";

      if (userAvatarCircle) userAvatarCircle.textContent = initials;
      if (avatarRoleBadge) {
        avatarRoleBadge.className = `role-badge badge-${currentUser.role}`;
        avatarRoleBadge.textContent = currentUser.role.toUpperCase();
      }

      if (dropdownUserName) dropdownUserName.textContent = currentUser.name;
      if (dropdownUserOrg) dropdownUserOrg.textContent = currentUser.org || `Verified ${currentUser.role.toUpperCase()}`;
      if (dropdownRoleBadge) {
        dropdownRoleBadge.className = `role-badge badge-${currentUser.role}`;
        dropdownRoleBadge.textContent = currentUser.role.toUpperCase();
      }

      if (bannerGuestAlert) bannerGuestAlert.style.display = "none";
      if (heroGreeting) {
        heroGreeting.textContent = `Welcome back, ${currentUser.name}! (${currentUser.role.toUpperCase()} Portal)`;
      }
    } else {
      if (guestState) guestState.style.display = "flex";
      if (userState) userState.style.display = "none";
      if (bannerGuestAlert) bannerGuestAlert.style.display = "flex";
      if (heroGreeting) heroGreeting.textContent = "Connecting Surplus Food to Communities in Need";
    }

    onUserChange(currentUser);
  }

  function openAuthModal(tab = "login") {
    if (!modalEl) return;
    modalEl.classList.add("active");
    if (modalOverlay) modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    switchTab(tab);
    loadExistingUsers();
  }

  function closeAuthModal() {
    if (!modalEl) return;
    modalEl.classList.remove("active");
    if (modalOverlay) modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  function switchTab(tabName) {
    document.querySelectorAll(".auth-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".auth-tab-content").forEach(content => {
      content.classList.toggle("active", content.id === `auth-tab-${tabName}`);
    });
  }

  // Bind Event Listeners
  loginBtn?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("open-login-banner-btn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("auth-modal-close")?.addEventListener("click", closeAuthModal);
  modalOverlay?.addEventListener("click", closeAuthModal);

  // Toggle Header Dropdown
  userMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && !userMenuBtn?.contains(e.target)) {
      userDropdown.classList.remove("active");
    }
  });

  // Tab Switching
  document.querySelectorAll(".auth-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Existing User Selection Auto-fill
  document.getElementById("existing-user-select")?.addEventListener("change", (e) => {
    const selectedOpt = e.target.selectedOptions[0];
    if (selectedOpt && selectedOpt.value) {
      const nameInput = document.getElementById("login-name");
      const roleSelect = document.getElementById("login-role");
      if (nameInput) nameInput.value = selectedOpt.dataset.name || "";
      if (roleSelect) roleSelect.value = selectedOpt.dataset.role || "donor";
    }
  });

  // Login Form Submission
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("login-name")?.value.trim();
    const role = document.getElementById("login-role")?.value;
    const selectedUserId = document.getElementById("existing-user-select")?.value;

    if (!name && !selectedUserId) {
      return toast("Please enter your name or select an account.", "error");
    }

    try {
      let user;
      if (selectedUserId) {
        const found = existingUsers.find(u => Number(u.id) === Number(selectedUserId));
        if (found) {
          user = found;
        }
      }

      if (!user) {
        user = await api("/api/users/login", {
          method: "POST",
          body: { name, role }
        });
      }

      currentUser = user;
      localStorage.setItem("fb_user", JSON.stringify(currentUser));
      updateUserUI();
      closeAuthModal();
      toast(`Successfully authenticated as ${user.name} (${user.role.toUpperCase()})`, "success");
    } catch (err) {
      toast(err.message || "Login failed. Please check credentials.", "error");
    }
  });

  // Registration Form Submission
  document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name")?.value.trim();
    const role = document.getElementById("reg-role")?.value;
    const org = document.getElementById("reg-org")?.value.trim();

    if (!name || !role) {
      return toast("Full Name and Role Persona are required.", "error");
    }

    try {
      const user = await api("/api/users", {
        method: "POST",
        body: { name, role, org }
      });

      currentUser = user;
      localStorage.setItem("fb_user", JSON.stringify(currentUser));
      updateUserUI();
      closeAuthModal();
      toast(`Account created! Welcome, ${user.name} (${user.role.toUpperCase()})`, "success");
    } catch (err) {
      toast(err.message || "Registration failed.", "error");
    }
  });

  // Quick Demo Persona Selection
  document.querySelectorAll(".quick-persona-card").forEach(card => {
    card.addEventListener("click", async () => {
      const role = card.dataset.role;
      const name = card.dataset.name;
      const org = card.dataset.org;

      try {
        const user = await api("/api/users/login", {
          method: "POST",
          body: { name, role, org }
        });

        currentUser = user;
        localStorage.setItem("fb_user", JSON.stringify(currentUser));
        updateUserUI();
        closeAuthModal();
        toast(`Signed in as Demo ${role.toUpperCase()}: ${user.name}`, "success");
      } catch (err) {
        toast("Failed demo login: " + err.message, "error");
      }
    });
  });

  // Logout Handlers
  const logoutAction = () => {
    localStorage.removeItem("fb_user");
    currentUser = null;
    userDropdown?.classList.remove("active");
    updateUserUI();
    toast("Signed out successfully. Portal switched to guest view.", "info");
  };

  document.getElementById("dropdown-logout-btn")?.addEventListener("click", logoutAction);
  document.getElementById("dropdown-switch-role-btn")?.addEventListener("click", () => {
    userDropdown?.classList.remove("active");
    openAuthModal("quick");
  });

  // Initial Sync
  updateUserUI();
  loadExistingUsers();

  return {
    getUser: () => currentUser,
    openAuthModal,
    closeAuthModal,
    updateUserUI,
  };
}
