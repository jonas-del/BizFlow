"use strict";

const SettingsPage = (() => {
    const $ = selector => document.querySelector(selector);

    const toast = message => {
        if (typeof window.showToast === "function") {
            window.showToast(message, "success");
            return;
        }

        const existing = document.querySelector(".toast-container");
        const container = existing || document.createElement("div");
        if (!existing) {
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        const item = document.createElement("div");
        item.className = "toast success";
        item.textContent = message;
        container.appendChild(item);
        setTimeout(() => item.remove(), 3000);
    };

    const load = async () => {
        try {
            if (window.API?.settings?.get) {
                const response = await window.API.settings.get();
                const data = response?.data || response;
                const settings = data?.settings || data || {};
                for (const [key, value] of Object.entries(settings)) {
                    const input = $(`[name="${key}"]`);
                    if (input) input.value = value;
                }
            }
        } catch (error) {
            console.warn("Settings API unavailable:", error);
        }
    };

    const save = async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form).entries());

        try {
            if (window.API?.settings?.update) {
                await window.API.settings.update(payload);
            }
            toast("Settings saved successfully.");
        } catch (error) {
            console.error("Settings save error:", error);
            toast(error.message || "Unable to save settings.");
        }
    };

    const init = async () => {
        const form = $("#settingsForm");
        if (form) form.addEventListener("submit", save);
        await load();
    };

    return { init, load };
})();

document.addEventListener("DOMContentLoaded", () => {
    SettingsPage.init();
});
