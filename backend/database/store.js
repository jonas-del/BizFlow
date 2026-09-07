"use strict";

const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "data");
const dataFile = path.join(dataDirectory, "bizflow.json");

const defaultData = {
    products: [],
    sales: [],
    customers: [],
    expenses: [],
    suppliers: [],
    inventoryMovements: [],
    settings: {
        businessName: "BizFlow Business",
        businessType: "General Business",
        currency: "KES",
        currencySymbol: "KSh",
        timezone: "Africa/Nairobi",
        notifications: true,
        lowStockAlerts: true,
        emailReports: false,
        compactMode: false
    },
    counters: {
        products: 1,
        sales: 1,
        customers: 1,
        expenses: 1,
        suppliers: 1,
        inventoryMovements: 1
    }
};

const clone = value => JSON.parse(JSON.stringify(value));

const mergeDefaults = (target, source) => {
    if (!source || typeof source !== "object") {
        return target;
    }

    Object.keys(source).forEach(key => {
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === "object" &&
            !Array.isArray(target[key])
        ) {
            mergeDefaults(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    });

    return target;
};

const ensureDataFile = () => {
    fs.mkdirSync(dataDirectory, { recursive: true });

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(defaultData, null, 2),
            "utf8"
        );
    }
};

const read = () => {
    ensureDataFile();
    const stored = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return mergeDefaults(clone(defaultData), stored);
};

const write = data => {
    ensureDataFile();
    const temporaryFile = `${dataFile}.tmp`;

    fs.writeFileSync(
        temporaryFile,
        JSON.stringify(data, null, 2),
        "utf8"
    );

    fs.renameSync(temporaryFile, dataFile);
};

const update = callback => {
    const data = read();
    const result = callback(data);
    write(data);
    return result;
};

const nextId = (dataOrCollection, collection) => {
    if (Array.isArray(dataOrCollection)) {
        if (!dataOrCollection.length) {
            return 1;
        }

        return Math.max(
            ...dataOrCollection.map(item => Number(item.id) || 0)
        ) + 1;
    }

    const data = dataOrCollection;
    const id = data.counters[collection] || 1;
    data.counters[collection] = id + 1;
    return id;
};

module.exports = {
    dataFile,
    read,
    write,
    update,
    nextId
};
