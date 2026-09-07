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
        document.querySelector(
            "#demoLogin"
        );

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
});