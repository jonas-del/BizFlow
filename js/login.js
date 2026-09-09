"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form =
        document.querySelector("#loginForm") ||
        document.querySelector("form");

    if (!form) return;

    const emailInput =
        document.querySelector("#email") ||
        document.querySelector(
            'input[type="email"]'
        );

    const passwordInput =
        document.querySelector("#password") ||
        document.querySelector(
            'input[type="password"]'
        );

    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        ) ||
        form.querySelector("button");

    const message =
        document.querySelector("#loginMessage") ||
        document.querySelector("[data-auth-error]") ||
        document.querySelector(".login-message") ||
        document.querySelector(".form-message");

    const rememberMe =
        document.querySelector("#rememberMe") ||
        document.querySelector(
            'input[type="checkbox"]'
        );

    const showMessage = (
        text,
        type = "error"
    ) => {
        if (!message) {
            if (type === "error") {
                console.error(text);
            }

            return;
        }

        message.textContent = text;
        message.className =
            `form-message ${type}`;
        message.hidden = false;
    };

    const setLoading = loading => {
        if (!submitButton) return;

        submitButton.disabled = loading;

        if (loading) {
            if (!submitButton.dataset.originalText) {
                submitButton.dataset.originalText =
                    submitButton.textContent;
            }

            submitButton.innerHTML = `
                <span class="button-spinner"></span>
                Signing in...
            `;
        } else {
            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Sign In";
        }
    };

    const validate = () => {
        const email =
            emailInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";

        if (!email) {
            showMessage(
                "Please enter your email address."
            );

            emailInput?.focus();

            return false;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showMessage(
                "Please enter a valid email address."
            );

            emailInput?.focus();

            return false;
        }

        if (!password) {
            showMessage(
                "Please enter your password."
            );

            passwordInput?.focus();

            return false;
        }

        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters."
            );

            passwordInput?.focus();

            return false;
        }

        return true;
    };

    form.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            if (!validate()) return;

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;

            setLoading(true);

            showMessage(
                "Connecting...",
                "loading"
            );

            try {
                if (
                    !window.Auth ||
                    typeof window.Auth.login !==
                        "function"
                ) {
                    throw new Error(
                        "Authentication system is unavailable."
                    );
                }

                const response =
                    await window.Auth.login({
                        email,
                        password,
                        remember:
                            rememberMe
                                ? rememberMe.checked
                                : false
                    });

                const data =
                    response?.data ||
                    response;

                const user =
                    data?.user ||
                    data?.account ||
                    window.Auth.getUser();

                if (!user) {
                    throw new Error(
                        "Login succeeded but no user account was returned."
                    );
                }

                showMessage(
                    "Login successful. Redirecting...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        "pages/dashboard.html";
                }, 500);

            } catch (error) {
                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to sign in. Please check your details and try again.",
                    "error"
                );

                setLoading(false);
            }
        }
    );

    if (emailInput) {
        emailInput.addEventListener(
            "input",
            () => {
                if (message) {
                    message.hidden = true;
                }
            }
        );
    }

    if (passwordInput) {
        passwordInput.addEventListener(
            "input",
            () => {
                if (message) {
                    message.hidden = true;
                }
            }
        );
    }

    const passwordToggle =
        document.querySelector(
            "#passwordToggle"
        ) ||
        document.querySelector(
            ".password-toggle"
        );

    if (
        passwordToggle &&
        passwordInput
    ) {
        passwordToggle.addEventListener(
            "click",
            () => {
                const isPassword =
                    passwordInput.type ===
                    "password";

                passwordInput.type =
                    isPassword
                        ? "text"
                        : "password";

                passwordToggle.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );

                passwordToggle.textContent =
                    isPassword
                        ? "Hide"
                        : "Show";
            }
        );
    }

    const demoLogin =
        document.querySelector("#demoLogin") ||
        document.querySelector("[data-demo-login]");

    if (demoLogin) {
        demoLogin.addEventListener(
            "click",
            () => {
                if (emailInput) {
                    emailInput.value =
                        "demo@bizflow.local";
                }

                if (passwordInput) {
                    passwordInput.value =
                        "demo123";
                }

                showMessage(
                    "Demo credentials loaded.",
                    "success"
                );
            }
        );
    }

    const registerLink = document.querySelector("[data-register-link]");

    registerLink?.addEventListener("click", event => {
        event.preventDefault();

        if (document.querySelector("#registrationModal")) {
            return;
        }

        const modal = document.createElement("div");
        modal.id = "registrationModal";
        modal.className = "modal open";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.innerHTML = `
            <div class="modal-overlay" data-close-registration></div>
            <div class="modal-content auth-modal-card">
                <div class="auth-modal-header">
                    <div>
                        <span class="auth-small-title">GET STARTED</span>
                        <h2>Create your account</h2>
                    </div>
                    <button type="button" class="modal-close" data-close-registration aria-label="Close registration">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <form id="registrationForm" class="auth-form auth-modal-form" novalidate>
                        <div class="form-group">
                            <label for="registrationName">Full name</label>
                            <div class="input-wrapper">
                                <input id="registrationName" name="name" type="text" autocomplete="name" placeholder="Your full name" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="registrationEmail">Email address</label>
                            <div class="input-wrapper">
                                <input id="registrationEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="registrationPassword">Password</label>
                            <div class="input-wrapper">
                                <input id="registrationPassword" name="password" type="password" minlength="6" autocomplete="new-password" placeholder="Create a password" required>
                            </div>
                        </div>
                        <div class="form-message" id="registrationMessage" hidden></div>
                        <button type="submit" class="auth-submit">Create account</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        modal.querySelectorAll("[data-close-registration]").forEach(button => {
            button.addEventListener("click", close);
        });

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                close();
            }
        });

        document.addEventListener("keydown", function onEscape(event) {
            if (event.key === "Escape" && document.querySelector("#registrationModal")) {
                close();
                document.removeEventListener("keydown", onEscape);
            }
        });

        modal.querySelector("#registrationForm").addEventListener("submit", async registrationEvent => {
            registrationEvent.preventDefault();

            const formData = new FormData(registrationEvent.currentTarget);
            const registrationMessage = modal.querySelector("#registrationMessage");
            const submit = registrationEvent.currentTarget.querySelector("button[type=submit]");

            const name = String(formData.get("name") || "").trim();
            const email = String(formData.get("email") || "").trim();
            const password = String(formData.get("password") || "");

            if (!name || !email || !password || password.length < 6) {
                registrationMessage.textContent = "Please enter a valid name, email, and a password with at least 6 characters.";
                registrationMessage.className = "form-message error";
                registrationMessage.hidden = false;
                return;
            }

            submit.disabled = true;
            registrationMessage.textContent = "Creating your account...";
            registrationMessage.className = "form-message loading";
            registrationMessage.hidden = false;

            try {
                await window.Auth.register({
                    name,
                    email,
                    password
                });

                registrationMessage.textContent = "Account created. Opening your workspace...";
                registrationMessage.className = "form-message success";
                registrationMessage.hidden = false;

                setTimeout(() => {
                    window.location.href = "pages/dashboard.html";
                }, 400);
            } catch (error) {
                registrationMessage.textContent = error.message || "Unable to create your account.";
                registrationMessage.className = "form-message error";
                registrationMessage.hidden = false;
                submit.disabled = false;
            }
        });
    });
});