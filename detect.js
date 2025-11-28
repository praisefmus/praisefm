export function detectExternalPlatform() {
    const ref = document.referrer.toLowerCase();
    const ua = navigator.userAgent.toLowerCase();

    const platforms = [
        "mytuner",
        "radio",
        "tunein",
        "onlineradiobox",
        "radio.garden",
        "streema",
        "liveonlineradio",
        "radio-browser"
    ];

    // Referrer detection
    for (let p of platforms) {
        if (ref.includes(p)) return true;
    }

    // User-agent detection
    if (ua.includes("mytuner") || ua.includes("radiobox")) return true;

    return false;
}
