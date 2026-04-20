"use strict";
document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.querySelector(".signup-form form");
    if (!signupForm)
        return;
    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        // Get inputs
        const inputs = signupForm.querySelectorAll("input");
        const firstName = inputs[0].value.trim();
        const lastName = inputs[1].value.trim();
        const email = inputs[2].value.trim();
        const phone = inputs[3].value.trim();
        const password = inputs[4].value;
        const confirmPassword = inputs[5].value;
        const terms = inputs[6].checked;
        if (password !== confirmPassword) {
            alert("Şifrələr uyğun gəlmir! / Passwords do not match!");
            return;
        }
        if (!terms) {
            alert("Zəhmət olmasa istifadə şərtləri ilə razılaşın! / Please agree to the terms!");
            return;
        }
        // Check existing users
        let users = JSON.parse(localStorage.getItem("mobilaz_users") || "[]");
        const existingUser = users.find((u) => u.email === email);
        if (existingUser) {
            alert("Bu e-poçt artıq qeydiyyatdan keçib! / This email is already registered!");
            return;
        }
        const newUser = {
            firstName,
            lastName,
            email,
            phone,
            password
        };
        users.push(newUser);
        localStorage.setItem("mobilaz_users", JSON.stringify(users));
        // Auto login
        localStorage.setItem("mobilaz_current_user", JSON.stringify(newUser));
        alert("Qeydiyyat uğurla tamamlandı! / Registration successful!");
        window.location.href = "cabinet.html";
    });
});
