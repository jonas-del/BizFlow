 const Utils = (() => {

    const CURRENCY_SYMBOL = "KSh";
    const DEFAULT_LOCALE = "en-KE";


    /* ==========================================
       GENERAL
    ========================================== */

    function isObject(value) {

        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }


    function isEmpty(value) {

        if (value === null || value === undefined) {
            return true;
        }

        if (typeof value === "string") {
            return value.trim().length === 0;
        }

        if (Array.isArray(value)) {
            return value.length === 0;
        }

        return false;
    }


    function clamp(value, min, max) {

        return Math.min(
            Math.max(value, min),
            max
        );
    }


    function randomId(prefix = "item") {

        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 10)}`;
    }


    /* ==========================================
       NUMBERS
    ========================================== */

    function toNumber(value, fallback = 0) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        const number = Number(
            String(value).replace(/,/g, "")
        );

        return Number.isFinite(number)
            ? number
            : fallback;
    }


    function round(value, decimals = 2) {

        const number = toNumber(value);

        const multiplier =
            Math.pow(10, decimals);

        return Math.round(
            (number + Number.EPSILON) *
            multiplier
        ) / multiplier;
    }


    function formatNumber(
        value,
        decimals = 0
    ) {

        return new Intl.NumberFormat(
            DEFAULT_LOCALE,
            {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }
        ).format(
            toNumber(value)
        );
    }


    function formatCurrency(
        value,
        options = {}
    ) {

        const amount = toNumber(value);

        const symbol =
            options.symbol ??
            CURRENCY_SYMBOL;

        const decimals =
            options.decimals ?? 2;

        const formatted =
            new Intl.NumberFormat(
                DEFAULT_LOCALE,
                {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                }
            ).format(amount);

        return `${symbol} ${formatted}`;
    }


    function formatCompactNumber(value) {

        const number = toNumber(value);

        return new Intl.NumberFormat(
            DEFAULT_LOCALE,
            {
                notation: "compact",
                maximumFractionDigits: 1
            }
        ).format(number);
    }


    function percentage(
        value,
        total,
        decimals = 1
    ) {

        const denominator =
            toNumber(total);

        if (denominator === 0) {
            return 0;
        }

        return round(
            (toNumber(value) / denominator) * 100,
            decimals
        );
    }


    function formatPercentage(
        value,
        decimals = 1
    ) {

        return `${formatNumber(
            value,
            decimals
        )}%`;
    }


    function calculateChange(
        current,
        previous
    ) {

        const currentValue =
            toNumber(current);

        const previousValue =
            toNumber(previous);

        if (previousValue === 0) {

            if (currentValue === 0) {
                return 0;
            }

            return 100;
        }

        return round(
            ((currentValue - previousValue) /
                Math.abs(previousValue)) *
            100,
            1
        );
    }


    /* ==========================================
       DATES
    ========================================== */

    function parseDate(value) {

        if (!value) {
            return null;
        }

        const date =
            value instanceof Date
                ? new Date(value)
                : new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }


    function formatDate(
        value,
        options = {}
    ) {

        const date =
            parseDate(value);

        if (!date) {
            return "—";
        }

        const config = {
            day: "2-digit",
            month: "short",
            year: "numeric",
            ...options
        };

        return new Intl.DateTimeFormat(
            DEFAULT_LOCALE,
            config
        ).format(date);
    }


    function formatShortDate(value) {

        return formatDate(
            value,
            {
                day: "2-digit",
                month: "short"
            }
        );
    }


    function formatDateTime(value) {

        return formatDate(
            value,
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function formatTime(value) {

        const date =
            parseDate(value);

        if (!date) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            DEFAULT_LOCALE,
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);
    }


    function relativeTime(value) {

        const date =
            parseDate(value);

        if (!date) {
            return "Unknown";
        }

        const now =
            new Date();

        const difference =
            date.getTime() -
            now.getTime();

        const seconds =
            Math.round(
                difference / 1000
            );

        const absoluteSeconds =
            Math.abs(seconds);

        const units = [
            {
                name: "year",
                seconds: 31536000
            },
            {
                name: "month",
                seconds: 2592000
            },
            {
                name: "week",
                seconds: 604800
            },
            {
                name: "day",
                seconds: 86400
            },
            {
                name: "hour",
                seconds: 3600
            },
            {
                name: "minute",
                seconds: 60
            },
            {
                name: "second",
                seconds: 1
            }
        ];

        for (const unit of units) {

            if (
                absoluteSeconds >=
                unit.seconds
            ) {

                const amount =
                    Math.round(
                        absoluteSeconds /
                        unit.seconds
                    );

                const valueText =
                    `${amount} ${unit.name}` +
                    `${amount === 1 ? "" : "s"}`;

                return seconds < 0
                    ? `${valueText} ago`
                    : `in ${valueText}`;
            }
        }

        return "Just now";
    }


    function startOfDay(date = new Date()) {

        const result =
            new Date(date);

        result.setHours(
            0,
            0,
            0,
            0
        );

        return result;
    }


    function endOfDay(date = new Date()) {

        const result =
            new Date(date);

        result.setHours(
            23,
            59,
            59,
            999
        );

        return result;
    }


    function isToday(value) {

        const date =
            parseDate(value);

        if (!date) {
            return false;
        }

        const today =
            new Date();

        return (
            date.getFullYear() ===
                today.getFullYear() &&
            date.getMonth() ===
                today.getMonth() &&
            date.getDate() ===
                today.getDate()
        );
    }


    function toISODate(value = new Date()) {

        const date =
            parseDate(value);

        if (!date) {
            return "";
        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    /* ==========================================
       VALIDATION
    ========================================== */

    function isValidEmail(email) {

        if (!email) {
            return false;
        }

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                String(email).trim()
            );
    }


    function isValidPhone(phone) {

        if (!phone) {
            return false;
        }

        const cleaned =
            String(phone)
                .replace(/[\s\-()]/g, "");

        return /^\+?[0-9]{9,15}$/
            .test(cleaned);
    }


    function isStrongPassword(password) {

        if (
            typeof password !== "string" ||
            password.length < 8
        ) {
            return false;
        }

        return (
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password)
        );
    }


    function validateRequired(
        value,
        fieldName = "This field"
    ) {

        if (isEmpty(value)) {

            return {
                valid: false,
                message:
                    `${fieldName} is required.`
            };
        }

        return {
            valid: true,
            message: ""
        };
    }


    function validateEmail(email) {

        if (isEmpty(email)) {

            return {
                valid: false,
                message: "Email is required."
            };
        }

        if (!isValidEmail(email)) {

            return {
                valid: false,
                message:
                    "Enter a valid email address."
            };
        }

        return {
            valid: true,
            message: ""
        };
    }


    function validatePassword(password) {

        if (isEmpty(password)) {

            return {
                valid: false,
                message:
                    "Password is required."
            };
        }

        if (password.length < 8) {

            return {
                valid: false,
                message:
                    "Password must contain at least 8 characters."
            };
        }

        return {
            valid: true,
            message: ""
        };
    }


    /* ==========================================
       SECURITY
    ========================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function sanitizeText(value) {

        return escapeHTML(
            String(value ?? "")
                .trim()
        );
    }


    /* ==========================================
       JSON
    ========================================== */

    function parseJSON(
        value,
        fallback = null
    ) {

        try {

            return JSON.parse(value);

        } catch {

            return fallback;
        }
    }


    function stringifyJSON(
        value,
        fallback = ""
    ) {

        try {

            return JSON.stringify(value);

        } catch {

            return fallback;
        }
    }


    /* ==========================================
       STORAGE
    ========================================== */

    function storageSet(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.warn(
                "Storage error:",
                error
            );

            return false;
        }
    }


    function storageGet(
        key,
        fallback = null
    ) {

        try {

            const value =
                localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);

        } catch {

            return fallback;
        }
    }


    function storageRemove(key) {

        try {

            localStorage.removeItem(key);

            return true;

        } catch {

            return false;
        }
    }


    function sessionSet(
        key,
        value
    ) {

        try {

            sessionStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch {

            return false;
        }
    }


    function sessionGet(
        key,
        fallback = null
    ) {

        try {

            const value =
                sessionStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);

        } catch {

            return fallback;
        }
    }


    /* ==========================================
       DOM
    ========================================== */

    function $(selector, parent = document) {

        return parent.querySelector(selector);
    }


    function $$(selector, parent = document) {

        return [
            ...parent.querySelectorAll(selector)
        ];
    }


    function createElement(
        tag,
        options = {}
    ) {

        const element =
            document.createElement(tag);

        if (options.className) {
            element.className =
                options.className;
        }

        if (options.text !== undefined) {
            element.textContent =
                options.text;
        }

        if (options.html !== undefined) {
            element.innerHTML =
                options.html;
        }

        if (options.attributes) {

            Object.entries(
                options.attributes
            ).forEach(
                ([key, value]) => {

                    element.setAttribute(
                        key,
                        value
                    );
                }
            );
        }

        return element;
    }


    function show(element) {

        if (!element) {
            return;
        }

        element.hidden = false;
    }


    function hide(element) {

        if (!element) {
            return;
        }

        element.hidden = true;
    }


    function toggle(
        element,
        force
    ) {

        if (!element) {
            return;
        }

        if (force === undefined) {

            element.hidden =
                !element.hidden;

        } else {

            element.hidden =
                !force;
        }
    }


    function addClass(
        element,
        className
    ) {

        element?.classList.add(
            className
        );
    }


    function removeClass(
        element,
        className
    ) {

        element?.classList.remove(
            className
        );
    }


    function toggleClass(
        element,
        className,
        force
    ) {

        element?.classList.toggle(
            className,
            force
        );
    }


    /* ==========================================
       PERFORMANCE
    ========================================== */

    function debounce(
        callback,
        delay = 300
    ) {

        let timer = null;

        return function (...args) {

            clearTimeout(timer);

            timer = setTimeout(
                () => {
                    callback.apply(
                        this,
                        args
                    );
                },
                delay
            );
        };
    }


    function throttle(
        callback,
        delay = 200
    ) {

        let waiting = false;

        return function (...args) {

            if (waiting) {
                return;
            }

            callback.apply(
                this,
                args
            );

            waiting = true;

            setTimeout(
                () => {
                    waiting = false;
                },
                delay
            );
        };
    }


    /* ==========================================
       URL / QUERY PARAMETERS
    ========================================== */

    function getQueryParam(name) {

        const params =
            new URLSearchParams(
                window.location.search
            );

        return params.get(name);
    }


    function getQueryParams() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const result = {};

        for (const [key, value] of params) {
            result[key] = value;
        }

        return result;
    }


    function buildQuery(params = {}) {

        const query =
            new URLSearchParams();

        Object.entries(params)
            .forEach(
                ([key, value]) => {

                    if (
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    ) {

                        query.set(
                            key,
                            value
                        );
                    }
                }
            );

        return query.toString();
    }


    /* ==========================================
       CLIPBOARD
    ========================================== */

    async function copyToClipboard(text) {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                String(text)
            );

            return true;
        }

        const textarea =
            document.createElement("textarea");

        textarea.value =
            String(text);

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        let success = false;

        try {
            success =
                document.execCommand("copy");
        } catch {
            success = false;
        }

        textarea.remove();

        return success;
    }


    /* ==========================================
       FILE HELPERS
    ========================================== */

    function formatFileSize(bytes) {

        const size =
            toNumber(bytes);

        if (size === 0) {
            return "0 Bytes";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        const index =
            Math.floor(
                Math.log(size) /
                Math.log(1024)
            );

        const value =
            size /
            Math.pow(1024, index);

        return `${value.toFixed(
            index === 0 ? 0 : 1
        )} ${units[index]}`;
    }


    function isAllowedFileType(
        file,
        allowedTypes = []
    ) {

        if (!file) {
            return false;
        }

        if (
            !Array.isArray(allowedTypes) ||
            allowedTypes.length === 0
        ) {
            return true;
        }

        return allowedTypes.some(
            type => {

                if (
                    type.startsWith(".")
                ) {

                    return file.name
                        .toLowerCase()
                        .endsWith(
                            type.toLowerCase()
                        );
                }

                return file.type === type;
            }
        );
    }


    /* ==========================================
       CSV
    ========================================== */

    function csvEscape(value) {

        const text =
            String(value ?? "");

        if (
            text.includes(",") ||
            text.includes('"') ||
            text.includes("\n")
        ) {

            return `"${text.replace(
                /"/g,
                '""'
            )}"`;
        }

        return text;
    }


    function arrayToCSV(
        rows,
        columns = null
    ) {

        if (
            !Array.isArray(rows) ||
            rows.length === 0
        ) {
            return "";
        }

        let headers;

        if (columns) {

            headers =
                columns.map(
                    column =>
                        column.label ??
                        column.key
                );

        } else {

            headers =
                Object.keys(rows[0]);
        }

        const lines = [
            headers.map(csvEscape).join(",")
        ];

        rows.forEach(row => {

            const values =
                columns
                    ? columns.map(
                        column =>
                            row[column.key]
                    )
                    : headers.map(
                        header =>
                            row[header]
                    );

            lines.push(
                values
                    .map(csvEscape)
                    .join(",")
            );
        });

        return lines.join("\n");
    }


    function downloadText(
        content,
        filename,
        mimeType = "text/plain"
    ) {

        const blob =
            new Blob(
                [content],
                {
                    type: mimeType
                }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);
    }


    function downloadCSV(
        rows,
        filename = "export.csv",
        columns = null
    ) {

        const csv =
            arrayToCSV(
                rows,
                columns
            );

        downloadText(
            csv,
            filename,
            "text/csv;charset=utf-8;"
        );
    }


    /* ==========================================
       DEVICE
    ========================================== */

    function isMobile() {

        return window.matchMedia(
            "(max-width: 768px)"
        ).matches;
    }


    function isTablet() {

        return window.matchMedia(
            "(min-width: 769px) and (max-width: 1024px)"
        ).matches;
    }


    function isDesktop() {

        return window.matchMedia(
            "(min-width: 1025px)"
        ).matches;
    }


    /* ==========================================
       ARRAY HELPERS
    ========================================== */

    function sortBy(
        array,
        key,
        direction = "asc"
    ) {

        if (!Array.isArray(array)) {
            return [];
        }

        return [...array].sort(
            (a, b) => {

                const first =
                    a?.[key];

                const second =
                    b?.[key];

                if (
                    first === second
                ) {
                    return 0;
                }

                if (
                    first === null ||
                    first === undefined
                ) {
                    return 1;
                }

                if (
                    second === null ||
                    second === undefined
                ) {
                    return -1;
                }

                const result =
                    first < second
                        ? -1
                        : 1;

                return direction === "desc"
                    ? -result
                    : result;
            }
        );
    }


    function groupBy(
        array,
        key
    ) {

        if (!Array.isArray(array)) {
            return {};
        }

        return array.reduce(
            (groups, item) => {

                const group =
                    item?.[key] ?? "other";

                if (!groups[group]) {
                    groups[group] = [];
                }

                groups[group].push(item);

                return groups;

            },
            {}
        );
    }


    function sum(
        array,
        key = null
    ) {

        if (!Array.isArray(array)) {
            return 0;
        }

        return array.reduce(
            (total, item) => {

                const value =
                    key === null
                        ? item
                        : item?.[key];

                return total +
                    toNumber(value);

            },
            0
        );
    }


    /* ==========================================
       BACKEND RESPONSE HELPERS
    ========================================== */

    function isSuccessResponse(response) {

        if (!response) {
            return false;
        }

        if (
            response.success === true
        ) {
            return true;
        }

        if (
            response.status === "success"
        ) {
            return true;
        }

        return false;
    }


    function getResponseData(
        response,
        fallback = null
    ) {

        if (!response) {
            return fallback;
        }

        if (
            response.data !== undefined
        ) {
            return response.data;
        }

        return response;
    }


    function getErrorMessage(
        error,
        fallback =
            "Something went wrong. Please try again."
    ) {

        if (!error) {
            return fallback;
        }

        if (
            typeof error === "string"
        ) {
            return error;
        }

        if (error.message) {
            return error.message;
        }

        if (
            error.data?.message
        ) {
            return error.data.message;
        }

        if (
            error.data?.error
        ) {
            return error.data.error;
        }

        return fallback;
    }


    /* ==========================================
       OBJECT HELPERS
    ========================================== */

    function pick(
        object,
        keys
    ) {

        if (
            !isObject(object) ||
            !Array.isArray(keys)
        ) {
            return {};
        }

        return keys.reduce(
            (result, key) => {

                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(object, key)
                ) {

                    result[key] =
                        object[key];
                }

                return result;

            },
            {}
        );
    }


    function omit(
        object,
        keys
    ) {

        if (!isObject(object)) {
            return {};
        }

        const excluded =
            new Set(keys);

        return Object.entries(object)
            .reduce(
                (result, [key, value]) => {

                    if (
                        !excluded.has(key)
                    ) {

                        result[key] =
                            value;
                    }

                    return result;

                },
                {}
            );
    }


    function deepClone(value) {

        try {

            return structuredClone(value);

        } catch {

            return JSON.parse(
                JSON.stringify(value)
            );
        }
    }


    /* ==========================================
       PUBLIC API
    ========================================== */

    return {

        isObject,
        isEmpty,
        clamp,
        randomId,

        toNumber,
        round,
        formatNumber,
        formatCurrency,
        formatCompactNumber,
        percentage,
        formatPercentage,
        calculateChange,

        parseDate,
        formatDate,
        formatShortDate,
        formatDateTime,
        formatTime,
        relativeTime,
        startOfDay,
        endOfDay,
        isToday,
        toISODate,

        isValidEmail,
        isValidPhone,
        isStrongPassword,
        validateRequired,
        validateEmail,
        validatePassword,

        escapeHTML,
        sanitizeText,

        parseJSON,
        stringifyJSON,

        storageSet,
        storageGet,
        storageRemove,

        sessionSet,
        sessionGet,

        $,
        $$,
        createElement,
        show,
        hide,
        toggle,
        addClass,
        removeClass,
        toggleClass,

        debounce,
        throttle,

        getQueryParam,
        getQueryParams,
        buildQuery,

        copyToClipboard,

        formatFileSize,
        isAllowedFileType,

        arrayToCSV,
        downloadText,
        downloadCSV,

        isMobile,
        isTablet,
        isDesktop,

        sortBy,
        groupBy,
        sum,

        isSuccessResponse,
        getResponseData,
        getErrorMessage,

        pick,
        omit,
        deepClone

    };

})();


window.Utils = Utils;