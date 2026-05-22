"use strict";
window.API_URL = window.API_URL || localStorage.getItem("apiUrl") || "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", function () {
    function getDisplayName(user) {
        return [user?.name, user?.lastName].filter(Boolean).join(" ") || user?.email || "Hesab";
    }

    function clearSession() {
        ["token", "user", "mobilaz_current_user", "adminToken", "adminUser"].forEach((key) => {
            localStorage.removeItem(key);
        });
    }

    function updateNavbar(userOverride = null) {
        const buttonContainer = document.querySelector(".button-container");
        if (!buttonContainer) return;

        const storedRaw = userOverride
            ? JSON.stringify(userOverride)
            : localStorage.getItem("mobilaz_current_user") || localStorage.getItem("user");

        let user = null;
        if (storedRaw) {
            try {
                user = JSON.parse(storedRaw);
            } catch {
                user = null;
            }
        }

        if (!user) {
            buttonContainer.innerHTML = `
                <a href="login.html" class="login-btn" data-translate="login-btn">
                    <i class="fas fa-sign-in-alt"></i> Giriş
                </a>
                <a href="signup.html" class="register-btn" data-translate="register-btn">
                    <i class="fas fa-user-plus"></i> Qeydiyyat
                </a>
            `;
            return;
        }

        buttonContainer.innerHTML = `
            <a href="cabinet.html" class="login-btn cabinet-btn-header" style="background-color: var(--primary-color, blueviolet); color: white; border: none;">
                <i class="fas fa-user-circle"></i> ${getDisplayName(user)}
            </a>
        `;
    }

    window.updateNavbar = updateNavbar;

    // Check if the user is logged in
    const currentUserRaw = localStorage.getItem("mobilaz_current_user");
    if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        // Update header block
        updateNavbar(currentUser);
        // If on cabinet page, populate real data
        if (window.location.pathname.includes("cabinet.html")) {
            const userNameDisplay = document.querySelector(".user-snippet h3");
            const userEmailDisplay = document.querySelector(".user-snippet p");
            const welcomeDisplay = document.querySelector(".cabinet-header p");
            if (userNameDisplay)
                userNameDisplay.textContent = getDisplayName(currentUser);
            if (userEmailDisplay)
                userEmailDisplay.textContent = currentUser.email;
            if (welcomeDisplay) {
                welcomeDisplay.textContent = `Xoş gəldiniz, ${currentUser.name || "istifadəçi"}. Bugünkü statistikanızla tanış olun.`;
            }
            // Populate the info grid details
            const infoItems = document.querySelectorAll(".info-item p");
            if (infoItems.length >= 4) {
                infoItems[0].textContent = currentUser.name || "-";
                infoItems[1].textContent = currentUser.lastName;
                infoItems[2].textContent = currentUser.phone || "-";
                infoItems[3].textContent = currentUser.email;
            }
            // Handle Logout
            const logoutBtn = document.querySelector(".logout-link");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    clearSession();
                    window.location.href = "index.html";
                });
            }
        }
        // If logged in and on login/signup page, redirect them away
        if (window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html")) {
            window.location.href = currentUser.role === "admin" ? "admin.html" : "index.html";
        }
    }
    else {
        updateNavbar(null);
        // If not logged in and trying to access cabinet, redirect to login
        if (window.location.pathname.includes("cabinet.html")) {
            window.location.href = "login.html";
        }
    }
});
