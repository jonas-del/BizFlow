 function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) return;


    const toast =
        document.createElement("div");


    toast.className =
        `toast toast-${type}`;


    const icon =
        type === "error"
            ? "!"
            : type === "warning"
                ? "⚠"
                : "✓";


    toast.innerHTML = `

        <div class="toast-icon">
            ${icon}
        </div>

        <div class="toast-message">
            ${escapeToastText(message)}
        </div>

        <button class="toast-close">
            ×
        </button>

    `;


    container.appendChild(toast);


    const close =
        toast.querySelector(
            ".toast-close"
        );


    close.addEventListener(
        "click",
        () => removeToast(toast)
    );


    const timeout =
        setTimeout(
            () => removeToast(toast),
            3500
        );


    toast.dataset.timeout = timeout;

}


function removeToast(toast) {

    if (!toast) return;


    clearTimeout(
        Number(toast.dataset.timeout)
    );


    toast.classList.add(
        "toast-removing"
    );


    setTimeout(
        () => toast.remove(),
        250
    );

}


function escapeToastText(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}