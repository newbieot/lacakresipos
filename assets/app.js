(() => {
    "use strict";

    const TRACKING_BASE_URL = "https://kibananew.posindonesia.co.id:4433/x123449/xhdhhdencript12092003posaja.php?id=";
    const BATCH_SIZE = 10;

    const elements = {
        input: document.getElementById("resiInput"),
        clear: document.getElementById("clearInputBtn"),
        validCount: document.getElementById("validCount"),
        duplicateCount: document.getElementById("duplicateCount"),
        validation: document.getElementById("validationMessage"),
        openAll: document.getElementById("openAllBtn"),
        openAllLabel: document.getElementById("openAllLabel"),
        preview: document.getElementById("previewBtn"),
        results: document.getElementById("resultArea"),
        resultCount: document.getElementById("resultCount"),
        resultSummary: document.getElementById("resultSummary"),
        cards: document.getElementById("cardsContainer"),
        status: document.getElementById("statusMessage"),
        openBatch: document.getElementById("openBatchBtn"),
        openBatchLabel: document.getElementById("openBatchLabel"),
        copyLinks: document.getElementById("copyLinksBtn")
    };

    let currentItems = [];
    let nextBatchIndex = 0;

    function normalizeToken(value) {
        return value
            .trim()
            .toUpperCase()
            .replace(/^[^A-Z0-9]+|[^A-Z0-9-]+$/g, "");
    }

    function parseInput(rawValue) {
        const tokens = rawValue
            .replace(/\r/g, "\n")
            .split(/[\n,;\t\s]+/)
            .map(normalizeToken)
            .filter(Boolean);

        const unique = [];
        const duplicates = [];
        const invalid = [];
        const seen = new Set();

        tokens.forEach((token) => {
            if (!/^[A-Z0-9-]{6,40}$/.test(token)) {
                invalid.push(token);
                return;
            }

            if (seen.has(token)) {
                duplicates.push(token);
                return;
            }

            seen.add(token);
            unique.push(token);
        });

        return { unique, duplicates, invalid };
    }

    function createTrackingItem(resi) {
        return {
            resi,
            url: `${TRACKING_BASE_URL}${encodeURIComponent(resi)}`
        };
    }

    function setValidation(message = "") {
        elements.validation.hidden = !message;
        elements.validation.textContent = message;
    }

    function setStatus(message = "", type = "success") {
        elements.status.hidden = !message;
        elements.status.className = `status-message ${type}`;
        elements.status.textContent = message;
    }

    function updateLiveState() {
        const parsed = parseInput(elements.input.value);
        const count = parsed.unique.length;

        elements.validCount.textContent = String(count);
        elements.duplicateCount.textContent = String(parsed.duplicates.length);
        elements.clear.hidden = elements.input.value.length === 0;
        elements.openAll.disabled = count === 0;
        elements.preview.disabled = count === 0;
        elements.openAllLabel.textContent = count > 0 ? `Buka ${count} hasil sekaligus` : "Buka semua hasil";

        if (parsed.invalid.length > 0) {
            setValidation(`${parsed.invalid.length} entri diabaikan karena formatnya terlalu pendek atau tidak dikenali.`);
        } else {
            setValidation();
        }

        if (currentItems.length > 0) {
            currentItems = [];
            nextBatchIndex = 0;
            elements.results.hidden = true;
            elements.cards.replaceChildren();
            setStatus();
        }
    }

    function prepareResults() {
        const parsed = parseInput(elements.input.value);
        currentItems = parsed.unique.map(createTrackingItem);
        nextBatchIndex = 0;

        if (currentItems.length === 0) {
            setValidation("Masukkan minimal satu nomor resi yang valid.");
            elements.input.focus();
            return false;
        }

        renderResults(parsed);
        return true;
    }

    function renderResults(parsed) {
        elements.cards.replaceChildren();
        elements.resultCount.textContent = String(currentItems.length);

        const notices = [];
        if (parsed.duplicates.length > 0) notices.push(`${parsed.duplicates.length} duplikat dihapus`);
        if (parsed.invalid.length > 0) notices.push(`${parsed.invalid.length} entri tidak valid diabaikan`);
        elements.resultSummary.textContent = notices.length > 0
            ? `${notices.join(" · ")}. Daftar berikut siap dibuka.`
            : "Klik satu per satu atau gunakan aksi massal di bawah.";

        const fragment = document.createDocumentFragment();

        currentItems.forEach((item, index) => {
            const card = document.createElement("article");
            card.className = "result-card";

            const number = document.createElement("span");
            number.className = "result-index";
            number.textContent = String(index + 1).padStart(2, "0");

            const info = document.createElement("div");
            info.className = "resi-info";
            const strong = document.createElement("strong");
            strong.textContent = item.resi;
            const detail = document.createElement("span");
            detail.textContent = "Lokasi dan foto antaran PosIND";
            info.append(strong, detail);

            const link = document.createElement("a");
            link.className = "resi-link";
            link.href = item.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.innerHTML = '<span>Buka hasil</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
            link.setAttribute("aria-label", `Buka hasil pelacakan ${item.resi}`);

            card.append(number, info, link);
            fragment.appendChild(card);
        });

        elements.cards.appendChild(fragment);
        elements.results.hidden = false;
        updateBatchButton();
    }

    function openTabs(items) {
        let opened = 0;

        items.forEach((item) => {
            const tab = window.open("about:blank", "_blank");
            if (!tab) return;

            tab.opener = null;
            tab.location.replace(item.url);
            opened += 1;
        });

        return opened;
    }

    function reportOpenResult(requested, opened) {
        if (opened === requested) {
            setStatus(`${opened} tab hasil pelacakan berhasil diminta untuk dibuka.`, "success");
            return;
        }

        if (opened === 0) {
            setStatus("Browser memblokir tab baru. Izinkan pop-up untuk lacak.posnew.com, lalu klik tombol kembali.", "warning");
            return;
        }

        setStatus(`${opened} dari ${requested} tab dapat dibuka. Izinkan pop-up, lalu gunakan tombol batch untuk sisanya.`, "warning");
    }

    function handleOpenAll() {
        if (!prepareResults()) return;
        const opened = openTabs(currentItems);
        nextBatchIndex = opened >= currentItems.length ? 0 : opened;
        reportOpenResult(currentItems.length, opened);
        updateBatchButton();
        elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handlePreview() {
        if (!prepareResults()) return;
        setStatus("Daftar berhasil disiapkan tanpa membuka tab baru.", "success");
        elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleOpenBatch() {
        if (currentItems.length === 0 && !prepareResults()) return;

        if (nextBatchIndex >= currentItems.length) nextBatchIndex = 0;
        const batch = currentItems.slice(nextBatchIndex, nextBatchIndex + BATCH_SIZE);
        const opened = openTabs(batch);
        reportOpenResult(batch.length, opened);

        if (opened > 0) {
            nextBatchIndex += batch.length;
            if (nextBatchIndex >= currentItems.length) nextBatchIndex = 0;
        }

        updateBatchButton();
    }

    function updateBatchButton() {
        if (currentItems.length === 0) {
            elements.openBatch.disabled = true;
            elements.openBatchLabel.textContent = "Buka 10 berikutnya";
            return;
        }

        elements.openBatch.disabled = false;
        const start = nextBatchIndex >= currentItems.length ? 0 : nextBatchIndex;
        const remaining = currentItems.length - start;
        const amount = Math.min(BATCH_SIZE, remaining);
        elements.openBatchLabel.textContent = currentItems.length <= BATCH_SIZE
            ? `Buka ${currentItems.length} hasil`
            : `Buka batch berikutnya (${amount})`;
    }

    async function copyAllLinks() {
        if (currentItems.length === 0 && !prepareResults()) return;
        const text = currentItems.map((item) => `${item.resi}\t${item.url}`).join("\n");

        try {
            await navigator.clipboard.writeText(text);
            setStatus(`${currentItems.length} link berhasil disalin ke clipboard.`, "success");
        } catch (error) {
            const fallback = document.createElement("textarea");
            fallback.value = text;
            fallback.style.position = "fixed";
            fallback.style.opacity = "0";
            document.body.appendChild(fallback);
            fallback.select();
            const copied = document.execCommand("copy");
            fallback.remove();
            setStatus(copied ? `${currentItems.length} link berhasil disalin.` : "Link tidak dapat disalin otomatis. Silakan buka satu per satu dari daftar.", copied ? "success" : "error");
        }
    }

    elements.input.addEventListener("input", updateLiveState);
    elements.clear.addEventListener("click", () => {
        elements.input.value = "";
        updateLiveState();
        elements.input.focus();
    });
    elements.openAll.addEventListener("click", handleOpenAll);
    elements.preview.addEventListener("click", handlePreview);
    elements.openBatch.addEventListener("click", handleOpenBatch);
    elements.copyLinks.addEventListener("click", copyAllLinks);
    elements.input.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleOpenAll();
        }
    });

    updateLiveState();
    updateBatchButton();
})();
