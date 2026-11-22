// Default values pulled directly from Yami.obt so we know what changed
const DEFAULT_YAMI_VARS = {
  // Window frame, menu bar, and inactive toolbar buttons (yeah, OBS Qt is weird)
  "--bg_window": "#1d1f26",

  // Docks, Scene/Source lists, Audio Mixer & Status Bar
  "--bg_base": "#272a33",

  // Dock Titlebars (uses --grey5 in Yami.obt)
  "--grey5": "#323540",

  // The stream preview canvas backdrop
  "--bg_preview": "#13141a",

  // Action buttons (Start Streaming, Recording, Settings, etc.)
  "--button_bg": "#3c404d",

  // Button hover, which is the dock tools and the controls buttons? Why??
  "--button_bg_hover": "#464b59",

  // Active clicked / pressed state
  "--button_bg_down": "#1d1f26",

  // Menu selected item & active scene/source selection highlight
  "--primary": "#284cb8",

  // Secondary accent: slider fader knob, selection border outline
  "--primary_light": "#476bd7",

  // Global text color across the entire interface
  "--text": "#ffffff",

  // Dock borders, status bar top line, menu divider, and audio mixer channels.
  "--border_color": "#3c404d"
};

/**
 * Simple Mode vars.
 */
const SIMPLE_MODE_VARS = [
  {
    key: "--bg_window",
    name: "Window & Menu Background",
    description: "Application outer window frame, top menu bar, and inactive toolbar buttons (OBS Qt quirk).",
    affects: ["Window Frame", "Top Menu Bar", "Inactive Toolbar Buttons"],
    default: "#1d1f26"
  },
  {
    key: "--bg_base",
    name: "Docks, Lists, Mixer & Status Bar",
    description: "Dock panel backgrounds, scene/source lists, audio mixer channels, and bottom status bar.",
    affects: ["Dock Panels", "Scenes & Sources Lists", "Audio Mixer Box", "Status Bar"],
    default: "#272a33"
  },
  {
    key: "--grey5",
    name: "Dock Titlebars",
    description: "Background color of all dock titlebars across OBS Studio (uses --grey5 in Yami).",
    affects: ["Dock Titlebars"],
    default: "#323540"
  },
  {
    key: "--button_bg",
    name: "Action Buttons",
    description: "In OBS, action buttons (Start Streaming, Settings, etc.) use this color. Also affects transition add icon and Stats reset button. (Dock titlebars use --grey5 #323540, not button_bg).",
    affects: ["Action Buttons", "Transition Add Icon", "Stats Reset Button"],
    default: "#3c404d"
  },
  {
    key: "--button_bg_hover",
    name: "Button & Tool Button Hover",
    description: "Hover background on action buttons, dock toolbar buttons (+, -, ▲, ▼, ⚙), and mixer buttons.",
    affects: ["Control Buttons Hover", "Dock Toolbar Buttons (+, -, ▲, ▼) Hover", "Audio Mixer Buttons Hover"],
    default: "#464b59"
  },
  {
    key: "--button_bg_down",
    name: "Button Pressed State",
    description: "Background color when an action button or tool button is actively clicked or held down.",
    affects: ["Control Buttons Pressed State"],
    default: "#1d1f26"
  },
  {
    key: "--primary",
    name: "Primary Accent & Selection",
    description: "Active menu item selection and active scene/source selection highlight.",
    affects: ["Selected Scene / Source Item", "Menu Item Selection"],
    default: "#284cb8"
  },
  {
    key: "--primary_light",
    name: "Accent Light & Slider Faders",
    description: "Audio mixer slider handles, tool button highlights, and selected item outline.",
    affects: ["Audio Fader Handles", "Selected Item Border Outline"],
    default: "#476bd7"
  },
  {
    key: "--bg_preview",
    name: "Preview Canvas Backdrop",
    description: "Background area behind the stream viewport. (Borderless in OBS).",
    affects: ["Preview Canvas Area"],
    default: "#13141a"
  },
  {
    key: "--text",
    name: "Global Text Color",
    description: "All interface text across OBS (menus, buttons, dock titles, lists, stats, and mixer).",
    affects: ["All Text Across Interface"],
    default: "#ffffff"
  },
  {
    key: "--border_color",
    name: "Borders & Separator Lines",
    description: "Outer dock outlines, status bar top line, menu bar divider, and audio mixer channels. Does not affect list containers, toolbar buttons, or dropdown inputs.",
    affects: ["Dock Outlines", "Status Bar Top Line", "Menu Bar Divider", "Audio Mixer Channels"],
    default: "#3c404d"
  }
];

/**
 * Normalizes hex colors so "#fff" and "#FFFFFF" count as the same color.
 * Saves us from generating useless diffs.
 */
function normalizeColor(colorStr) {
  if (!colorStr) return "";
  let c = colorStr.trim().toLowerCase();
  if (c.startsWith("#") && c.length === 4) {
    c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  }
  return c;
}

/**
 * Generates the .ovt file text.
 * 
 * Rules:
 *  - Extends com.obsproject.Yami.
 *  - Only writes variables that are modified. Excpect Advanced Mode is gonna have "Must generate" tags or some shit 'cause shit breaks.
 *  - If you changed nothing, it outputs an empty block with a comment. Basically saying "good job fuckwit".
 *  - No arbitrary CSS rules, no VolumeMeter blocks, no padding/margin garbage.
 */
function generateObsOvt(themeName, currentVars, baseVars = DEFAULT_YAMI_VARS) {
  const safeName = (themeName || "CustomStudioTheme").trim();
  const safeId = safeName.replace(/[^a-zA-Z0-9]/g, "");

  // Collect only the variables that differ from Yami's default
  const changedVars = [];
  for (const [key, val] of Object.entries(currentVars)) {
    const baseVal = baseVars[key];
    if (baseVal && normalizeColor(val) !== normalizeColor(baseVal)) {
      changedVars.push(`    ${key}: ${val};`);
    }
  }

  const varsBlock = changedVars.length > 0
    ? changedVars.join("\n")
    : "    /* No variable overrides - theme matches default Yami */";

  return `@OBSThemeMeta {
    name: '${safeName}';
    id: 'com.obsproject.Yami.${safeId}';
    extends: 'com.obsproject.Yami';
    author: 'Author';
    dark: 'true';
}

@OBSThemeVars {
${varsBlock}
}
`;
}
