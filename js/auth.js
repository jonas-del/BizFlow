 "use strict";

const Auth = (() => {
    const STORAGE_KEYS = {
        user: "bizflow_user",
        token: "bizflow_token"
    };

    const getUser = () => {
        try {
            const raw =
                localStorage.getItem(
                    STORAGE_KEYS.user
                );

            return raw
                ? JSON.parse(raw)
                : null;
        } catch (error) {
            console.warn(
                "Unable to read stored user:",
                error
            );

            return null;
        }
    };

    const getToken = () => {
        return localStorage.getItem(
            STORAGE_KEYS.token
        );
    };

    const saveSession = (
        user,
        token = null
    ) => {
        if (user) {
            localStorage.setItem(
                STORAGE_KEYS.user,
                JSON.stringify(user)
            );
        }

        if (token) {
            localStorage.setItem(
                STORAGE_KEYS.token,
                token
            );
        }
    };

    const clearSession = () => {
        localStorage.removeItem(
            STORAGE_KEYS.user
        );

        localStorage.removeItem(
            STORAGE_KEYS.token
        );
    };

    const isLoggedIn = () => {
        return Boolean(
            getUser() ||
            getToken()
        );
    };

    const login = async credentials => {
        if (
            !credentials ||
            !credentials.email ||
            !credentials.password
        ) {
            throw new Error(
                "Email and password are required."
            );
        }

        if (
            window.API &&
            window.API.auth &&
            typeof window.API.auth.login ===
                "function"
        ) {
            try {
                const response =
                    await window.API.auth.login(
                        credentials
                    );

                const data =
                    response?.data ||
                    response;

                const user =
                    data?.user ||
                    data?.account ||
                    null;

                const token =
                    data?.token ||
                    data?.accessToken ||
                    null;

                if (user || token) {
                    saveSession(
                        user,
                        token
                    );
                }

                return response;
            } catch (error) {
                throw error;
            }
        }

        throw new Error(
            "Authentication service is not connected."
        );
    };

    const register = async userData => {
        if (
            !userData ||
            !userData.email ||
            !userData.password
        ) {
            throw new Error(
                "Email and password are required."
            );
        }

        if (
            window.API &&
            window.API.auth &&
            typeof window.API.auth.register ===
                "function"
        ) {
            const response =
                await window.API.auth.register(
                    userData
                );

            const data =
                response?.data ||
                response;

            const user =
                data?.user ||
                data?.account ||
                null;

            const token =
                data?.token ||
                data?.accessToken ||
                null;

            if (user || token) {
                saveSession(
                    user,
                    token
                );
            }

            return response;
        }

        throw new Error(
            "Registration service is not connected."
        );
    };

    const checkSession = async () => {
        const storedUser =
            getUser();

        const token =
            getToken();

        if (!storedUser && !token) {
            return null;
        }

        if (
            window.API &&
            window.API.auth &&
            typeof window.API.auth.me ===
                "function"
        ) {
            try {
                const response =
                    await window.API.auth.me();

                const data =
                    response?.data ||
                    response;

                const user =
                    data?.user ||
                    data?.account ||
                    data;

                if (user) {
                    saveSession(
                        user,
                        token
                    );

                    return user;
                }
            } catch (error) {
                console.warn(
                    "Session verification failed:",
                    error
                );
            }
        }

        return storedUser;
    };

    const logout = async () => {
        try {
            if (
                window.API &&
                window.API.auth &&
                typeof window.API.auth.logout ===
                    "function"
            ) {
                await window.API.auth.logout();
            }
        } catch (error) {
            console.warn(
                "Server logout failed:",
                error
            );
        }

        clearSession();

        window.location.href =
            "../index.html";
    };

    const requireAuth = async () => {
        const user =
            await checkSession();

        if (!user) {
            const currentPath =
                window.location.pathname;

            if (
                !currentPath.endsWith(
                    "index.html"
                ) &&
                !currentPath.endsWith("/")
            ) {
                window.location.href =
                    "../index.html";
            }

            return null;
        }

        return user;
    };

    const redirectIfLoggedIn = async () => {
        const user =
            await checkSession();

        if (!user) {
            return false;
        }

        const path =
            window.location.pathname;

        const isLoginPage =
            path.endsWith(
                "index.html"
            ) ||
            path.endsWith("/");

        if (isLoginPage) {
            window.location.href =
                "pages/dashboard.html";
        }

        return true;
    };

    const getRole = () => {
        const user =
            getUser();

        return (
            user?.role ||
            user?.userRole ||
            "user"
        );
    };

    const hasRole = roles => {
        const role =
            String(
                getRole()
            ).toLowerCase();

        const allowed =
            Array.isArray(roles)
                ? roles
                : [roles];

        return allowed.some(
            item =>
                String(
                    item
                ).toLowerCase() === role
        );
    };

    return {
        getUser,
        getToken,
        saveSession,
        clearSession,
        isLoggedIn,
        login,
        register,
        checkSession,
        logout,
        requireAuth,
        redirectIfLoggedIn,
        getRole,
        hasRole
    };
})();

window.Auth = Auth;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const page =
            document.body?.dataset?.page;

        if (
            page === "dashboard" ||
            page === "protected"
        ) {
            Auth.requireAuth();
        }

        if (
            page === "login" ||
            page === "auth"
        ) {
            Auth.redirectIfLoggedIn();
        }
    }
);