document.addEventListener("DOMContentLoaded", function () {
    // Check if the user is logged in
    const currentUserRaw = localStorage.getItem("mobilaz_current_user");

    if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);

        // Update header block
        const buttonContainer = document.querySelector(".button-container");
        if (buttonContainer) {
            buttonContainer.innerHTML = `
                <a href="cabinet.html" class="login-btn cabinet-btn-header" style="background-color: var(--primary-color, blueviolet); color: white; border: none;">
                    <i class="fas fa-user-circle"></i> ${currentUser.firstName} ${currentUser.lastName}
                </a>
            `;
        }

        // If on cabinet page, populate real data
        if (window.location.pathname.includes("cabinet.html")) {
            const userNameDisplay = document.querySelector(".user-snippet h3");
            const userEmailDisplay = document.querySelector(".user-snippet p");
            const welcomeDisplay = document.querySelector(".cabinet-header p");

            if (userNameDisplay) userNameDisplay.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            if (userEmailDisplay) userEmailDisplay.textContent = currentUser.email;

            // Optional: The welcome text has translation spans, we can just append the name to the text 
            // inside the translation loop or just overwrite the parent but keep the span!
            if (welcomeDisplay) {
                const welcomeSpan = welcomeDisplay.querySelector("span");
                if (welcomeSpan) {
                    welcomeDisplay.innerHTML = `<span data-translate="cab-welcome">${welcomeSpan.textContent}</span> ${currentUser.firstName} ${currentUser.lastName}!`;
                }
            }

            // Populate the info grid details
            const infoItems = document.querySelectorAll(".info-item p");
            if (infoItems.length >= 4) {
                infoItems[0].textContent = currentUser.firstName;
                infoItems[1].textContent = currentUser.lastName;
                infoItems[2].textContent = currentUser.phone || "-";
                infoItems[3].textContent = currentUser.email;
            }

            // Handle Logout
            const logoutBtn = document.querySelector(".logout-link");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    localStorage.removeItem("mobilaz_current_user");
                    window.location.href = "index.html";
                });
            }
        }

        // If logged in and on login/signup page, redirect them away
        if (window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html")) {
            window.location.href = "index.html";
        }
    } else {
        // If not logged in and trying to access cabinet, redirect to login
        if (window.location.pathname.includes("cabinet.html")) {
            window.location.href = "login.html";
        }
    }
});
