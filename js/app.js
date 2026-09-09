 document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApplication();

    }
);


function initializeApplication() {

    initializeShellControls();

    if (typeof initializeRouter === "function") {
        initializeRouter();
    }

    initializeTheme();

    initializeMobileMenu();

    initializeGlobalSearch();

    initializeDashboardButtons();

    if (typeof loadDashboard === "function") {
        loadDashboard();
    }

}


function initializeTheme() {

    const themeButton =
        document.getElementById(
            "themeBtn"
        );

    if (!themeButton) {
        return;
    }


    const savedTheme =
        localStorage.getItem(
            "bizflow_theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent = "☀";

    }


    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const dark =
                document.body.classList.contains(
                    "dark"
                );


            themeButton.textContent =
                dark ? "☀" : "☾";


            localStorage.setItem(

                "bizflow_theme",

                dark ? "dark" : "light"

            );

        }
    );

}


function initializeMobileMenu() {

    const menuButton =
        document.getElementById(
            "menuBtn"
        ) ||
        document.getElementById(
            "mobileMenuButton"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!sidebar || !overlay) {
        return;
    }

    if (menuButton) {
        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "show"
                );

                overlay.classList.toggle(
                    "show"
                );

            }
        );
    }

    overlay.addEventListener(
        "click",
        closeMobileSidebar
    );

}


function initializeGlobalSearch() {

    const search =
        document.getElementById(
            "globalSearch"
        ) ||
        document.getElementById(
            "globalSearchInput"
        );

    if (!search) {
        return;
    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "/" &&
                document.activeElement.tagName !== "INPUT"
            ) {

                event.preventDefault();

                search.focus();

            }

        }
    );


    search.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                search.value = "";

                search.blur();

            }

        }
    );

}


function initializeDashboardButtons() {

    const notificationButton =
        document.getElementById(
            "notificationBtn"
        ) ||
        document.getElementById(
            "notificationButton"
        );

    if (notificationButton) {
        notificationButton.addEventListener(
            "click",
            () => {

                if (typeof showToast === "function") {
                    showToast(
                        "You have 3 new notifications."
                    );
                }

            }
        );
    }

    const quickSaleBtn = document.getElementById("quickSaleBtn");
    if (quickSaleBtn) {
        quickSaleBtn.addEventListener(
            "click",
            () => {
                if (typeof navigateTo === "function") {
                    navigateTo("sales");
                }
            }
        );
    }

    const viewInventoryBtn = document.getElementById("viewInventoryBtn");
    if (viewInventoryBtn) {
        viewInventoryBtn.addEventListener(
            "click",
            () => {
                if (typeof navigateTo === "function") {
                    navigateTo("products");
                }
            }
        );
    }

    const viewSalesBtn = document.getElementById("viewSalesBtn");
    if (viewSalesBtn) {
        viewSalesBtn.addEventListener(
            "click",
            () => {
                if (typeof navigateTo === "function") {
                    navigateTo("sales");
                }
            }
        );
    }

}


function initializeShellControls() {

    const topbar = document.querySelector(".topbar");
    const actions = document.querySelector(".topbar-actions");
    const sidebar = document.getElementById("sidebar");

    if (!topbar || !actions || !sidebar) return;

    if (!document.getElementById("menuBtn")) {
        const menu = document.createElement("button");
        menu.type = "button";
        menu.id = "menuBtn";
        menu.className = "menu-btn";
        menu.setAttribute("aria-label", "Open navigation");
        menu.textContent = "☰";
        topbar.prepend(menu);
    }

    if (!document.getElementById("themeBtn")) {
        const theme = document.createElement("button");
        theme.type = "button";
        theme.id = "themeBtn";
        theme.className = "icon-button theme-button";
        theme.setAttribute("aria-label", "Toggle dark mode");
        theme.textContent = "☾";
        actions.prepend(theme);
    }

    if (!document.getElementById("sidebarOverlay")) {
        const overlay = document.createElement("div");
        overlay.id = "sidebarOverlay";
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
    }
}


function closeMobileSidebar() {
    document.getElementById("sidebar")?.classList.remove("show", "open");
    document.getElementById("sidebarOverlay")?.classList.remove("show", "open");
    document.body.style.overflow = "";
}