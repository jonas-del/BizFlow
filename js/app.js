 document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApplication();

    }
);


function initializeApplication() {

    initializeRouter();

    initializeTheme();

    initializeMobileMenu();

    initializeGlobalSearch();

    initializeDashboardButtons();

    loadDashboard();

}


function initializeTheme() {

    const themeButton =
        document.getElementById(
            "themeBtn"
        );


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
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


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


    overlay.addEventListener(
        "click",
        closeMobileSidebar
    );

}


function initializeGlobalSearch() {

    const search =
        document.getElementById(
            "globalSearch"
        );


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
        );


    notificationButton.addEventListener(
        "click",
        () => {

            showToast(
                "You have 3 new notifications."
            );

        }
    );


    document
        .getElementById("quickSaleBtn")
        .addEventListener(
            "click",
            () => {
                    navigateTo("sales");

            }
        );


    document
        .getElementById("viewInventoryBtn")
        .addEventListener(
            "click",
            () => {

                navigateTo(
                    "products"
                );

            }
        );


    document
        .getElementById("viewSalesBtn")
        .addEventListener(
            "click",
            () => {
                    navigateTo("sales");

            }
        );

}