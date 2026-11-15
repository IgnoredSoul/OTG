const VERSION = "v0.6.0"

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("app-title-thingo").innerHTML = `OBS Theme Studio - ${VERSION}`

  // Current working palette that SHOULD be identical to Yami default
  let currentThemeVars = { ...DEFAULT_YAMI_VARS };
  let activeVarKey = "--button_bg";
  let themeName = "CustomStudioTheme";

  // DOM elements we need to touch
  const obsWindow = document.getElementById("obs-window");
  const themeNameInput = document.getElementById("theme-name-input");
  const selectedVarLabel = document.getElementById("selected-var-label");

  // Tabs
  const tabSelected = document.getElementById("tab-selected");
  const tabAll = document.getElementById("tab-all");
  const viewSelectedVar = document.getElementById("view-selected-var");
  const viewAllVars = document.getElementById("view-all-vars");

  // Active Variable Card in sidebar
  const activeName = document.getElementById("active-name");
  const activeKeyCode = document.getElementById("active-key-code");
  const activeDesc = document.getElementById("active-desc");
  const activeAffectsContainer = document.getElementById("active-affects-container");
  const activeColorPicker = document.getElementById("active-color-picker");
  const activeColorHex = document.getElementById("active-color-hex");
  const activeDiffBadge = document.getElementById("active-diff-badge");
  const btnRevertVar = document.getElementById("btn-revert-var");
  const varsNavigator = document.getElementById("vars-navigator");

  // Guide Modal
  const modalGuide = document.getElementById("modal-guide");
  const btnGuide = document.getElementById("btn-guide");

  // Action buttons
  const btnReset = document.getElementById("btn-reset");
  const btnExport = document.getElementById("btn-export");
  const sidebarBtnExport = document.getElementById("sidebar-btn-export");
  const sidebarBtnCopy = document.getElementById("sidebar-btn-copy");

  // Toast notification
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toast-text");

  // ==========================================
  // Start shit
  // ==========================================
  function init() {
    buildVarsNavigator();
    setupTargetClickListeners();
    setupTabSwitching();
    setupModalHandlers();
    setupHeaderButtons();
    setupColorInputs();
    setActiveVar("--bg_window");
    applyThemeVariables();

    // Keep theme name clean
    themeNameInput.addEventListener("input", (e) => themeName = e.target.value.trim().replace(/[^a-zA-Z0-9_\-\s]/g, "") || "CustomStudioTheme");
  }

  // Push variables into the DOM so the mockup actually repaints
  function applyThemeVariables() {
    Object.entries(currentThemeVars).forEach(([key, val]) => {
      obsWindow.style.setProperty(key, val);
    });
  }

  // Click any element with data-var in the mockup to inspect that variable
  function setupTargetClickListeners() {
    const targets = obsWindow.querySelectorAll("[data-var]");
    targets.forEach((elem) => {
      elem.addEventListener("click", (e) => {
        e.stopPropagation();
        const varKey = elem.getAttribute("data-var");
        if (varKey && currentThemeVars[varKey] !== undefined) {
          setActiveVar(varKey);
          activateTab("selected");
        }
      });
    });
  }

  // Switch the active variable in the inspector and highlight all linked elements
  function setActiveVar(varKey) {
    const varMeta = SIMPLE_MODE_VARS.find((v) => v.key === varKey);
    if (!varMeta) return;

    activeVarKey = varKey;

    // Remove old highlights, slap new outline on all elements linked to this var
    obsWindow.querySelectorAll("[data-var]").forEach((el) => {
      el.classList.remove("active-linked-var");
    });
    const linkedElements = obsWindow.querySelectorAll(`[data-var="${varKey}"]`);
    linkedElements.forEach((el) => el.classList.add("active-linked-var"));

    if (selectedVarLabel) {
      selectedVarLabel.textContent = `${varMeta.name} (${varKey})`;
    }

    // Populate the sidebar card
    activeName.textContent = varMeta.name;
    activeKeyCode.textContent = varKey;
    activeDesc.textContent = varMeta.description;

    // Fill in the pills showing what this actually touches in OBS
    activeAffectsContainer.innerHTML = "";
    varMeta.affects.forEach((itemText) => {
      const badge = document.createElement("span");
      badge.style.cssText = "font-size: 10px; background: rgba(47, 129, 247, 0.15); color: #58a6ff; border: 1px solid rgba(47, 129, 247, 0.3); padding: 2px 7px; border-radius: 4px; font-weight: 500;";
      badge.textContent = itemText;
      activeAffectsContainer.appendChild(badge);
    });

    syncActiveInputs();

    // Update active highlight in the All Variables tab
    document.querySelectorAll(".var-nav-item").forEach((item) => {
      if (item.getAttribute("data-nav-var") === varKey) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  // Keep the color picker and text hex input in sync
  // Which used to just spans the shit out of style editor, no idea why it's not now
  function syncActiveInputs() {
    const val = currentThemeVars[activeVarKey] || "#ffffff";
    activeColorPicker.value = val;
    activeColorHex.value = val;

    // If it differs from default Yami, show the "Modified" badge and revert button
    const isModified = normalizeColor(val) !== normalizeColor(DEFAULT_YAMI_VARS[activeVarKey]);
    if (isModified) {
      activeDiffBadge.style.display = "inline";
      btnRevertVar.style.display = "inline-flex";
    } else {
      activeDiffBadge.style.display = "none";
      btnRevertVar.style.display = "none";
    }
  }

  // Handle color picker dragging and typing hex directly
  function setupColorInputs() {
    activeColorPicker.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase();
      activeColorHex.value = val;
      updateVariableColor(activeVarKey, val);
    });

    activeColorHex.addEventListener("input", (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith("#")) {
        val = "#" + val;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        activeColorPicker.value = val;
        updateVariableColor(activeVarKey, val);
      }
    });

    // Revert just this single variable back to default
    btnRevertVar.addEventListener("click", () => {
      const defaultVal = DEFAULT_YAMI_VARS[activeVarKey];
      if (defaultVal) {
        updateVariableColor(activeVarKey, defaultVal);
        syncActiveInputs();
        showToast(`Reverted ${activeVarKey} to default`);
      }
    });
  }

  // Update variable and refresh the navigator dots
  function updateVariableColor(varKey, colorVal) {
    currentThemeVars[varKey] = colorVal;
    obsWindow.style.setProperty(varKey, colorVal);
    syncActiveInputs();
    buildVarsNavigator();
  }

  // Build the list of all variables in Tab 2
  function buildVarsNavigator() {
    varsNavigator.innerHTML = "";
    SIMPLE_MODE_VARS.forEach((v) => {
      const curColor = currentThemeVars[v.key] || v.default;
      const isModified = normalizeColor(curColor) !== normalizeColor(DEFAULT_YAMI_VARS[v.key]);

      const item = document.createElement("div");
      item.className = "part-nav-item var-nav-item" + (v.key === activeVarKey ? " active" : "");
      item.setAttribute("data-nav-var", v.key);

      item.innerHTML = `
        <div class="part-nav-info" style="gap: 10px;">
          <span style="width: 14px; height: 14px; border-radius: 50%; background-color: ${curColor}; border: 1px solid rgba(255,255,255,0.2); display: inline-block; flex-shrink: 0;"></span>
          <div style="display: flex; flex-direction: column;">
            <div style="font-weight: 600; font-size: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>${v.name}</span>
              ${isModified ? '<span style="font-size: 9px; color: var(--brand-accent); font-weight: 700;">• Modified</span>' : ''}
            </div>
            <code style="font-size: 10px; color: var(--text-muted);">${v.key}</code>
          </div>
        </div>
        <span style="opacity: 0.6; font-size: 11px;">→</span>
      `;

      item.addEventListener("click", () => {
        setActiveVar(v.key);
        activateTab("selected");
      });

      varsNavigator.appendChild(item);
    });
  }

  // Switching between "Active Variable" and "All Variables"
  function setupTabSwitching() {
    tabSelected.addEventListener("click", () => activateTab("selected"));
    tabAll.addEventListener("click", () => activateTab("all"));
  }

  function activateTab(tab) {
    if (tab === "selected") {
      tabSelected.classList.add("active");
      tabAll.classList.remove("active");
      viewSelectedVar.style.display = "block";
      viewAllVars.style.display = "none";
    } else {
      tabAll.classList.add("active");
      tabSelected.classList.remove("active");
      viewSelectedVar.style.display = "none";
      viewAllVars.style.display = "block";
    }
  }

  function setupModalHandlers() {
    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close");
        closeModal(modalId);
      });
    });

    if (modalGuide) {
      modalGuide.addEventListener("click", (e) => {
        if (e.target === modalGuide) {
          modalGuide.classList.remove("active");
        }
      });
    }

    if (btnGuide) {
      btnGuide.addEventListener("click", () => {
        modalGuide.classList.add("active");
      });
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  // Top header button bindings
  function setupHeaderButtons() {
    // Reset everything to default
    btnReset.addEventListener("click", () => {
      if (confirm("Reset all variables back to default Yami.obt values?")) {
        currentThemeVars = { ...DEFAULT_YAMI_VARS };
        applyThemeVariables();
        syncActiveInputs();
        buildVarsNavigator();
        showToast("Reset all variables to default Yami");
      }
    });

    // Export .ovt
    btnExport.addEventListener("click", triggerDownloadOvt);
    sidebarBtnExport.addEventListener("click", triggerDownloadOvt);

    // Copy .ovt
    sidebarBtnCopy.addEventListener("click", () => {
      const ovtCode = generateObsOvt(themeName, currentThemeVars, DEFAULT_YAMI_VARS);
      copyToClipboard(ovtCode, "OBS Variant Theme (.ovt) copied to clipboard!");
    });
  }

  // Generates the .ovt file
  function triggerDownloadOvt() {
    const ovtCode = generateObsOvt(themeName, currentThemeVars, DEFAULT_YAMI_VARS);
    const cleanFileName = themeName.trim().replace(/[\s\/\\]+/g, "_") || "CustomStudioTheme";
    const fileName = `${cleanFileName}.ovt`;
    const blob = new Blob([ovtCode], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${fileName}! Drop it in your OBS themes folder.`);
  }

  // Copy helper with fallback for older browsers
  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopyText(text, successMsg);
      });
    } else {
      fallbackCopyText(text, successMsg);
    }
  }

  function fallbackCopyText(text, successMsg) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(successMsg);
    } catch (err) {
      showToast("Unable to copy to clipboard");
    }
    document.body.removeChild(textArea);
  }

  // Show popup for 2.5s at the bottom of the screen
  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  window.copyPath = function (pathStr) {
    copyToClipboard(pathStr, "Path copied to clipboard!");
  };

  init();
});
