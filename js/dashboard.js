 "use strict";

const Dashboard = (() => {
    const state = {
        period: "month",
        loading: false,
        initialized: false,
        data: {
            revenue: 0,
            expenses: 0,
            profit: 0,
            salesCount: 0,
            products: 0,
            lowStock: 0,
            outOfStock: 0,
            sales: [],
            lowStockProducts: [],
            chart: []
        }
    };

    const $ = (selector, parent = document) => {
        return parent.querySelector(selector);
    };

    const $$ = (selector, parent = document) => {
        return [...parent.querySelectorAll(selector)];
    };

    const findElement = (...selectors) => {
        for (const selector of selectors) {
            const element = $(selector);
            if (element) return element;
        }

        return null;
    };

    const setText = (selectors, value) => {
        const list = Array.isArray(selectors) ? selectors : [selectors];

        for (const selector of list) {
            const element = findElement(selector);

            if (element) {
                element.textContent = value;
                return;
            }
        }
    };

    const formatMoney = value => {
        const amount = Number(value) || 0;

        return new Intl.NumberFormat("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatNumber = value => {
        return new Intl.NumberFormat("en-KE").format(
            Number(value) || 0
        );
    };

    const formatDate = value => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat("en-KE", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    };

    const initials = name => {
        if (!name) return "?";

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    };

    const escapeHTML = value => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const showToast = (message, type = "success") => {
        let container = $(".toast-container");

        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;

        const icons = {
            success: "✓",
            error: "!",
            warning: "!"
        };

        toast.innerHTML = `
            <span class="toast-icon">
                ${icons[type] || "✓"}
            </span>

            <span class="toast-message">
                ${escapeHTML(message)}
            </span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";

            setTimeout(() => {
                toast.remove();
            }, 200);
        }, 3500);
    };

    const getCurrentUser = () => {
        try {
            if (window.State) {
                if (typeof window.State.getUser === "function") {
                    return window.State.getUser();
                }

                if (window.State.user) {
                    return window.State.user;
                }
            }

            const storedUser =
                localStorage.getItem("bizflow_user");

            if (storedUser) {
                return JSON.parse(storedUser);
            }
        } catch (error) {
            console.warn("Unable to read current user:", error);
        }

        return {
            name: "Business Admin",
            email: "admin@bizflow.local",
            role: "Administrator"
        };
    };

    const updateUserInterface = () => {
        const user = getCurrentUser();

        const name =
            user.name ||
            user.fullName ||
            user.username ||
            "Business Admin";

        const email =
            user.email ||
            user.emailAddress ||
            "admin@bizflow.local";

        const avatar = initials(name);

        $$("[data-user-name]").forEach(element => {
            element.textContent = name;
        });

        $$("[data-user-email]").forEach(element => {
            element.textContent = email;
        });

        $$("[data-user-avatar]").forEach(element => {
            element.textContent = avatar;
        });

        setText(
            [
                "#userName",
                "#profileName",
                ".profile-name"
            ],
            name
        );

        setText(
            [
                "#userEmail",
                "#profileEmail",
                ".profile-email"
            ],
            email
        );

        setText(
            [
                "#userAvatar",
                "#profileAvatar"
            ],
            avatar
        );
    };

    const getFallbackData = () => {
        return {
            revenue: 0,
            expenses: 0,
            profit: 0,
            salesCount: 0,
            products: 0,
            lowStock: 0,
            outOfStock: 0,
            sales: [],
            lowStockProducts: [],
            chart: []
        };
    };

    const normalizeData = data => {
        if (!data || typeof data !== "object") {
            return getFallbackData();
        }

        const revenue =
            Number(
                data.revenue ??
                data.totalRevenue ??
                data.salesRevenue ??
                0
            ) || 0;

        const expenses =
            Number(
                data.expenses ??
                data.totalExpenses ??
                data.totalExpense ??
                0
            ) || 0;

        const profit =
            Number(
                data.profit ??
                data.netProfit ??
                revenue - expenses
            ) || 0;

        const salesCount =
            Number(
                data.salesCount ??
                data.totalSales ??
                data.salesTotal ??
                0
            ) || 0;

        const products =
            Number(
                data.products ??
                data.productCount ??
                data.totalProducts ??
                0
            ) || 0;

        const lowStockProducts =
            Array.isArray(data.lowStockProducts)
                ? data.lowStockProducts
                : Array.isArray(data.lowStock)
                    ? data.lowStock
                    : [];

        const outOfStock =
            Number(
                data.outOfStock ??
                data.outOfStockCount ??
                0
            ) || 0;

        const lowStock =
            Number(
                data.lowStockCount ??
                data.lowStockTotal ??
                lowStockProducts.length
            ) || 0;

        const sales =
            Array.isArray(data.sales)
                ? data.sales
                : Array.isArray(data.recentSales)
                    ? data.recentSales
                    : [];

        const chart =
            Array.isArray(data.chart)
                ? data.chart
                : Array.isArray(data.chartData)
                    ? data.chartData
                    : [];

        return {
            revenue,
            expenses,
            profit,
            salesCount,
            products,
            lowStock,
            outOfStock,
            sales,
            lowStockProducts,
            chart
        };
    };

    const loadFromAPI = async () => {
        if (!window.API) {
            return null;
        }

        const possibleMethods = [
            "dashboard.get",
            "dashboard.summary",
            "dashboard.getSummary",
            "dashboard.getStats"
        ];

        for (const methodPath of possibleMethods) {
            try {
                const parts = methodPath.split(".");
                let target = window.API;

                for (const part of parts) {
                    target = target?.[part];
                }

                if (typeof target === "function") {
                    const result = await target({
                        period: state.period
                    });

                    if (result) {
                        return normalizeData(
                            result.data || result
                        );
                    }
                }
            } catch (error) {
                console.warn(
                    `Dashboard API method failed: ${methodPath}`,
                    error
                );
            }
        }

        return null;
    };

    const loadFromLocalStorage = () => {
        const data = getFallbackData();

        try {
            const sales =
                JSON.parse(
                    localStorage.getItem("bizflow_sales") || "[]"
                );

            const expenses =
                JSON.parse(
                    localStorage.getItem("bizflow_expenses") || "[]"
                );

            const products =
                JSON.parse(
                    localStorage.getItem("bizflow_products") || "[]"
                );

            if (Array.isArray(sales)) {
                data.sales = sales.slice(-10).reverse();

                data.salesCount = sales.length;

                data.revenue = sales.reduce((total, sale) => {
                    return total +
                        Number(
                            sale.total ??
                            sale.amount ??
                            sale.grandTotal ??
                            0
                        );
                }, 0);
            }

            if (Array.isArray(expenses)) {
                data.expenses = expenses.reduce((total, item) => {
                    return total +
                        Number(
                            item.amount ??
                            item.total ??
                            0
                        );
                }, 0);
            }

            if (Array.isArray(products)) {
                data.products = products.length;

                data.lowStockProducts = products.filter(product => {
                    const quantity =
                        Number(
                            product.quantity ??
                            product.stock ??
                            product.qty ??
                            0
                        );

                    const minimum =
                        Number(
                            product.minimumStock ??
                            product.minStock ??
                            product.reorderLevel ??
                            5
                        );

                    return quantity > 0 && quantity <= minimum;
                });

                data.lowStock =
                    data.lowStockProducts.length;

                data.outOfStock =
                    products.filter(product => {
                        const quantity =
                            Number(
                                product.quantity ??
                                product.stock ??
                                product.qty ??
                                0
                            );

                        return quantity <= 0;
                    }).length;
            }

            data.profit =
                data.revenue - data.expenses;

        } catch (error) {
            console.warn(
                "Unable to load local dashboard data:",
                error
            );
        }

        return data;
    };

    const loadData = async () => {
        state.loading = true;

        try {
            const apiData = await loadFromAPI();

            if (apiData) {
                state.data = normalizeData(apiData);
            } else {
                state.data =
                    normalizeData(
                        loadFromLocalStorage()
                    );
            }
        } catch (error) {
            console.error(
                "Dashboard loading error:",
                error
            );

            state.data =
                normalizeData(
                    loadFromLocalStorage()
                );
        }

        state.loading = false;

        render();
    };

    const renderStatistics = () => {
        const data = state.data;

        setText(
            [
                "#revenueValue",
                "#totalRevenue",
                "[data-stat='revenue']"
            ],
            `KSh ${formatMoney(data.revenue)}`
        );

        setText(
            [
                "#expenseValue",
                "#expensesValue",
                "#totalExpenses",
                "[data-stat='expenses']"
            ],
            `KSh ${formatMoney(data.expenses)}`
        );

        setText(
            [
                "#profitValue",
                "#totalProfit",
                "[data-stat='profit']"
            ],
            `KSh ${formatMoney(data.profit)}`
        );

        setText(
            [
                "#salesValue",
                "#salesCount",
                "#totalSales",
                "[data-stat='sales']"
            ],
            formatNumber(data.salesCount)
        );

        setText(
            [
                "#totalProducts",
                "#productsCount",
                "[data-stat='products']"
            ],
            formatNumber(data.products)
        );

        setText(
            [
                "#lowStockCount",
                "#lowStockTotal",
                "[data-stat='low-stock']"
            ],
            formatNumber(data.lowStock)
        );

        setText(
            [
                "#outOfStockCount",
                "#outStockCount",
                "[data-stat='out-of-stock']"
            ],
            formatNumber(data.outOfStock)
        );

        const profitChange =
            data.revenue > 0
                ? ((data.profit / data.revenue) * 100)
                : 0;

        setText(
            [
                "#profitPercentage",
                "[data-profit-percentage]"
            ],
            `${profitChange.toFixed(1)}%`
        );
    };

    const renderLowStock = () => {
        const container =
            findElement(
                "#lowStockList",
                "#lowStockProducts",
                ".low-stock-list"
            );

        if (!container) return;

        const products =
            state.data.lowStockProducts || [];

        const counter =
            findElement(
                "#lowStockBadge",
                "#lowStockCountBadge",
                ".stock-list-header > span"
            );

        if (counter) {
            counter.textContent =
                products.length;
        }

        if (!products.length) {
            container.innerHTML = `
                <div class="empty-state-small">
                    Everything looks good. No low-stock products.
                </div>
            `;

            return;
        }

        container.innerHTML = products
            .slice(0, 10)
            .map(product => {
                const name =
                    product.name ||
                    product.productName ||
                    "Unnamed product";

                const quantity =
                    Number(
                        product.quantity ??
                        product.stock ??
                        product.qty ??
                        0
                    );

                const sku =
                    product.sku ||
                    product.code ||
                    "";

                return `
                    <div class="low-stock-item">
                        <div class="low-stock-item-info">
                            <span class="low-stock-item-name">
                                ${escapeHTML(name)}
                            </span>

                            <span class="low-stock-item-meta">
                                ${escapeHTML(sku || "Inventory item")}
                            </span>
                        </div>

                        <span class="low-stock-item-quantity">
                            ${quantity} left
                        </span>
                    </div>
                `;
            })
            .join("");
    };

    const getSaleCustomer = sale => {
        return (
            sale.customerName ||
            sale.customer ||
            sale.clientName ||
            "Walk-in Customer"
        );
    };

    const getSaleAmount = sale => {
        return Number(
            sale.total ??
            sale.amount ??
            sale.grandTotal ??
            sale.totalAmount ??
            0
        ) || 0;
    };

    const getSaleStatus = sale => {
        return String(
            sale.status ||
            sale.paymentStatus ||
            "completed"
        ).toLowerCase();
    };

    const renderRecentSales = () => {
        const body =
            findElement(
                "#recentSalesBody",
                "#salesTableBody",
                ".recent-sales-body",
                ".data-table tbody"
            );

        if (!body) return;

        const sales = state.data.sales || [];

        if (!sales.length) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">
                        No sales recorded yet.
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML = sales
            .slice(0, 10)
            .map(sale => {
                const customer =
                    getSaleCustomer(sale);

                const amount =
                    getSaleAmount(sale);

                const status =
                    getSaleStatus(sale);

                const payment =
                    String(
                        sale.paymentMethod ||
                        sale.payment ||
                        "Cash"
                    );

                const date =
                    sale.date ||
                    sale.createdAt ||
                    sale.created_at ||
                    sale.saleDate;

                const invoice =
                    sale.invoiceNumber ||
                    sale.invoice ||
                    sale.reference ||
                    sale.id ||
                    "—";

                const safeStatus =
                    status.replace(
                        /[^a-z0-9-]/gi,
                        ""
                    );

                return `
                    <tr>
                        <td>
                            <div class="customer-cell">
                                <span class="customer-avatar">
                                    ${escapeHTML(initials(customer))}
                                </span>

                                <span class="customer-name">
                                    ${escapeHTML(customer)}
                                </span>
                            </div>
                        </td>

                        <td>
                            ${escapeHTML(invoice)}
                        </td>

                        <td class="amount-cell">
                            KSh ${formatMoney(amount)}
                        </td>

                        <td>
                            <span class="status-badge ${safeStatus}">
                                ${escapeHTML(
                                    status.charAt(0).toUpperCase() +
                                    status.slice(1)
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="payment-badge paid">
                                ${escapeHTML(payment)}
                            </span>
                        </td>

                        <td>
                            ${escapeHTML(formatDate(date))}
                        </td>
                    </tr>
                `;
            })
            .join("");
    };

    const createChart = () => {
        const container =
            findElement(
                "#salesChart",
                ".sales-chart",
                "#chartContainer"
            );

        if (!container) return;

        const chartData =
            Array.isArray(state.data.chart)
                ? state.data.chart
                : [];

        const oldCanvas =
            $("canvas.dashboard-chart", container);

        if (oldCanvas) {
            oldCanvas.remove();
        }

        const placeholder =
            $(".chart-placeholder", container);

        if (!chartData.length) {
            if (placeholder) {
                placeholder.style.display =
                    "flex";
            }

            return;
        }

        if (placeholder) {
            placeholder.style.display =
                "none";
        }

        const canvas =
            document.createElement("canvas");

        canvas.className =
            "dashboard-chart";

        canvas.style.width = "100%";
        canvas.style.height = "255px";

        container.appendChild(canvas);

        const ctx =
            canvas.getContext("2d");

        const width =
            canvas.clientWidth || 600;

        const height = 255;

        const ratio =
            window.devicePixelRatio || 1;

        canvas.width =
            width * ratio;

        canvas.height =
            height * ratio;

        ctx.scale(ratio, ratio);

        const values =
            chartData.map(item => {
                if (typeof item === "number") {
                    return item;
                }

                return Number(
                    item.value ??
                    item.amount ??
                    item.total ??
                    0
                ) || 0;
            });

        if (!values.length) return;

        const labels =
            chartData.map((item, index) => {
                if (typeof item === "object") {
                    return (
                        item.label ||
                        item.date ||
                        item.name ||
                        String(index + 1)
                    );
                }

                return String(index + 1);
            });

        const max =
            Math.max(...values, 1);

        const min =
            Math.min(...values, 0);

        const padding = {
            top: 20,
            right: 18,
            bottom: 30,
            left: 48
        };

        const chartWidth =
            width -
            padding.left -
            padding.right;

        const chartHeight =
            height -
            padding.top -
            padding.bottom;

        const getX = index => {
            if (values.length === 1) {
                return padding.left +
                    chartWidth / 2;
            }

            return padding.left +
                (index / (values.length - 1)) *
                chartWidth;
        };

        const getY = value => {
            if (max === min) {
                return padding.top +
                    chartHeight / 2;
            }

            return padding.top +
                chartHeight -
                ((value - min) / (max - min)) *
                chartHeight;
        };

        ctx.font =
            "9px Inter, Arial, sans-serif";

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= 4; i++) {
            const value =
                min +
                ((max - min) / 4) * i;

            const y =
                getY(value);

            ctx.strokeStyle =
                "rgba(148, 163, 184, 0.15)";

            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(
                padding.left,
                y
            );

            ctx.lineTo(
                width - padding.right,
                y
            );

            ctx.stroke();

            ctx.fillStyle =
                "#94a3b8";

            ctx.fillText(
                formatMoney(value),
                padding.left - 8,
                y
            );
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        labels.forEach((label, index) => {
            const x =
                getX(index);

            ctx.fillStyle =
                "#94a3b8";

            ctx.fillText(
                label,
                x,
                height - 19
            );
        });

        const points =
            values.map((value, index) => ({
                x: getX(index),
                y: getY(value)
            }));

        if (points.length > 1) {
            ctx.beginPath();

            points.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(
                        point.x,
                        point.y
                    );
                } else {
                    ctx.lineTo(
                        point.x,
                        point.y
                    );
                }
            });

            ctx.lineTo(
                points[points.length - 1].x,
                padding.top + chartHeight
            );

            ctx.lineTo(
                points[0].x,
                padding.top + chartHeight
            );

            ctx.closePath();

            const gradient =
                ctx.createLinearGradient(
                    0,
                    padding.top,
                    0,
                    height
                );

            gradient.addColorStop(
                0,
                "rgba(37, 99, 235, 0.16)"
            );

            gradient.addColorStop(
                1,
                "rgba(37, 99, 235, 0)"
            );

            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();

            points.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(
                        point.x,
                        point.y
                    );
                } else {
                    ctx.lineTo(
                        point.x,
                        point.y
                    );
                }
            });

            ctx.strokeStyle =
                "#2563eb";

            ctx.lineWidth = 2.5;

            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            ctx.stroke();
        }

        points.forEach(point => {
            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                3.5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#ffffff";

            ctx.fill();

            ctx.strokeStyle =
                "#2563eb";

            ctx.lineWidth = 2;

            ctx.stroke();
        });
    };

    const render = () => {
        renderStatistics();
        renderLowStock();
        renderRecentSales();
        createChart();
        updateUserInterface();

        state.initialized = true;
    };

    const setupPeriodSelector = () => {
        const selector =
            findElement(
                "#periodSelect",
                "#salesPeriod",
                ".period-select"
            );

        if (!selector) return;

        selector.value =
            state.period;

        selector.addEventListener(
            "change",
            async event => {
                state.period =
                    event.target.value ||
                    "month";

                await loadData();
            }
        );
    };

    const setupMobileSidebar = () => {
        const sidebar =
            $(".sidebar");

        const overlay =
            $(".sidebar-overlay");

        const menuButton =
            findElement(
                "#mobileMenuButton",
                ".mobile-menu-button"
            );

        const closeButton =
            findElement(
                "#sidebarClose",
                ".sidebar-close"
            );

        if (!sidebar) return;

        const open = () => {
            sidebar.classList.add("open");

            if (overlay) {
                overlay.classList.add("open");
            }

            document.body.style.overflow =
                "hidden";
        };

        const close = () => {
            sidebar.classList.remove("open");

            if (overlay) {
                overlay.classList.remove("open");
            }

            document.body.style.overflow =
                "";
        };

        if (menuButton) {
            menuButton.addEventListener(
                "click",
                open
            );
        }

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                close
            );
        }

        if (overlay) {
            overlay.addEventListener(
                "click",
                close
            );
        }

        $$(".nav-item").forEach(item => {
            item.addEventListener(
                "click",
                () => {
                    if (
                        window.innerWidth <= 850
                    ) {
                        close();
                    }
                }
            );
        });
    };

    const setupNotifications = () => {
        const panel =
            findElement(
                "#notificationPanel",
                ".notification-panel"
            );

        const button =
            findElement(
                "#notificationButton",
                "#notificationsButton",
                ".notification-button"
            );

        const closeButton =
            findElement(
                "#notificationClose",
                ".panel-close"
            );

        if (!panel || !button) return;

        const open = () => {
            panel.classList.add("open");
        };

        const close = () => {
            panel.classList.remove("open");
        };

        button.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                if (
                    panel.classList.contains("open")
                ) {
                    close();
                } else {
                    open();
                }
            }
        );

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                close
            );
        }

        document.addEventListener(
            "click",
            event => {
                if (
                    panel.classList.contains("open") &&
                    !panel.contains(event.target) &&
                    !button.contains(event.target)
                ) {
                    close();
                }
            }
        );
    };

    const setupProfileMenu = () => {
        const menu =
            findElement(
                "#profileMenu",
                ".profile-menu"
            );

        const button =
            findElement(
                "#profileButton",
                ".profile-button"
            );

        if (!menu || !button) return;

        button.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                menu.classList.toggle("open");
            }
        );

        document.addEventListener(
            "click",
            event => {
                if (
                    menu.classList.contains("open") &&
                    !menu.contains(event.target) &&
                    !button.contains(event.target)
                ) {
                    menu.classList.remove("open");
                }
            }
        );

        const logout =
            findElement(
                "#logoutButton",
                ".logout-item"
            );

        if (logout) {
            logout.addEventListener(
                "click",
                async () => {
                    try {
                        if (
                            window.Auth &&
                            typeof window.Auth.logout ===
                                "function"
                        ) {
                            await window.Auth.logout();
                        } else {
                            localStorage.removeItem(
                                "bizflow_user"
                            );

                            localStorage.removeItem(
                                "bizflow_token"
                            );

                            window.location.href =
                                "../index.html";
                        }
                    } catch (error) {
                        console.error(
                            "Logout error:",
                            error
                        );

                        localStorage.removeItem(
                            "bizflow_user"
                        );

                        window.location.href =
                            "../index.html";
                    }
                }
            );
        }
    };

    const setupSearch = () => {
        const overlay =
            findElement(
                "#searchOverlay",
                ".search-overlay"
            );

        const trigger =
            findElement(
                "#searchTrigger",
                "#globalSearchButton",
                ".search-trigger"
            );

        const close =
            findElement(
                "#searchClose",
                ".search-close"
            );

        const input =
            findElement(
                "#globalSearch",
                "#searchInput",
                "#globalSearchInput",
                ".search-input"
            );

        const results =
            findElement(
                "#searchResults",
                ".search-results"
            );

        if (!overlay || !trigger) return;

        const open = () => {
            overlay.classList.add("open");

            if (input) {
                setTimeout(() => {
                    input.focus();
                }, 100);
            }
        };

        const hide = () => {
            overlay.classList.remove("open");

            if (input) {
                input.value = "";
            }

            if (results) {
                renderSearchResults("");
            }
        };

        trigger.addEventListener(
            "click",
            open
        );

        if (close) {
            close.addEventListener(
                "click",
                hide
            );
        }

        overlay.addEventListener(
            "click",
            event => {
                if (
                    event.target === overlay
                ) {
                    hide();
                }
            }
        );

        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "/" &&
                    document.activeElement?.tagName !==
                        "INPUT" &&
                    document.activeElement?.tagName !==
                        "TEXTAREA"
                ) {
                    event.preventDefault();
                    open();
                }

                if (
                    event.key === "Escape" &&
                    overlay.classList.contains("open")
                ) {
                    hide();
                }
            }
        );

        if (input) {
            input.addEventListener(
                "input",
                event => {
                    renderSearchResults(
                        event.target.value
                    );
                }
            );
        }
    };

    const renderSearchResults = query => {
        const container =
            findElement(
                "#searchResults",
                ".search-results"
            );

        if (!container) return;

        const term =
            String(query || "")
                .trim()
                .toLowerCase();

        if (!term) {
            container.innerHTML = `
                <div class="search-empty">
                    <strong>Search BizFlow</strong>
                    <span>
                        Search products, customers, sales and more.
                    </span>
                </div>
            `;

            return;
        }

        const results = [];

        state.data.sales.forEach(sale => {
            const customer =
                getSaleCustomer(sale);

            const invoice =
                sale.invoiceNumber ||
                sale.invoice ||
                sale.reference ||
                sale.id ||
                "";

            if (
                customer.toLowerCase().includes(term) ||
                String(invoice)
                    .toLowerCase()
                    .includes(term)
            ) {
                results.push({
                    type: "Sale",
                    title: customer,
                    description:
                        `Sale ${invoice} · KSh ${formatMoney(
                            getSaleAmount(sale)
                        )}`,
                    icon: "S"
                });
            }
        });

        state.data.lowStockProducts.forEach(
            product => {
                const name =
                    product.name ||
                    product.productName ||
                    "";

                const sku =
                    product.sku ||
                    product.code ||
                    "";

                if (
                    name.toLowerCase().includes(term) ||
                    sku.toLowerCase().includes(term)
                ) {
                    results.push({
                        type: "Product",
                        title: name,
                        description:
                            `Stock: ${
                                product.quantity ??
                                product.stock ??
                                0
                            }`,
                        icon: "P"
                    });
                }
            }
        );

        if (!results.length) {
            container.innerHTML = `
                <div class="search-empty">
                    <strong>No results found</strong>
                    <span>
                        Try a different search term.
                    </span>
                </div>
            `;

            return;
        }

        container.innerHTML =
            results
                .slice(0, 12)
                .map(item => `
                    <div class="search-result-item">
                        <span class="search-result-icon">
                            ${escapeHTML(item.icon)}
                        </span>

                        <div class="search-result-content">
                            <strong>
                                ${escapeHTML(item.title)}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    item.type +
                                    " · " +
                                    item.description
                                )}
                            </span>
                        </div>
                    </div>
                `)
                .join("");
    };

    const setupRefresh = () => {
        const buttons =
            $$(
                "[data-dashboard-refresh]"
            );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    button.disabled = true;

                    try {
                        await loadData();

                        showToast(
                            "Dashboard updated successfully."
                        );
                    } finally {
                        button.disabled = false;
                    }
                }
            );
        });
    };

    const setupResize = () => {
        let timeout;

        window.addEventListener(
            "resize",
            () => {
                clearTimeout(timeout);

                timeout = setTimeout(() => {
                    createChart();
                }, 150);
            }
        );
    };

    const setupNavigation = () => {
        $$(".nav-item").forEach(item => {
            item.addEventListener(
                "click",
                () => {
                    if (window.innerWidth <= 850) {
                        const sidebar = findElement("#sidebar");
                        const overlay = findElement("#sidebarOverlay");

                        sidebar?.classList.remove("open", "show");
                        overlay?.classList.remove("open", "show");
                        document.body.style.overflow = "";
                    }
                }
            );
        });
    };

    const init = async () => {
        if (state.initialized) {
            return;
        }

        setupPeriodSelector();
        setupMobileSidebar();
        setupNotifications();
        setupProfileMenu();
        setupSearch();
        setupRefresh();
        setupResize();
        setupNavigation();

        updateUserInterface();

        await loadData();
    };

    return {
        init,
        refresh: loadData,
        getState: () => ({
            ...state,
            data: {
                ...state.data
            }
        })
    };
})();

window.Dashboard = Dashboard;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        Dashboard.init();
    }
);