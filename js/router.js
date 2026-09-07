 const pageTitles = {

    dashboard: "Dashboard",

    products: "Products",

    sales: "Sales",

    expenses: "Expenses",

    customers: "Customers",

    suppliers: "Suppliers",

    inventory: "Inventory",

    reports: "Reports",

    settings: "Settings"

};


function navigateTo(page) {

    const pages =
        document.querySelectorAll(
            ".page-view"
        );


    pages.forEach(view => {

        view.classList.add("hidden");

    });


    const target =
        document.getElementById(
            `${page}Page`
        );


    if (target) {

        target.classList.remove("hidden");

    }


    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.classList.toggle(

                "active",

                link.dataset.page === page

            );

        });


    if (page === "products") {

        renderProducts();

        updateProductStatistics();

    }


    closeMobileSidebar();

}


function initializeRouter() {

    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    navigateTo(
                        link.dataset.page
                    );

                }
            );

        });

}


function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    sidebar.classList.remove("show");

    overlay.classList.remove("show");

}