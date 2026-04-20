document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector(".login-form form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const inputs = loginForm.querySelectorAll("input");
        const email = inputs[0].value.trim();
        const password = inputs[1].value;

        let users = JSON.parse(localStorage.getItem("mobilaz_users") || "[]");

        const user = users.find((u: any) => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem("mobilaz_current_user", JSON.stringify(user));
            alert("Uğurla daxil oldunuz! / Successfully logged in!");
            window.location.href = "cabinet.html";
        } else {
            alert("İstifadəçi adı (e-poçt) və ya şifrə səhvdir! / Incorrect email or password!");
        }
    });
});
