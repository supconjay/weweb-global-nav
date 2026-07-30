export default {
  editor: { label: { en: "Unified Nav" } },
  triggerEvents: [
    { name: "navigate", label: { en: "On destination selected" }, event: { id: "", kind: "portal", label: "", item: {} } },
    { name: "navigateChild", label: { en: "On sub-page selected" }, event: { parentId: "", id: "", label: "", child: {} } },
    { name: "notificationClick", label: { en: "On notification click" }, event: { id: "", index: 0, notification: {} } },
    { name: "viewAllNotifications", label: { en: "On 'View All' click" }, event: {} },
    { name: "markAllRead", label: { en: "On 'Mark All as Read' click" }, event: {} },
  ],
  properties: {
    // ---- Navigation model ----
    // items: the top-level destinations (bar + More sheet). Each item:
    //   { id, label, icon, kind, inBar, badge }
    //   kind:   "portal" (main workspace) | "hub" (quick-access global tool)
    //   inBar:  true -> show directly in the bottom bar; the rest go under "More"
    //   badge:  number -> red count bubble (Notifications, Tasks...)
    //   hidden: true -> omit this destination entirely (role-based visibility)
    //
    // DYNAMIC badge / hidden: WeWeb cannot bind individual fields INSIDE an array
    // row (only whole properties get a bind toggle), so bind THIS ARRAY as a whole
    // to a formula and compute those fields per row. The component reads `badge`
    // and `hidden` off each row either way, so a static list still works.
    //   href:   set the destination URL/path -> the item renders as a real <a> so
    //           right-click / middle-click / cmd-click open it in a new tab.
    //           Plain left-click still fires `navigate` for fast in-app routing.
    // icon names: home, bell, check-square, calendar, book, briefcase, users, truck,
    //   chart, shield, grid, folder, wrench, map, dollar, clipboard, layers, compass,
    //   send, target, dot
    items: {
      label: { en: "Destinations" }, type: "Array", bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "array",
        tooltip: "Bind the WHOLE list to make badge/hidden dynamic (WeWeb can't bind individual fields inside an array row). Example:\n[\n  { id: 'home', label: 'Home', icon: 'home', kind: 'hub', inBar: true },\n  { id: 'notifications', label: 'Notifications', icon: 'bell', kind: 'hub', popover: 'notifications', badge: collections.user_notifications.data.length },\n  { id: 'admin', label: 'Admin', icon: 'shield', kind: 'portal', hidden: !isAdmin }\n]",
      },
      propertyHelp: { tooltip: "Each row: { id, label, icon, kind, inBar, badge, hidden, href, popover }. Edit rows here for a static nav, or bind the whole array for live badge counts and role-based hiding." },
      /* wwEditor:end */
      options: {
        expandable: true,
        getItemLabel(item) { return (item && item.label) || (item && item.id) || "Destination"; },
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
              hidden: { label: "Hide this item", type: "OnOff" },
              href: { label: "Link URL (enables new-tab)", type: "Text" },
              popover: { label: "Popover (set to 'notifications')", type: "Text" },
            },
          },
        },
      },
      defaultValue: [
        { id: "home", label: "Home", icon: "home", kind: "hub", inBar: true },
        { id: "jobs", label: "Jobs", icon: "briefcase", kind: "portal", inBar: true },
        { id: "customers", label: "Customers", icon: "users", kind: "portal", inBar: true },
        { id: "vendors", label: "Vendors", icon: "truck", kind: "portal", inBar: true },
        { id: "notifications", label: "Notifications", icon: "bell", kind: "hub", inBar: false, badge: 3, popover: "notifications" },
        { id: "tasks", label: "Tasks", icon: "check-square", kind: "hub", inBar: false, badge: 1 },
        { id: "margin-review", label: "Margin Review", icon: "dollar", kind: "hub", inBar: false },
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
      /* wwEditor:start */
      bindingValidation: {
        type: "array",
        tooltip: "Bind the WHOLE list for dynamic badge/hidden. Each row needs a `parent` matching a destination id, e.g.\n[{ parent: 'jobs', id: 'projects', label: 'Projects', icon: 'folder', hidden: !canSeeProjects }]",
      },
      propertyHelp: { tooltip: "Each row: { parent, id, label, icon, badge, hidden, href }. Rows show when their parent destination is active." },
      /* wwEditor:end */
      options: {
        expandable: true,
        getItemLabel(item) { return (item && item.label) || (item && item.id) || "Sub-page"; },
        item: {
          type: "Object",
          options: {
            item: {
              parent: { label: "Parent item id", type: "Text" },
              id: { label: "Id (route/page key)", type: "Text" },
              label: { label: "Label", type: "Text" },
              icon: { label: "Icon name (optional)", type: "Text" },
              badge: { label: "Badge count", type: "Number" },
              hidden: { label: "Hide this sub-page", type: "OnOff" },
              href: { label: "Link URL (enables new-tab)", type: "Text" },
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

    // ---- Notifications popover ----
    // Give an item popover:"notifications" (e.g. the bell) — clicking it opens
    // this panel instead of navigating. Bind the list below; wire the emitted
    // events (notificationClick / viewAllNotifications / markAllRead) to workflows.
    notifications: {
      label: { en: "Notifications (list, bind)" }, type: "Array", bindable: true,
      // Records: { id, title|text|message, created_at, read|is_read, avatar }
      defaultValue: [
        { id: "n1", text: "New work order assigned: JOB#4434 - 3", created_at: "2026-07-29T14:05:00+00:00", read: false, avatar: "" },
        { id: "n2", text: "Estimate approved for 2777 Mathews Street", created_at: "2026-07-29T11:20:00+00:00", read: false, avatar: "" },
        { id: "n3", text: "Vendor Check Electric confirmed scheduling", created_at: "2026-07-28T16:40:00+00:00", read: true, avatar: "" },
      ],
    },
    notifTextField: { label: { en: "Field: notification text" }, type: "Text", defaultValue: "text", bindable: true, section: "settings" },
    notifTimeField: { label: { en: "Field: notification time" }, type: "Text", defaultValue: "created_at", bindable: true, section: "settings" },
    notifReadField: { label: { en: "Field: read flag" }, type: "Text", defaultValue: "read", bindable: true, section: "settings" },
    notifAvatarField: { label: { en: "Field: avatar" }, type: "Text", defaultValue: "avatar", bindable: true, section: "settings" },
    notifTitle: { label: { en: "Popover title" }, type: "Text", defaultValue: "Notifications", bindable: true },
    showViewAll: { label: { en: "Show 'View All'" }, type: "OnOff", defaultValue: true, bindable: true },
    viewAllLabel: { label: { en: "'View All' label" }, type: "Text", defaultValue: "View All", bindable: true },
    showMarkAll: { label: { en: "Show 'Mark All as Read'" }, type: "OnOff", defaultValue: true, bindable: true },
    markAllLabel: { label: { en: "'Mark All' label" }, type: "Text", defaultValue: "Mark All as Read", bindable: true },
    notifEmptyText: { label: { en: "Empty text" }, type: "Text", defaultValue: "You're all caught up", bindable: true },

    // ---- Live badge counts (bindable) ----
    // Bind each count to a collection length, e.g.
    //   collections.user_notifications?.data?.length
    // The count is applied to the destination (or sub-page) whose id matches the
    // matching "... id" field below, and overrides that row's own badge value.
    // Leave a count empty to fall back to the row's static badge.
    notificationsBadge: {
      label: { en: "Notifications count (bind)" }, type: "Number", bindable: true, defaultValue: null,
      /* wwEditor:start */
      bindingValidation: { type: "number", tooltip: "Unread notifications, e.g. collections.user_notifications?.data?.length" },
      /* wwEditor:end */
    },
    notificationsId: { label: { en: "↳ applies to id" }, type: "Text", defaultValue: "notifications", bindable: true, section: "settings" },
    tasksBadge: {
      label: { en: "Tasks count (bind)" }, type: "Number", bindable: true, defaultValue: null,
      /* wwEditor:start */
      bindingValidation: { type: "number", tooltip: "Open tasks, e.g. collections.my_tasks?.data?.length" },
      /* wwEditor:end */
    },
    tasksId: { label: { en: "↳ applies to id" }, type: "Text", defaultValue: "tasks", bindable: true, section: "settings" },
    marginBadge: {
      label: { en: "Margin count (bind)" }, type: "Number", bindable: true, defaultValue: null,
      /* wwEditor:start */
      bindingValidation: { type: "number", tooltip: "Margin reviews, e.g. collections.margin_review?.data?.length" },
      /* wwEditor:end */
    },
    marginId: { label: { en: "↳ applies to id" }, type: "Text", defaultValue: "margin-review", bindable: true, section: "settings" },

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
