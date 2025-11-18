function addToHistory(song, artist, coverUrl) {
    // 🔥 impede duplicação
    if (historyList.firstChild) {
        const lastItem = historyList.firstChild.querySelector(".history-title")?.textContent || "";
        const newItem = `${artist} - ${song}`;

        if (lastItem === newItem) {
            return; // não duplica
        }
    }

    // 🔥 ignora comerciais e vinhetas
    const lower = `${artist} ${song}`.toLowerCase();
    if (lower.includes("commercial break") ||
        lower.includes("praise fm") ||
        lower.trim() === "" ||
        song.trim() === "" ||
        song.length < 2) {
        return;
    }

    const li = document.createElement("li");
    li.classList.add("history-item");

    li.innerHTML = `
        <img src="${coverUrl}" class="history-cover" />
        <div>
            <div class="history-title">${artist} - ${song}</div>
        </div>
    `;

    historyList.prepend(li);
}
