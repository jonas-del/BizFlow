 const AppState = (() => {

    const STORAGE_KEY = "bizflow_state";
    const SESSION_KEY = "bizflow_session";

    const defaultState = {

        app: {
            initialized: false,
            loading: false,
            demoMode: false,
            online: navigator.onLine,
            currentPage: "dashboard"
        },

        user: null,

        business: {
            id: null,
            name: "My Business",
            type: "General Business",
            currency: "KES",
            currencySymbol: "KSh",
            timezone: "Africa/Nairobi"
        },

        dashboard: {
            revenue: 0,
            expenses: 0,
            profit: 0,
            salesCount: 0,
            customersCount: 0,
            productsCount: 0,
            lowStockCount: 0,
            recentSales: [],
            topProducts: [],
            salesChart: [],
            expenseChart: []
        },

        products: [],

        sales: [],

        expenses: [],

        customers: [],

        suppliers: [],

        inventory: {
            totalItems: 0,
            totalStockValue: 0,
            lowStock: [],
            movements: []
        },

        notifications: [],

        settings: {
            theme: "light",
            notifications: true,
            lowStockAlerts: true,
            emailReports: false,
            compactMode: false
        }

    };


    let state = clone(defaultState);

    const listeners = new Map();


    function clone(value) {

        return JSON.parse(
            JSON.stringify(value)
        );
    }


    function getState() {

        return clone(state);
    }


    function get(path, fallback = null) {

        if (!path) {
            return getState();
        }

        const parts = path.split(".");
        let current = state;

        for (const part of parts) {

            if (
                current === null ||
                current === undefined ||
                !(part in current)
            ) {
                return fallback;
            }

            current = current[part];
        }

        return clone(current);
    }


    function set(path, value) {

        if (!path) {
            return false;
        }

        const parts = path.split(".");
        let current = state;

        for (let i = 0; i < parts.length - 1; i++) {

            const part = parts[i];

            if (
                typeof current[part] !== "object" ||
                current[part] === null
            ) {
                current[part] = {};
            }

            current = current[part];
        }

        current[parts[parts.length - 1]] = clone(value);

        emit(path);

        return true;
    }


    function update(path, values) {

        const existing = get(path, {});

        if (
            typeof existing !== "object" ||
            Array.isArray(existing)
        ) {
            return false;
        }

        set(path, {
            ...existing,
            ...clone(values)
        });

        return true;
    }


    function reset() {

        state = clone(defaultState);

        save();

        emit("*");
    }


    function save() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state)
            );

            return true;

        } catch (error) {

            console.warn(
                "BizFlow: Unable to save application state.",
                error
            );

            return false;
        }
    }


    function load() {

        try {

            const stored =
                localStorage.getItem(STORAGE_KEY);

            if (!stored) {
                return false;
            }

            const parsed =
                JSON.parse(stored);

            state = merge(
                clone(defaultState),
                parsed
            );

            emit("*");

            return true;

        } catch (error) {

            console.warn(
                "BizFlow: Unable to load saved state.",
                error
            );

            return false;
        }
    }


    function merge(target, source) {

        if (
            typeof target !== "object" ||
            target === null
        ) {
            return clone(source);
        }

        if (
            typeof source !== "object" ||
            source === null
        ) {
            return target;
        }

        for (const key of Object.keys(source)) {

            if (
                source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key]) &&
                target[key] &&
                typeof target[key] === "object" &&
                !Array.isArray(target[key])
            ) {

                target[key] = merge(
                    target[key],
                    source[key]
                );

            } else {

                target[key] = clone(source[key]);
            }
        }

        return target;
    }


    function subscribe(path, callback) {

        if (typeof callback !== "function") {
            return () => {};
        }

        if (!listeners.has(path)) {
            listeners.set(path, new Set());
        }

        listeners.get(path).add(callback);

        return () => {
            listeners.get(path)?.delete(callback);
        };
    }


    function emit(path) {

        const callbacks = new Set();

        if (listeners.has(path)) {

            listeners.get(path).forEach(
                callback => callbacks.add(callback)
            );
        }

        if (listeners.has("*")) {

            listeners.get("*").forEach(
                callback => callbacks.add(callback)
            );
        }

        callbacks.forEach(callback => {

            try {

                callback(
                    getState(),
                    path
                );

            } catch (error) {

                console.error(
                    "BizFlow state listener error:",
                    error
                );
            }
        });
    }


    function setLoading(value) {

        set(
            "app.loading",
            Boolean(value)
        );
    }


    function setOnlineStatus(value) {

        set(
            "app.online",
            Boolean(value)
        );
    }


    function setCurrentPage(page) {

        set(
            "app.currentPage",
            page
        );
    }


    function setUser(user) {

        set(
            "user",
            user
        );

        save();
    }


    function clearUser() {

        set(
            "user",
            null
        );

        sessionStorage.removeItem(
            SESSION_KEY
        );

        save();
    }


    function getUser() {

        return get(
            "user"
        );
    }


    function isAuthenticated() {

        return Boolean(
            getUser()
        );
    }


    function setSession(session) {

        try {

            sessionStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

            return true;

        } catch (error) {

            console.warn(
                "BizFlow: Unable to save session.",
                error
            );

            return false;
        }
    }


    function getSession() {

        try {

            const session =
                sessionStorage.getItem(
                    SESSION_KEY
                );

            return session
                ? JSON.parse(session)
                : null;

        } catch (error) {

            return null;
        }
    }


    function clearSession() {

        sessionStorage.removeItem(
            SESSION_KEY
        );
    }


    function enableDemoMode() {

        state.app.demoMode = true;

        state.app.initialized = true;

        setSession({
            demo: true,
            startedAt: new Date().toISOString()
        });

        save();

        emit("*");
    }


    function disableDemoMode() {

        state.app.demoMode = false;

        clearSession();

        save();

        emit("*");
    }


    function isDemoMode() {

        return Boolean(
            state.app.demoMode
        );
    }


    function setBusiness(business) {

        update(
            "business",
            business
        );

        save();
    }


    function setDashboard(data) {

        update(
            "dashboard",
            data
        );

        save();
    }


    function setProducts(products) {

        state.products = Array.isArray(products)
            ? clone(products)
            : [];

        save();

        emit("products");
    }


    function setSales(sales) {

        state.sales = Array.isArray(sales)
            ? clone(sales)
            : [];

        save();

        emit("sales");
    }


    function setExpenses(expenses) {

        state.expenses = Array.isArray(expenses)
            ? clone(expenses)
            : [];

        save();

        emit("expenses");
    }


    function setCustomers(customers) {

        state.customers = Array.isArray(customers)
            ? clone(customers)
            : [];

        save();

        emit("customers");
    }


    function setSuppliers(suppliers) {

        state.suppliers = Array.isArray(suppliers)
            ? clone(suppliers)
            : [];

        save();

        emit("suppliers");
    }


    function setInventory(inventory) {

        state.inventory = {
            ...state.inventory,
            ...clone(inventory)
        };

        save();

        emit("inventory");
    }


    function setNotifications(notifications) {

        state.notifications =
            Array.isArray(notifications)
                ? clone(notifications)
                : [];

        save();

        emit("notifications");
    }


    function addNotification(notification) {

        const item = {

            id:
                notification.id ||
                generateId("notification"),

            title:
                notification.title ||
                "Notification",

            message:
                notification.message ||
                "",

            type:
                notification.type ||
                "info",

            read:
                Boolean(notification.read),

            createdAt:
                notification.createdAt ||
                new Date().toISOString()

        };

        state.notifications.unshift(item);

        save();

        emit("notifications");

        return clone(item);
    }


    function markNotificationRead(id) {

        const notification =
            state.notifications.find(
                item => String(item.id) === String(id)
            );

        if (!notification) {
            return false;
        }

        notification.read = true;

        save();

        emit("notifications");

        return true;
    }


    function markAllNotificationsRead() {

        state.notifications.forEach(
            notification => {
                notification.read = true;
            }
        );

        save();

        emit("notifications");
    }


    function getUnreadNotificationCount() {

        return state.notifications.filter(
            notification => !notification.read
        ).length;
    }


    function addItem(collection, item) {

        if (!Array.isArray(state[collection])) {
            return null;
        }

        const newItem = {

            id:
                item.id ||
                generateId(collection),

            createdAt:
                item.createdAt ||
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString(),

            ...clone(item)

        };

        state[collection].unshift(
            newItem
        );

        save();

        emit(collection);

        return clone(newItem);
    }


    function updateItem(collection, id, values) {

        if (!Array.isArray(state[collection])) {
            return null;
        }

        const index =
            state[collection].findIndex(
                item =>
                    String(item.id) === String(id)
            );

        if (index === -1) {
            return null;
        }

        state[collection][index] = {

            ...state[collection][index],

            ...clone(values),

            updatedAt:
                new Date().toISOString()

        };

        save();

        emit(collection);

        return clone(
            state[collection][index]
        );
    }


    function removeItem(collection, id) {

        if (!Array.isArray(state[collection])) {
            return false;
        }

        const originalLength =
            state[collection].length;

        state[collection] =
            state[collection].filter(
                item =>
                    String(item.id) !== String(id)
            );

        if (
            state[collection].length ===
            originalLength
        ) {
            return false;
        }

        save();

        emit(collection);

        return true;
    }


    function findItem(collection, id) {

        if (!Array.isArray(state[collection])) {
            return null;
        }

        const item =
            state[collection].find(
                entry =>
                    String(entry.id) === String(id)
            );

        return item
            ? clone(item)
            : null;
    }


    function generateId(prefix = "item") {

        return `${prefix}_${Date.now()}_${Math.random() 
            .toString(36)
            .substring(2, 9)}`;
    }


    function setSetting(key, value) {

        if (!(key in state.settings)) {
            return false;
        }

        state.settings[key] = value;

        save();

        emit("settings");

        return true;
    }


    function getSetting(key) {

        return state.settings[key];
    }


    function initialize() {

        load();

        const session =
            getSession();

        if (
            session &&
            session.demo === true
        ) {
            state.app.demoMode = true;
        }

        state.app.online =
            navigator.onLine;

        state.app.initialized =
            true;

        emit("*");

        return getState();
    }


    window.addEventListener(
        "online",
        () => {
            setOnlineStatus(true);
        }
    );


    window.addEventListener(
        "offline",
        () => {
            setOnlineStatus(false);
        }
    );


    return {

        getState,
        get,
        set,
        update,
        reset,
        save,
        load,

        subscribe,

        setLoading,
        setOnlineStatus,
        setCurrentPage,

        setUser,
        clearUser,
        getUser,
        isAuthenticated,

        setSession,
        getSession,
        clearSession,

        enableDemoMode,
        disableDemoMode,
        isDemoMode,

        setBusiness,

        setDashboard,

        setProducts,
        setSales,
        setExpenses,
        setCustomers,
        setSuppliers,
        setInventory,

        setNotifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        getUnreadNotificationCount,

        addItem,
        updateItem,
        removeItem,
        findItem,

        generateId,

        setSetting,
        getSetting,

        initialize

    };

})();


window.AppState = AppState;

AppState.initialize();