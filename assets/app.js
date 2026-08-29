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
        copyLinks: document.getElementById("copyLinksBtn"),
        popupLockNotice: document.getElementById("popupLockNotice"),
        showPermissionGuide: document.getElementById("showPermissionGuideBtn"),
        permissionDialog: document.getElementById("popupPermissionDialog"),
        closePermissionGuide: document.getElementById("closePermissionGuideBtn"),
        cancelPermission: document.getElementById("cancelPermissionBtn"),
        recheckPopup: document.getElementById("recheckPopupBtn"),
        permissionCheckStatus: document.getElementById("permissionCheckStatus"),
        permissionPlatforms: document.querySelectorAll("[data-permission-platform]")
    };

    let currentItems = [];
    let nextBatchIndex = 0;
    let popupBlocked = false;
    let pendingOpenRequest = null;

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

    function getPermissionPlatform() {
        const userAgent = navigator.userAgent || "";
        const isIPadDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
        if (/iPad|iPhone|iPod/i.test(userAgent) || isIPadDesktopMode) return "ios";
        if (/Android/i.test(userAgent)) return "android";
        return "desktop";
    }

    function updatePermissionInstructions() {
        const platform = getPermissionPlatform();
        elements.permissionPlatforms.forEach((instruction) => {
            instruction.hidden = instruction.dataset.permissionPlatform !== platform;
        });
    }

    function showPermissionDialog() {
        updatePermissionInstructions();
        elements.permissionCheckStatus.hidden = true;
        elements.permissionCheckStatus.textContent = "";
        elements.recheckPopup.textContent = pendingOpenRequest
            ? "Sudah pilih Allow — cek & lacak"
            : "Sudah pilih Allow — cek izin";
        document.body.classList.add("permission-dialog-open");

        if (typeof elements.permissionDialog.showModal === "function") {
            if (!elements.permissionDialog.open) elements.permissionDialog.showModal();
        } else {
            elements.permissionDialog.setAttribute("open", "");
        }

        window.requestAnimationFrame(() => elements.recheckPopup.focus());
    }

    function closePermissionDialog() {
        if (typeof elements.permissionDialog.close === "function" && elements.permissionDialog.open) {
            elements.permissionDialog.close();
        } else {
            elements.permissionDialog.removeAttribute("open");
        }
        document.body.classList.remove("permission-dialog-open");
    }

    function updateOpenControls(count = parseInput(elements.input.value).unique.length) {
        const locked = popupBlocked && count > 0;

        elements.openAll.disabled = count === 0 || popupBlocked;
        elements.openAllLabel.textContent = locked
            ? "Izinkan pop-up untuk lanjut"
            : count > 0
                ? `Buka ${count} hasil sekaligus`
                : "Buka semua hasil";
        elements.openAll.setAttribute("aria-describedby", locked ? "popupLockText" : "inputHelp");
        elements.popupLockNotice.hidden = !popupBlocked;
    }

    function markPopupBlocked() {
        popupBlocked = true;
        updateOpenControls();
        updateBatchButton();
        showPermissionDialog();
    }

    function markPopupAllowed() {
        popupBlocked = false;
        updateOpenControls();
        updateBatchButton();
        closePermissionDialog();
    }

    function updateLiveState() {
        const parsed = parseInput(elements.input.value);
        const count = parsed.unique.length;

        elements.validCount.textContent = String(count);
        elements.duplicateCount.textContent = String(parsed.duplicates.length);
        elements.clear.hidden = elements.input.value.length === 0;
        elements.preview.disabled = count === 0;
        updateOpenControls(count);

        if (parsed.invalid.length > 0) {
            setValidation(`${parsed.invalid.length} entri diabaikan karena formatnya terlalu pendek atau tidak dikenali.`);
        } else {
            setValidation();
        }

        if (currentItems.length > 0) {
            currentItems = [];
            nextBatchIndex = 0;
            pendingOpenRequest = null;
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

    function openTabs(items, initialTab = null) {
        const tabs = new Array(items.length);

        /*
         * Semua slot tab disiapkan sebelum halaman resi dijalankan. Jika satu slot
         * saja diblokir, slot yang sudah terbuka ditutup lagi. Dengan demikian
         * pelacakan tidak pernah berjalan sebagian sebelum izin benar-benar aktif.
         * Slot dibuat dari resi terbawah agar urutan tab akhirnya tetap mengikuti
         * urutan input pada Firefox, Edge, dan sebagian konfigurasi Chrome.
         */
        for (let index = items.length - 1; index >= 0; index -= 1) {
            const tab = index === items.length - 1 && initialTab
                ? initialTab
                : window.open("about:blank", "_blank");
            if (!tab) {
                tabs.forEach((openedTab) => {
                    if (!openedTab) return;
                    try {
                        openedTab.close();
                    } catch (error) {
                        // Browser boleh mengabaikan close(); tab tetap tidak diarahkan ke resi.
                    }
                });
                return { opened: 0, remaining: items };
            }

            tabs[index] = tab;
        }

        items.forEach((item, index) => {
            const tab = tabs[index];
            try {
                tab.opener = null;
                tab.location.replace(item.url);
            } catch (error) {
                tab.location.href = item.url;
            }
        });

        // Pastikan hasil resi pada baris pertama yang terlihat lebih dahulu.
        if (tabs[0]) {
            try {
                tabs[0].focus();
            } catch (error) {
                // Browser boleh mengabaikan focus(); urutan tab tetap sudah benar.
            }
        }

        return { opened: items.length, remaining: [] };
    }

    function reportOpenResult(requested, opened) {
        if (opened === requested) {
            setStatus(`${opened} tab berhasil dibuka dari resi teratas ke resi terbawah.`, "success");
            return;
        }

        if (opened === 0) {
            setStatus("Browser memblokir tab baru. Lacak Semua dikunci sampai izin pop-up berhasil diperiksa.", "warning");
            return;
        }

        setStatus(`${opened} dari ${requested} tab dapat dibuka. Izinkan pop-up agar tab yang tersisa dapat dilanjutkan tanpa duplikat.`, "warning");
    }

    function runOpenRequest(items, request, initialTab = null) {
        const result = openTabs(items, initialTab);
        const openedTotal = request.opened + result.opened;

        if (result.remaining.length > 0) {
            pendingOpenRequest = {
                ...request,
                items: result.remaining,
                opened: openedTotal
            };
            reportOpenResult(request.total, openedTotal);
            markPopupBlocked();
            return false;
        }

        pendingOpenRequest = null;
        markPopupAllowed();
        reportOpenResult(request.total, openedTotal);
        request.onComplete();
        return true;
    }

    function verifyPermissionAndContinue() {
        const testTab = window.open("about:blank", "_blank");

        if (!testTab) {
            elements.permissionCheckStatus.textContent = "Izin belum aktif. Pilih Allow pada browser, lalu tekan tombol pemeriksaan ini lagi.";
            elements.permissionCheckStatus.hidden = false;
            popupBlocked = true;
            updateOpenControls();
            updateBatchButton();
            return;
        }

        if (pendingOpenRequest) {
            const request = pendingOpenRequest;
            const succeeded = runOpenRequest(request.items, request, testTab);
            if (!succeeded) {
                elements.permissionCheckStatus.textContent = "Izin belum aktif. Pilih Allow pada browser, lalu tekan tombol pemeriksaan ini lagi.";
                elements.permissionCheckStatus.hidden = false;
            }
            return;
        }

        try {
            testTab.close();
        } catch (error) {
            // Tab pemeriksaan boleh tetap terbuka jika browser menolak close().
        }

        markPopupAllowed();
        setStatus("Izin pop-up sudah aktif. Tombol Lacak Semua dapat digunakan kembali.", "success");
    }

    function handleOpenAll() {
        if (popupBlocked) {
            showPermissionDialog();
            return;
        }
        if (!prepareResults()) return;
        const request = {
            items: currentItems,
            total: currentItems.length,
            opened: 0,
            onComplete: () => {
                nextBatchIndex = 0;
                updateBatchButton();
            }
        };
        runOpenRequest(request.items, request);
        elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handlePreview() {
        if (!prepareResults()) return;
        setStatus("Daftar berhasil disiapkan tanpa membuka tab baru.", "success");
        elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleOpenBatch() {
        if (popupBlocked) {
            showPermissionDialog();
            return;
        }
        if (currentItems.length === 0 && !prepareResults()) return;

        if (nextBatchIndex >= currentItems.length) nextBatchIndex = 0;
        const batchStart = nextBatchIndex;
        const batch = currentItems.slice(batchStart, batchStart + BATCH_SIZE);
        const request = {
            items: batch,
            total: batch.length,
            opened: 0,
            onComplete: () => {
                nextBatchIndex = batchStart + batch.length;
                if (nextBatchIndex >= currentItems.length) nextBatchIndex = 0;
                updateBatchButton();
            }
        };

        runOpenRequest(request.items, request);
    }

    function updateBatchButton() {
        if (currentItems.length === 0) {
            elements.openBatch.disabled = true;
            elements.openBatchLabel.textContent = "Buka 10 berikutnya";
            return;
        }

        if (popupBlocked) {
            elements.openBatch.disabled = true;
            elements.openBatchLabel.textContent = "Izin pop-up diperlukan";
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
    elements.showPermissionGuide.addEventListener("click", showPermissionDialog);
    elements.closePermissionGuide.addEventListener("click", closePermissionDialog);
    elements.cancelPermission.addEventListener("click", closePermissionDialog);
    elements.recheckPopup.addEventListener("click", verifyPermissionAndContinue);
    elements.permissionDialog.addEventListener("cancel", () => {
        document.body.classList.remove("permission-dialog-open");
    });
    elements.input.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handleOpenAll();
        }
    });

    updateLiveState();
    updateBatchButton();
})();
