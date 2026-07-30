export default {
  editor: { label: { en: "Unified Nav" } },
  triggerEvents: [
    { name: "navigate", label: { en: "On destination selected" }, event: { id: "", kind: "portal", label: "", item: {} } },
    { name: "navigateChild", label: { en: "On sub-page selected" }, event: { parentId: "", id: "", label: "", child: {} } },
  ],
  properties: {
    // ---- Navigation model ----
    // items: the top-level destinations (bar + More sheet). Each item:
    //   { id, label, icon, kind, inBar, badge }
    //   kind:   "portal" (main workspace) | "hub" (quick-access global tool)
    //   inBar:  true -> show directly in the bottom bar; the rest go under "More"
    //   badge:  number (or bindable) -> red count bubble (Notifications, Tasks...)
    // icon names: home, bell, check-square, calendar, book, briefcase, users, truck,
    //   chart, shield, grid, folder, wrench, map, dollar, clipboard, layers, compass,
    //   send, target, dot
    items: {
      label: { en: "Destinations" }, type: "Array", bindable: true,
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              id: { label: "Id (route/page key)", type: "Text" },
              label: { label: "Label", type: "Text" },
              icon: { label: "Icon name", type: "Text" },
              kind: { label: "Kind (portal/hub)", type: "Text" },
              inBar: { label: "Show in bottom bar", type: "OnOff" },
              badge: { label: "Badge count", type: "Number" },
            },
          },
        },
      },
      defaultValue: [
        { id: "home", label: "Home", icon: "home", kind: "hub", inBar: true },
        { id: "jobs", label: "Jobs", icon: "briefcase", kind: "portal", inBar: true },
        { id: "customers", label: "Customers", icon: "users", kind: "portal", inBar: true },
        { id: "vendors", label: "Vendors", icon: "truck", kind: "portal", inBar: true },
        { id: "notifications", label: "Notifications", icon: "bell", kind: "hub", inBar: false, badge: 3 },
        { id: "tasks", label: "Tasks", icon: "check-square", kind: "hub", inBar: false, badge: 1 },
        { id: "vendor-calendar", label: "Vendor Calendar", icon: "calendar", kind: "hub", inBar: false },
        { id: "price-guide", label: "Price Guide", icon: "book", kind: "hub", inBar: false },
        { id: "reporting", label: "Reporting", icon: "chart", kind: "portal", inBar: false },
        { id: "admin", label: "Admin", icon: "shield", kind: "portal", inBar: false },
      ],
    },

    // subPages: the contextual strip. FLAT list (one level deep, so WeWeb doesn't
    // crop the fields). `parent` is the item id it belongs to; the strip shows the
    // rows whose parent matches the active destination.
    subPages: {
      label: { en: "Sub-pages (contextual strip)" }, type: "Array", bindable: true,
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              parent: { label: "Parent item id", type: "Text" },
              id: { label: "Id (route/page key)", type: "Text" },
              label: { label: "Label", type: "Text" },
              icon: { label: "Icon name (optional)", type: "Text" },
              badge: { label: "Badge count", type: "Number" },
            },
          },
        },
      },
      defaultValue: [
        { parent: "jobs", id: "projects", label: "Projects", icon: "folder" },
        { parent: "jobs", id: "trackers", label: "Trackers", icon: "target" },
        { parent: "jobs", id: "calendar", label: "Calendar", icon: "calendar" },
        { parent: "jobs", id: "estimates", label: "Estimates", icon: "clipboard" },
        { parent: "jobs", id: "buckets", label: "Buckets", icon: "layers" },
        { parent: "jobs", id: "dispatch", label: "Dispatch", icon: "send" },
        { parent: "jobs", id: "margin", label: "Margin", icon: "dollar" },
        { parent: "jobs", id: "coordination", label: "Coordination", icon: "compass" },
        { parent: "jobs", id: "pm-board", label: "PM Board", icon: "grid" },
        { parent: "customers", id: "directory", label: "Directory", icon: "users" },
        { parent: "customers", id: "properties", label: "Properties", icon: "map" },
        { parent: "vendors", id: "vendor-list", label: "Vendor List", icon: "truck" },
        { parent: "vendors", id: "vendor-onboarding", label: "Onboarding", icon: "clipboard" },
      ],
    },

    // ---- Active state (bind to your current route / page) ----
    activeId: { label: { en: "Active destination id (bind)" }, type: "Text", defaultValue: "jobs", bindable: true },
    activeChildId: { label: { en: "Active sub-page id (bind)" }, type: "Text", defaultValue: "projects", bindable: true },

    // ---- Behavior / layout ----
    maxBarItems: { label: { en: "Max items in bar (incl. More)" }, type: "Number", options: { min: 3, max: 6, step: 1 }, defaultValue: 5, bindable: true },
    showContextual: { label: { en: "Show sub-page strip" }, type: "OnOff", defaultValue: true, bindable: true },
    showLabels: { label: { en: "Show bar labels" }, type: "OnOff", defaultValue: true, bindable: true },
    fixed: { label: { en: "Pin to bottom of screen" }, type: "OnOff", defaultValue: true, bindable: true },
    maxWidth: { label: { en: "Max width (px, desktop)" }, type: "Number", options: { min: 320, max: 1600, step: 10 }, defaultValue: 640, bindable: true },
    moreLabel: { label: { en: "More button label" }, type: "Text", defaultValue: "More", bindable: true },
    hubsLabel: { label: { en: "Sheet: hubs group label" }, type: "Text", defaultValue: "Quick access", bindable: true },
    portalsLabel: { label: { en: "Sheet: portals group label" }, type: "Text", defaultValue: "Portals", bindable: true },
    ariaLabel: { label: { en: "Bar aria-label" }, type: "Text", defaultValue: "Primary", bindable: true },

    // ---- Theme (standard across pp- components) ----
    primaryColor: { label: { en: "Primary color" }, type: "Color", defaultValue: "#10b981", bindable: true },
    accentColor: { label: { en: "Accent color" }, type: "Color", defaultValue: "#6366f1", bindable: true },
    darkMode: {
      label: { en: "Theme mode" }, type: "TextSelect",
      options: { options: [
        { value: "auto", label: { en: "Auto (system)" } },
        { value: "light", label: { en: "Light" } },
        { value: "dark", label: { en: "Dark" } },
      ] }, defaultValue: "auto", bindable: true,
    },
  },
};
