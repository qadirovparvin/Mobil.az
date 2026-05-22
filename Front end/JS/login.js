"use strict";
/* login.js – Handles the password-based login form (method: password) */

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("passwordLoginForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const identifier = document.getElementById("loginIdentifier")?.value.trim();
        const password   = document.getElementById("loginPassword")?.value;
        const remember   = document.getElementById("rememberMe")?.checked;

        if (!identifier || !password) {
            showToast("Email/istifadəçi adı və şifrəni daxil edin", "error");
            return;
        }

        const btn = document.getElementById("passwordLoginBtn");
        setLoading(btn, true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || "Email və ya şifrə yanlışdır", "error");
                return;
            }

            const storage = remember ? localStorage : sessionStorage;
            storage.setItem("token", data.token);
            localStorage.setItem("mobilaz_current_user", JSON.stringify(data));
            if (window.updateNavbar) window.updateNavbar();

            showToast("Uğurla daxil oldunuz!", "success");

            if (data.role === "admin") {
                localStorage.setItem("adminToken", data.token);
                const adminUser = { ...data };
                delete adminUser.token;
                localStorage.setItem("adminUser", JSON.stringify(adminUser));
                setTimeout(() => window.location.href = "admin.html", 1200);
            } else {
                setTimeout(() => window.location.href = "cabinet.html", 1200);
            }
        } catch (error) {
            console.error("Login error:", error);
            showToast("Serverlə əlaqə yaradılmadı. Yenidən cəhd edin.", "error");
        } finally {
            setLoading(btn, false);
        }
    });
});
