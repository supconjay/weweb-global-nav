<template>
  <div class="pp-root" :class="[themeClass, { 'pp-root--fixed': content.fixed !== false }]" :style="rootStyle">
    <!-- Backdrop + More sheet -->
    <transition name="pp-fade">
      <div v-if="sheetOpen" class="pp-sheet__backdrop" @click="closeSheet"></div>
    </transition>
    <transition name="pp-slide">
      <div v-if="sheetOpen" class="pp-sheet" role="dialog" aria-label="Navigation menu">
        <div class="pp-sheet__handle"></div>
        <div class="pp-sheet__scroll">
          <template v-for="grp in sheetGroups" :key="grp.key">
            <div v-if="grp.items.length" class="pp-sheet__group">
              <div class="pp-sheet__grouplabel">{{ grp.label }}</div>
              <div class="pp-sheet__grid">
                <component
                  :is="it.href ? 'a' : 'button'"
                  v-for="it in grp.items"
                  :key="it.id"
                  :href="it.href || undefined"
                  :type="it.href ? undefined : 'button'"
                  class="pp-sheet__item"
                  :class="{ 'pp-sheet__item--active': it.id === effectiveId }"
                  @click="onSelect(it, $event)"
                >
                  <span class="pp-sheet__ico">
                    <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic(it.icon)"></path></svg>
                    <span v-if="badgeNum(it) > 0" class="pp-badge">{{ badgeText(it) }}</span>
                  </span>
                  <span class="pp-sheet__label">{{ it.label }}</span>
                </component>
              </div>
            </div>
          </template>
          <div v-if="content.showSupport !== false || content.showSettings !== false" class="pp-sheet__foot">
            <button v-if="content.showSupport !== false" type="button" class="pp-supportbtn" @click="openSupport">
              <span class="pp-supportbtn__ico"><svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('lifebuoy')"></path></svg></span>
              <span class="pp-supportbtn__txt">
                <strong>{{ content.supportLabel || 'IT Support' }}</strong>
                <small>{{ content.supportSubLabel || 'Report a problem or request help' }}</small>
              </span>
            </button>
            <button
              v-if="content.showSettings !== false"
              type="button"
              class="pp-settingsbtn"
              :title="content.settingsLabel || 'Settings'"
              :aria-label="content.settingsLabel || 'Settings'"
              @click="openSettings"
            >
              <span class="pp-settingsbtn__ico"><svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('cog')"></path></svg></span>
              <span class="pp-settingsbtn__txt">{{ content.settingsLabel || 'Settings' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- IT support ticket form -->
    <transition name="pp-fade">
      <div v-if="supportOpen" class="pp-modal__backdrop" :class="{ 'pp-invisible': capturing }" @click="closeSupport"></div>
    </transition>
    <transition name="pp-pop">
      <div v-if="supportOpen" class="pp-modal" :class="{ 'pp-invisible': capturing }" role="dialog" aria-label="IT support">
        <div class="pp-modal__head">
          <span class="pp-modal__title">
            <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('lifebuoy')"></path></svg>
            {{ content.supportTitle || 'IT Support' }}
          </span>
          <button type="button" class="pp-modal__x" aria-label="Close" @click="closeSupport">
            <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('x')"></path></svg>
          </button>
        </div>

        <div class="pp-modal__body">
          <label class="pp-fld">
            <span class="pp-fld__label">{{ content.subjectLabel || 'Subject' }} <em>*</em></span>
            <input
              ref="supportSubject"
              v-model="supportSubject"
              type="text"
              class="pp-in"
              :class="{ 'pp-in--err': supportErr && !supportSubject.trim() }"
              :placeholder="content.subjectPlaceholder || 'Short summary of the issue'"
            />
          </label>

          <label v-if="priorityOptions.length" class="pp-fld">
            <span class="pp-fld__label">{{ content.priorityLabel || 'Priority' }}</span>
            <select v-model="supportPriority" class="pp-in">
              <option v-for="p in priorityOptions" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>

          <label class="pp-fld">
            <span class="pp-fld__label">{{ content.descLabel || 'Description' }} <em>*</em></span>
            <textarea
              v-model="supportDesc"
              class="pp-in pp-in--ta"
              rows="5"
              :class="{ 'pp-in--err': supportErr && !supportDesc.trim() }"
              :placeholder="content.descPlaceholder || 'What happened? What were you trying to do? Steps to reproduce help a lot.'"
            ></textarea>
          </label>

          <div v-if="content.allowAttachments !== false" class="pp-fld">
            <span class="pp-fld__label">{{ content.filesLabel || 'Attachments' }}</span>
            <div
              class="pp-drop"
              :class="{ 'pp-drop--over': supportDrag }"
              @dragover.prevent="supportDrag = true"
              @dragenter.prevent="supportDrag = true"
              @dragleave.prevent="supportDrag = false"
              @drop.prevent="onSupportDrop"
              @click="pickFiles"
            >
              <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('upload')"></path></svg>
              <span>{{ content.filesHint || 'Drop screenshots or files here, or click to browse' }}</span>
            </div>
            <button
              v-if="content.allowScreenshot !== false && screenshotSupported"
              type="button"
              class="pp-shot"
              :disabled="capturing"
              @click="takeScreenshot"
            >
              <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('camera')"></path></svg>
              <span>{{ capturing ? (content.capturingLabel || 'Choose what to capture...') : (content.screenshotLabel || 'Take a screenshot') }}</span>
            </button>
            <input ref="supportFile" type="file" multiple class="pp-hidden" @change="onSupportPick" />
            <ul v-if="supportFiles.length" class="pp-files">
              <li v-for="(f, i) in supportFiles" :key="i" class="pp-file">
                <span class="pp-file__ico">
                  <img v-if="f.url" :src="f.url" :alt="f.name" />
                  <svg v-else class="pp-svg" v-bind="svgAttrs"><path :d="ic(f.isImage ? 'image' : 'file')"></path></svg>
                </span>
                <span class="pp-file__name">{{ f.name }}</span>
                <span class="pp-file__size">{{ prettySize(f.size) }}</span>
                <button type="button" class="pp-file__x" aria-label="Remove" @click.stop="removeSupportFile(i)">
                  <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('x')"></path></svg>
                </button>
              </li>
            </ul>
          </div>

          <p v-if="supportErr" class="pp-err">{{ supportErr }}</p>
        </div>

        <div class="pp-modal__foot">
          <button type="button" class="pp-mbtn" @click="closeSupport">{{ content.cancelLabel || 'Cancel' }}</button>
          <button type="button" class="pp-mbtn pp-mbtn--primary" @click="submitSupport">{{ content.submitLabel || 'Submit ticket' }}</button>
        </div>
      </div>
    </transition>

    <!-- Notifications popover -->
    <transition name="pp-fade">
      <div v-if="notifOpen" class="pp-notif__backdrop" @click="closeNotif"></div>
    </transition>
    <transition name="pp-pop">
      <div v-if="notifOpen" class="pp-notif" :style="{ bottom: notifPos.bottom + 'px' }" role="dialog" aria-label="Notifications">
        <div class="pp-notif__head">
          <span class="pp-notif__title">
            {{ content.notifTitle || 'Notifications' }}
            <span v-if="unreadCount > 0" class="pp-notif__count">{{ unreadCount }}</span>
          </span>
          <button v-if="content.showViewAll !== false" type="button" class="pp-notif__viewall" @click="emitViewAll">{{ content.viewAllLabel || 'View All' }}</button>
        </div>
        <div class="pp-notif__body">
          <template v-if="notifItems.length">
            <button
              v-for="(n, i) in notifItems"
              :key="notifId(n) || i"
              type="button"
              class="pp-notif__item"
              :class="{ 'pp-notif__item--unread': !isRead(n) }"
              @click="onNotifClick(n, i)"
            >
              <span class="pp-notif__avatar">
                <img v-if="notifAvatar(n)" :src="notifAvatar(n)" :alt="notifText(n)" />
                <svg v-else class="pp-svg" v-bind="svgAttrs"><path :d="ic('bell')"></path></svg>
              </span>
              <span class="pp-notif__txt">
                <span class="pp-notif__msg">{{ notifText(n) || 'Notification' }}</span>
                <span v-if="notifTime(n)" class="pp-notif__time">{{ notifTime(n) }}</span>
              </span>
              <span v-if="!isRead(n)" class="pp-notif__dot"></span>
            </button>
          </template>
          <div v-else class="pp-notif__empty">
            <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('bell')"></path></svg>
            <span>{{ content.notifEmptyText || "You're all caught up" }}</span>
          </div>
        </div>
        <div v-if="content.showMarkAll !== false && notifItems.length" class="pp-notif__foot">
          <button type="button" class="pp-notif__markall" @click="emitMarkAll">{{ content.markAllLabel || 'Mark All as Read' }}</button>
        </div>
      </div>
    </transition>

    <div class="pp-bar__wrap">
      <!-- Collapsed handle to bring the sub-nav back -->
      <div v-if="stripAvailable && !stripOpen" class="pp-handle__row">
        <button type="button" class="pp-handle" :aria-label="content.reopenLabel || 'Show pages'" @click="stripOpen = true">
          <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('chevron-up')"></path></svg>
          <span>{{ content.reopenLabel || 'Pages' }}</span>
        </button>
      </div>

      <!-- Contextual sub-nav strip -->
      <div v-if="stripAvailable && stripOpen" class="pp-context">
        <div class="pp-context__scroll">
          <component
            :is="ch.href ? 'a' : 'button'"
            v-for="ch in contextChildren"
            :key="ch.id"
            :href="ch.href || undefined"
            :type="ch.href ? undefined : 'button'"
            class="pp-tab"
            :class="{ 'pp-tab--active': ch.id === curChild }"
            @click="onSelectChild(ch, $event)"
          >
            <svg v-if="ch.icon" class="pp-svg pp-tab__ico" v-bind="svgAttrs"><path :d="ic(ch.icon)"></path></svg>
            <span>{{ ch.label }}</span>
            <span v-if="badgeNum(ch) > 0" class="pp-badge pp-badge--inline">{{ badgeText(ch) }}</span>
          </component>
        </div>
        <button
          v-if="content.showStripClose !== false"
          type="button"
          class="pp-context__x"
          :aria-label="content.closeStripLabel || 'Hide pages'"
          :title="content.closeStripLabel || 'Hide pages'"
          @click="stripOpen = false"
        >
          <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('x')"></path></svg>
        </button>
      </div>

      <!-- Primary bottom bar -->
      <nav class="pp-bar" :aria-label="content.ariaLabel || 'Primary'">
        <component
          :is="it.href ? 'a' : 'button'"
          v-for="it in barItems"
          :key="it.id"
          :href="it.href || undefined"
          :type="it.href ? undefined : 'button'"
          class="pp-item"
          :class="{ 'pp-item--active': it.id === effectiveId }"
          @click="onSelect(it, $event)"
        >
          <span class="pp-item__ico">
            <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic(it.icon)"></path></svg>
            <span v-if="badgeNum(it) > 0" class="pp-badge">{{ badgeText(it) }}</span>
          </span>
          <span v-if="content.showLabels !== false" class="pp-item__label">{{ it.label }}</span>
        </component>

        <button
          v-if="hasMore"
          type="button"
          class="pp-item pp-item--more"
          :class="{ 'pp-item--active': sheetOpen || moreActive }"
          @click="toggleSheet"
        >
          <span class="pp-item__ico">
            <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic(sheetOpen ? 'x' : 'grid')"></path></svg>
            <span v-if="!sheetOpen && moreBadgeTotal > 0" class="pp-badge">{{ moreBadgeTotal > 99 ? '99+' : moreBadgeTotal }}</span>
          </span>
          <span v-if="content.showLabels !== false" class="pp-item__label">{{ content.moreLabel || 'More' }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script>
const ICONS = {
  home: "M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  "check-square": "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  briefcase: "M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM2 12h20",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18l3 3 6.4-6.3a4 4 0 0 0 5.3-5.4l-2.6 2.6-2.3-2.3 2.6-2.6z",
  map: "M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
  layers: "M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.9 6.4-6.4 2.9 2.9-6.4 6.4-2.9z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  x: "M18 6L6 18M6 6l12 12",
  dot: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
  lifebuoy: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M19.1 4.9l-4.2 4.2M9.1 14.9l-4.2 4.2",
  paperclip: "M21.4 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  image: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
};

export default {
  props: { content: { type: Object, required: true }, uid: { type: String, required: false } },
  emits: ["trigger-event"],
  data() {
    return {
      curId: this.initId(),
      curChild: this.content.activeChildId != null ? String(this.content.activeChildId) : null,
      sheetOpen: false,
      stripOpen: true,
      notifOpen: false,
      notifPos: { bottom: 80 },
      // ---- IT support ticket ----
      supportOpen: false,
      supportSubject: "",
      supportPriority: "",
      supportDesc: "",
      supportFiles: [],
      supportDrag: false,
      supportErr: "",
      capturing: false,
      screenshotSupported: false,
    };
  },
  mounted() {
    // Screen Capture API: desktop browsers over HTTPS only (no mobile support),
    // so the button is hidden unless it's actually available.
    try {
      this.screenshotSupported = !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    } catch (e) { this.screenshotSupported = false; }
    try {
      this._onDocDown = (e) => {
        if (!this.stripOpen || this.content.closeStripOnOutside === false) return;
        const root = this.$el;
        if (root && root.contains && e && e.target && root.contains(e.target)) return;
        this.stripOpen = false;
      };
      document.addEventListener("pointerdown", this._onDocDown, true);
    } catch (e) {}
  },
  beforeUnmount() {
    try { if (this._onDocDown) document.removeEventListener("pointerdown", this._onDocDown, true); } catch (e) {}
  },
  watch: {
    // Landing on a different destination reveals its sub-pages again.
    effectiveId() { this.stripOpen = true; },
    "content.activeId"(v) { if (v != null && v !== "") this.curId = String(v); },
    "content.activeChildId"(v) { this.curChild = v != null && v !== "" ? String(v) : null; },
  },
  computed: {
    items() {
      const raw = Array.isArray(this.content.items) ? this.content.items : [];
      return raw
        .filter((i) => i && i.id != null && i.id !== "" && !this.truthy(i.hidden))
        .map((i) => ({
          id: String(i.id),
          label: i.label != null && i.label !== "" ? i.label : String(i.id),
          icon: i.icon || "dot",
          kind: i.kind === "hub" ? "hub" : "portal",
          inBar: i.inBar === true,
          badge: i.badge,
          href: i.href || null,
          popover: i.popover || null,
          children: Array.isArray(i.children)
            ? i.children.filter((c) => c && c.id != null && c.id !== "" && !this.truthy(c.hidden)).map((c) => ({ id: String(c.id), label: c.label != null && c.label !== "" ? c.label : String(c.id), icon: c.icon || null, badge: c.badge, href: c.href || null }))
            : [],
        }));
    },
    maxBar() { const n = Number(this.content.maxBarItems); return n >= 2 ? Math.floor(n) : 5; },
    barPrimary() { return this.items.filter((i) => i.inBar); },
    hasMore() { return this.moreList.length > 0; },
    barItems() {
      const prim = this.barPrimary;
      if (prim.length > this.maxBar) return prim.slice(0, this.maxBar - 1);
      // reserve a slot for More if there are non-bar items
      const overflow = this.items.some((i) => !i.inBar);
      return overflow ? prim.slice(0, this.maxBar - 1) : prim.slice(0, this.maxBar);
    },
    moreList() {
      const shown = {};
      this.barItems.forEach((i) => { shown[i.id] = true; });
      return this.items.filter((i) => !shown[i.id]);
    },
    sheetGroups() {
      const hubs = this.moreList.filter((i) => i.kind === "hub");
      const portals = this.moreList.filter((i) => i.kind === "portal");
      return [
        { key: "hub", label: this.content.hubsLabel || "Quick access", items: hubs },
        { key: "portal", label: this.content.portalsLabel || "Portals", items: portals },
      ];
    },
    moreActive() { return this.moreList.some((i) => i.id === this.effectiveId); },
    moreBadgeTotal() { return this.moreList.reduce((s, i) => s + (this.badgeNum(i) || 0), 0); },
    priorityOptions() { return this.csv(this.content.priorities, ["Low", "Normal", "High", "Urgent"]); },
    notifItems() {
      const raw = this.content.notifications;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
      return [];
    },
    unreadCount() { return this.notifItems.filter((n) => !this.isRead(n)).length; },
    // The parent of the active sub-page, looked up in `subPages`. This lets you
    // bind ONLY activeChildId (e.g. to the current page id) and still get the
    // right destination highlighted + the right sub-nav shown.
    derivedParentId() {
      if (!this.curChild) return null;
      const flat = Array.isArray(this.content.subPages) ? this.content.subPages : [];
      const row = flat.find((s) => s && s.id != null && String(s.id) === String(this.curChild));
      return row && row.parent != null && row.parent !== "" ? String(row.parent) : null;
    },
    // Priority: an explicitly bound activeId, else the derived parent, else the
    // last clicked destination (optimistic).
    effectiveId() {
      const bound = this.content.activeId;
      if (bound != null && bound !== "") return String(bound);
      return this.derivedParentId || this.curId;
    },
    stripAvailable() { return this.content.showContextual !== false && this.contextChildren.length > 0; },
    activeItem() { return this.items.find((i) => i.id === this.effectiveId) || null; },
    // Sub-pages come from a flat top-level `subPages` array (each row carries a
    // `parent` id) — this keeps the WeWeb config one level deep. Falls back to a
    // nested `children` array on the item if you prefer that shape.
    contextChildren() {
      const flat = Array.isArray(this.content.subPages) ? this.content.subPages : [];
      const mine = flat
        .filter((s) => s && s.id != null && s.id !== "" && !this.truthy(s.hidden) && String(s.parent) === String(this.effectiveId))
        .map((s) => ({ id: String(s.id), label: s.label != null && s.label !== "" ? s.label : String(s.id), icon: s.icon || null, badge: s.badge, href: s.href || null }));
      if (mine.length) return mine;
      return this.activeItem ? this.activeItem.children : [];
    },
    svgAttrs() {
      return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" };
    },
    themeClass() {
      const m = this.content.darkMode || "auto";
      return { "pp-auto": m === "auto", "pp-dark": m === "dark", "pp-light": m === "light" };
    },
    rootStyle() {
      return {
        "--pp-primary": this.content.primaryColor || "#10b981",
        "--pp-accent": this.content.accentColor || "#6366f1",
        "--pp-max": (this.content.maxWidth != null && this.content.maxWidth !== "" ? this.content.maxWidth : 640) + "px",
      };
    },
  },
  methods: {
    ic(name) { return ICONS[name] || ICONS.dot; },
    truthy(v) { return v === true || v === 1 || v === "1" || /^(true|yes|on)$/i.test(String(v == null ? "" : v)); },
    initId() {
      if (this.content && this.content.activeId != null && this.content.activeId !== "") return String(this.content.activeId);
      const first = (Array.isArray(this.content && this.content.items) ? this.content.items : []).find((i) => i && i.id != null && i.id !== "");
      return first ? String(first.id) : "";
    },
    badgeNum(it) {
      const b = it && it.badge;
      if (b == null || b === "" || b === false) return 0;
      const n = Number(b);
      return isFinite(n) ? n : (b ? 1 : 0);
    },
    badgeText(it) { const n = this.badgeNum(it); return n > 99 ? "99+" : String(n); },
    // Let the browser handle new-tab / new-window gestures (ctrl/cmd/shift/alt +
    // click, or middle-click) natively when the item is a real <a href>.
    isModifiedClick(e) {
      return !!e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (typeof e.button === "number" && e.button !== 0));
    },
    onSelect(it, e) {
      if (it && it.popover === "notifications") {
        // ctrl/cmd/middle-click still opens the hub in a new tab if an href is set
        if (it.href && this.isModifiedClick(e)) return;
        if (e) e.preventDefault();
        this.toggleNotif(e);
        return;
      }
      if (it && it.href && this.isModifiedClick(e)) return; // native open-in-new-tab
      if (it && it.href && e) e.preventDefault();
      this.select(it);
    },
    onSelectChild(ch, e) {
      if (ch && ch.href && this.isModifiedClick(e)) return;
      if (ch && ch.href && e) e.preventDefault();
      this.selectChild(ch);
    },
    select(it) {
      if (!it) return;
      this.curId = it.id;
      this.curChild = null;
      this.sheetOpen = false;
      this.$emit("trigger-event", { name: "navigate", event: { id: it.id, kind: it.kind, label: it.label, item: it } });
    },
    selectChild(ch) {
      if (!ch) return;
      this.curChild = ch.id;
      this.$emit("trigger-event", { name: "navigateChild", event: { parentId: this.effectiveId, id: ch.id, label: ch.label, child: ch } });
    },
    toggleSheet() { this.sheetOpen = !this.sheetOpen; this.notifOpen = false; },
    closeSheet() { this.sheetOpen = false; },
    // ---- notifications popover ----
    str(v) { return v == null ? "" : String(v); },
    field(n, key, fbs) {
      if (!n) return "";
      if (key && n[key] != null && n[key] !== "") return n[key];
      for (let i = 0; i < (fbs || []).length; i++) { if (n[fbs[i]] != null && n[fbs[i]] !== "") return n[fbs[i]]; }
      return "";
    },
    notifText(n) { return this.str(this.field(n, this.content.notifTextField, ["title", "text", "message", "body", "description"])); },
    notifTime(n) {
      const raw = this.field(n, this.content.notifTimeField, ["time", "created_at", "createdAt", "date"]);
      if (!raw) return "";
      const d = new Date(raw);
      if (isNaN(d)) return String(raw);
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    },
    isRead(n) {
      const v = this.field(n, this.content.notifReadField, ["read", "is_read", "readAt", "seen"]);
      return v === true || v === 1 || v === "1" || /^(true|yes)$/i.test(String(v == null ? "" : v));
    },
    notifAvatar(n) { return this.str(this.field(n, this.content.notifAvatarField, ["avatar", "headshot", "image", "photo"])); },
    notifId(n) { return this.field(n, "id", ["_id", "uuid", "key"]) || ""; },
    toggleNotif(e) {
      this.sheetOpen = false;
      if (this.notifOpen) { this.notifOpen = false; return; }
      const btn = e && e.currentTarget;
      if (btn && btn.getBoundingClientRect) {
        const rect = btn.getBoundingClientRect();
        const vh = (typeof window !== "undefined" && window.innerHeight) || rect.top;
        this.notifPos = { bottom: Math.round(vh - rect.top + 10) };
      }
      this.notifOpen = true;
    },
    closeNotif() { this.notifOpen = false; },
    onNotifClick(n, i) {
      this.notifOpen = false;
      this.$emit("trigger-event", { name: "notificationClick", event: { id: this.notifId(n), index: i, notification: n } });
    },
    // ---- IT support ticket ----
    csv(raw, fallback) {
      const arr = Array.isArray(raw)
        ? raw
        : (typeof raw === "string" && raw.trim() ? raw.split(",") : null);
      if (!arr) return fallback;
      const out = arr.map((s) => String(s).trim()).filter(Boolean);
      return out.length ? out : fallback;
    },
    // Routes through the same `navigate` workflow as every other destination.
    openSettings() {
      this.sheetOpen = false;
      const id = this.content.settingsId != null && this.content.settingsId !== "" ? String(this.content.settingsId) : "settings";
      const label = this.content.settingsLabel || "Settings";
      this.curId = id;
      this.curChild = null;
      this.$emit("trigger-event", { name: "navigate", event: { id, kind: "hub", label, item: { id, label, icon: "cog", kind: "hub" } } });
    },
    openSupport() {
      this.sheetOpen = false;
      this.notifOpen = false;
      this.supportErr = "";
      if (!this.supportPriority) this.supportPriority = this.priorityOptions[1] || this.priorityOptions[0] || "";
      this.supportOpen = true;
      this.$nextTick(() => { const el = this.$refs.supportSubject; if (el && el.focus) el.focus(); });
    },
    closeSupport() { this.supportOpen = false; this.supportDrag = false; },
    resetSupport() {
      this.supportSubject = "";
      this.supportDesc = "";
      this.supportErr = "";
      this.supportFiles.forEach((f) => { if (f.url) { try { URL.revokeObjectURL(f.url); } catch (e) {} } });
      this.supportFiles = [];
      this.supportDrag = false;
    },
    pickFiles() { const el = this.$refs.supportFile; if (el && el.click) el.click(); },
    onSupportPick(e) {
      this.addSupportFiles(e && e.target ? e.target.files : null);
      if (e && e.target) e.target.value = "";
    },
    onSupportDrop(e) {
      this.supportDrag = false;
      this.addSupportFiles(e && e.dataTransfer ? e.dataTransfer.files : null);
    },
    addSupportFiles(fileList) {
      const files = Array.from(fileList || []);
      const max = Number(this.content.maxFiles) > 0 ? Math.floor(Number(this.content.maxFiles)) : 10;
      files.forEach((file) => {
        if (this.supportFiles.length >= max) return;
        const isImage = (file.type || "").indexOf("image/") === 0;
        this.supportFiles.push({
          file, name: file.name, size: file.size, type: file.type, isImage,
          url: isImage ? URL.createObjectURL(file) : "",
        });
      });
    },
    // Capture a frame of a screen/window/tab the user picks, then attach it as a
    // PNG. The form is hidden while the picker is open so the shot shows the app
    // underneath rather than this dialog.
    takeScreenshot() {
      if (this.capturing) return;
      const nav = typeof navigator !== "undefined" ? navigator : null;
      const doc = typeof document !== "undefined" ? document : null;
      if (!nav || !nav.mediaDevices || !nav.mediaDevices.getDisplayMedia || !doc) {
        this.supportErr = this.content.screenshotUnsupported || "Screen capture isn't available in this browser.";
        return;
      }
      this.supportErr = "";
      this.capturing = true;
      let stream = null;
      const cleanup = () => {
        if (stream) { try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {} }
        this.capturing = false;
      };
      this.$nextTick(() => {
        nav.mediaDevices.getDisplayMedia({ video: true, audio: false })
          .then((s) => {
            stream = s;
            const video = doc.createElement("video");
            video.srcObject = stream;
            video.muted = true;
            return video.play().then(() => new Promise((resolve) => setTimeout(() => resolve(video), 180)));
          })
          .then((video) => {
            const canvas = doc.createElement("canvas");
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
            return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
          })
          .then((blob) => {
            cleanup();
            if (!blob) return;
            const name = "screenshot-" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + ".png";
            let file;
            try { file = new File([blob], name, { type: "image/png" }); }
            catch (e) { file = blob; file.name = name; }
            const max = Number(this.content.maxFiles) > 0 ? Math.floor(Number(this.content.maxFiles)) : 10;
            if (this.supportFiles.length >= max) return;
            this.supportFiles.push({
              file, name, size: blob.size, type: "image/png", isImage: true,
              url: URL.createObjectURL(blob),
            });
          })
          .catch(() => {
            // User dismissed the picker, or permission denied — just restore.
            cleanup();
          });
      });
    },
    removeSupportFile(i) {
      const f = this.supportFiles[i];
      if (f && f.url) { try { URL.revokeObjectURL(f.url); } catch (e) {} }
      this.supportFiles.splice(i, 1);
    },
    prettySize(bytes) {
      const n = Number(bytes);
      if (!isFinite(n) || n <= 0) return "";
      if (n < 1024) return n + " B";
      if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
      return (n / (1024 * 1024)).toFixed(1) + " MB";
    },
    submitSupport() {
      const subject = String(this.supportSubject || "").trim();
      const description = String(this.supportDesc || "").trim();
      if (!subject || !description) {
        this.supportErr = this.content.requiredError || "Please add a subject and a description.";
        return;
      }
      this.supportErr = "";
      let pageUrl = "";
      try { pageUrl = (typeof window !== "undefined" && window.location) ? window.location.href : ""; } catch (e) {}
      this.$emit("trigger-event", {
        name: "supportSubmit",
        event: {
          subject,
          description,
          priority: this.supportPriority || "",
          // Context that saves IT a round-trip
          pageUrl,
          activeId: this.effectiveId || "",
          activeChildId: this.curChild || "",
          files: this.supportFiles.map((f) => f.file),
          attachments: this.supportFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        },
      });
      this.supportOpen = false;
      this.resetSupport();
    },
    emitViewAll() { this.notifOpen = false; this.$emit("trigger-event", { name: "viewAllNotifications", event: {} }); },
    emitMarkAll() { this.$emit("trigger-event", { name: "markAllRead", event: {} }); },
  },
};
</script>

<style lang="scss" scoped>
.pp-root {
  --surface: #ffffff; --surface-2: #f7f9fc; --surface-3: #eef2f7; --border: #e4e9f0; --border-strong: #d4dbe6;
  --text: #1f2a37; --text-muted: #64748b; --text-subtle: #94a3b8;
  --shadow-up: 0 -2px 4px rgba(16, 24, 40, 0.04), 0 -10px 30px rgba(16, 24, 40, 0.08);
  --danger: #ef4444; --accent: var(--pp-accent, #6366f1); --primary: var(--pp-primary, #10b981);
  box-sizing: border-box; width: 100%; color: var(--text);
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased; font-size: 14px;
}
.pp-root *, .pp-root *::before, .pp-root *::after { box-sizing: border-box; }
@mixin dark {
  --surface: #161f30; --surface-2: #1b2638; --surface-3: #202c40; --border: #28344a; --border-strong: #34425c;
  --text: #e8eef7; --text-muted: #94a3b8; --text-subtle: #64748b;
  --shadow-up: 0 -2px 4px rgba(0,0,0,.3), 0 -12px 30px rgba(0,0,0,.4);
}
.pp-root.pp-dark { @include dark; }
@media (prefers-color-scheme: dark) { .pp-root.pp-auto { @include dark; } }

.pp-root--fixed { position: fixed; left: 0; right: 0; bottom: 0; z-index: 900; }

.pp-bar__wrap { max-width: var(--pp-max); margin: 0 auto; }

/* Contextual sub-nav strip */
.pp-context { background: var(--surface-2); border-top: 1px solid var(--border); display: flex; align-items: center; }
.pp-context__scroll { flex: 1; min-width: 0; display: flex; gap: 6px; padding: 8px 12px; overflow-x: auto; scrollbar-width: none; }
.pp-context__x { flex: none; display: grid; place-items: center; width: 30px; height: 30px; margin-right: 10px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--text-subtle); cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
.pp-context__x:hover { background: var(--surface-3); color: var(--text); border-color: var(--border-strong); }
.pp-context__x .pp-svg { width: 14px; height: 14px; }

/* Collapsed handle */
.pp-handle__row { display: flex; justify-content: center; padding: 0 12px 6px; }
.pp-handle { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--text-muted); font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: var(--shadow-up); transition: color .15s, border-color .15s; }
.pp-handle:hover { color: var(--primary); border-color: var(--primary); }
.pp-handle .pp-svg { width: 14px; height: 14px; }
.pp-context__scroll::-webkit-scrollbar { display: none; }
.pp-tab { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s, color .15s, border-color .15s; }
.pp-tab:hover { color: var(--text); border-color: var(--border-strong); }
.pp-tab__ico { width: 15px; height: 15px; }
.pp-tab--active { background: color-mix(in srgb, var(--primary) 14%, transparent); color: var(--primary); border-color: transparent; }

/* Primary bottom bar */
.pp-bar { display: flex; align-items: stretch; justify-content: space-around; gap: 2px; background: var(--surface); border-top: 1px solid var(--border); box-shadow: var(--shadow-up); padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px)); }
.pp-item { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 6px 4px; border: none; background: transparent; color: var(--text-muted); font-family: inherit; cursor: pointer; border-radius: 12px; transition: color .15s, background .15s; }
.pp-item:hover { color: var(--text); background: var(--surface-2); }
.pp-item__ico { position: relative; display: grid; place-items: center; width: 26px; height: 26px; }
.pp-item__ico .pp-svg { width: 23px; height: 23px; }
.pp-item__label { font-size: 11px; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-item--active { color: var(--primary); }
.pp-item--active .pp-item__ico::after { content: ""; position: absolute; inset: -5px -8px; border-radius: 10px; background: color-mix(in srgb, var(--primary) 14%, transparent); z-index: -1; }

.pp-badge { position: absolute; top: -5px; right: -7px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; display: grid; place-items: center; line-height: 1; border: 2px solid var(--surface); }
.pp-badge--inline { position: static; border: none; margin-left: 2px; }

/* More sheet */
.pp-sheet__backdrop { position: fixed; inset: 0; background: rgba(16,24,40,.42); z-index: 950; }
.pp-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 951; background: var(--surface); border-top-left-radius: 20px; border-top-right-radius: 20px; box-shadow: var(--shadow-up); padding: 10px 16px calc(18px + env(safe-area-inset-bottom, 0px)); max-height: 78vh; overflow: hidden; }
.pp-sheet__handle { width: 40px; height: 4px; border-radius: 999px; background: var(--border-strong); margin: 4px auto 12px; }
.pp-sheet__scroll { overflow-y: auto; max-height: calc(78vh - 40px); }
.pp-sheet__group { margin-bottom: 14px; }
.pp-sheet__grouplabel { font-size: 11.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--text-subtle); margin: 4px 4px 10px; }
.pp-sheet__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
.pp-sheet__item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 8px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font-family: inherit; cursor: pointer; transition: border-color .15s, background .15s, transform .1s; }
.pp-sheet__item:hover { border-color: var(--border-strong); }
.pp-sheet__item:active { transform: scale(.97); }
.pp-sheet__item--active { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); }
.pp-sheet__ico { position: relative; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--surface-3); color: var(--text-muted); }
.pp-sheet__item--active .pp-sheet__ico { background: color-mix(in srgb, var(--primary) 18%, transparent); color: var(--primary); }
.pp-sheet__ico .pp-svg { width: 22px; height: 22px; }
.pp-sheet__label { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.25; }

.pp-svg { display: block; }
.pp-root a { text-decoration: none; color: inherit; }

/* Support + settings row at the bottom of the More sheet */
.pp-sheet__foot { display: flex; align-items: stretch; gap: 8px; margin-top: 2px; }
.pp-settingsbtn { flex: none; width: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 10px 8px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-2); color: var(--text); font-family: inherit; cursor: pointer; transition: border-color .15s, background .15s; }
.pp-settingsbtn:hover { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 7%, transparent); }
.pp-settingsbtn__ico { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: var(--surface-3); color: var(--text-muted); }
.pp-settingsbtn:hover .pp-settingsbtn__ico { color: var(--primary); }
.pp-settingsbtn__ico .pp-svg { width: 20px; height: 20px; }
.pp-settingsbtn__txt { font-size: 12px; font-weight: 600; }
.pp-supportbtn { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-2); color: var(--text); font-family: inherit; text-align: left; cursor: pointer; transition: border-color .15s, background .15s; }
.pp-supportbtn:hover { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 7%, transparent); }
.pp-supportbtn__ico { flex: none; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
.pp-supportbtn__ico .pp-svg { width: 20px; height: 20px; }
.pp-supportbtn__txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.pp-supportbtn__txt strong { font-size: 13.5px; font-weight: 700; }
.pp-supportbtn__txt small { font-size: 12px; color: var(--text-muted); }

/* Support modal */
.pp-modal__backdrop { position: fixed; inset: 0; z-index: 960; background: rgba(16, 24, 40, .5); }
.pp-modal {
  position: fixed; z-index: 961; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(520px, calc(100vw - 24px)); max-height: min(86vh, 720px); display: flex; flex-direction: column;
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: 18px;
  box-shadow: 0 20px 60px rgba(16, 24, 40, .3); overflow: hidden;
}
.pp-modal__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
.pp-modal__title { display: inline-flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 700; color: var(--text); }
.pp-modal__title .pp-svg { width: 19px; height: 19px; color: var(--accent); }
.pp-modal__x { display: grid; place-items: center; width: 32px; height: 32px; border: none; border-radius: 9px; background: transparent; color: var(--text-muted); cursor: pointer; transition: background .15s, color .15s; }
.pp-modal__x:hover { background: var(--surface-3); color: var(--text); }
.pp-modal__x .pp-svg { width: 17px; height: 17px; }
.pp-modal__body { padding: 16px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.pp-modal__foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 18px; border-top: 1px solid var(--border); background: var(--surface); }

.pp-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
.pp-fld__row { display: flex; gap: 12px; flex-wrap: wrap; }
.pp-fld__label { font-size: 12.5px; font-weight: 600; color: var(--text-muted); }
.pp-fld__label em { color: var(--danger); font-style: normal; }
.pp-in { width: 100%; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text); font-family: inherit; font-size: 14px; outline: none; transition: border-color .15s, box-shadow .15s; }
.pp-in:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); }
.pp-in--ta { resize: vertical; min-height: 104px; line-height: 1.5; }
.pp-in--err { border-color: var(--danger); }
select.pp-in { appearance: none; cursor: pointer; }

.pp-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 20px 14px; border: 1.5px dashed var(--border-strong); border-radius: 12px; background: var(--surface-2); color: var(--text-muted); font-size: 13px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s, color .15s; }
.pp-drop:hover, .pp-drop--over { border-color: var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, transparent); }
.pp-drop .pp-svg { width: 20px; height: 20px; }
.pp-hidden { display: none; }
.pp-invisible { opacity: 0 !important; pointer-events: none !important; }
.pp-shot { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; padding: 10px 14px; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text-muted); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: border-color .15s, color .15s, background .15s; }
.pp-shot:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, transparent); }
.pp-shot:disabled { opacity: .6; cursor: default; }
.pp-shot .pp-svg { width: 16px; height: 16px; }
.pp-file__ico img { width: 100%; height: 100%; object-fit: cover; border-radius: 7px; }
.pp-file__ico { overflow: hidden; }
.pp-files { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.pp-file { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-2); }
.pp-file__ico { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 7px; background: var(--surface-3); color: var(--text-muted); }
.pp-file__ico .pp-svg { width: 14px; height: 14px; }
.pp-file__name { flex: 1; min-width: 0; font-size: 13px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-file__size { flex: none; font-size: 11.5px; color: var(--text-subtle); }
.pp-file__x { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border: none; border-radius: 6px; background: transparent; color: var(--text-subtle); cursor: pointer; }
.pp-file__x:hover { background: var(--surface-3); color: var(--danger); }
.pp-file__x .pp-svg { width: 13px; height: 13px; }
.pp-err { margin: 0; color: var(--danger); font-size: 13px; font-weight: 500; }

.pp-mbtn { padding: 10px 16px; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text-muted); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s, filter .15s; }
.pp-mbtn:hover { background: var(--surface-3); color: var(--text); }
.pp-mbtn--primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.pp-mbtn--primary:hover { background: var(--primary); color: #fff; filter: brightness(1.05); }

/* Mobile: 16px inputs so iOS doesn't zoom on focus */
@media (max-width: 560px) {
  .pp-in { font-size: 16px; }
  .pp-fld__row { flex-direction: column; gap: 14px; }
}

/* Notifications popover */
.pp-notif__backdrop { position: fixed; inset: 0; z-index: 950; }
.pp-notif {
  position: fixed; z-index: 951; left: 50%; transform: translateX(-50%);
  width: min(400px, calc(100vw - 20px)); max-height: 62vh; display: flex; flex-direction: column;
  background: var(--surface); border: 1px solid var(--border-strong); border-radius: 16px;
  box-shadow: 0 14px 44px rgba(16, 24, 40, .24); overflow: hidden;
}
.pp-notif__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.pp-notif__title { font-size: 15px; font-weight: 700; color: var(--text); display: inline-flex; align-items: center; gap: 8px; }
.pp-notif__count { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 11px; font-weight: 700; }
.pp-notif__viewall { padding: 6px 12px; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface); color: var(--text-muted); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s; }
.pp-notif__viewall:hover { background: var(--surface-3); color: var(--text); }
.pp-notif__body { overflow-y: auto; padding: 6px; }
.pp-notif__item { width: 100%; display: flex; align-items: flex-start; gap: 11px; padding: 11px 10px; border: none; background: transparent; border-radius: 10px; cursor: pointer; text-align: left; font-family: inherit; transition: background .12s; }
.pp-notif__item:hover { background: var(--surface-2); }
.pp-notif__item--unread { background: color-mix(in srgb, var(--primary) 7%, transparent); }
.pp-notif__avatar { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); }
.pp-notif__avatar img { width: 100%; height: 100%; object-fit: cover; }
.pp-notif__avatar .pp-svg { width: 17px; height: 17px; }
.pp-notif__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pp-notif__msg { font-size: 13.5px; color: var(--text); overflow-wrap: anywhere; }
.pp-notif__time { font-size: 12px; color: var(--text-subtle); }
.pp-notif__dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-top: 6px; }
.pp-notif__empty { display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 34px 16px; color: var(--text-subtle); }
.pp-notif__empty .pp-svg { width: 26px; height: 26px; }
.pp-notif__foot { padding: 12px 16px; border-top: 1px solid var(--border); }
.pp-notif__markall { width: 100%; padding: 10px; border: none; border-radius: 10px; background: var(--primary); color: #fff; font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: filter .15s; }
.pp-notif__markall:hover { filter: brightness(1.05); }
.pp-pop-enter-active, .pp-pop-leave-active { transition: opacity .18s, transform .18s; }
.pp-pop-enter-from, .pp-pop-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

.pp-fade-enter-active, .pp-fade-leave-active { transition: opacity .2s; }
.pp-fade-enter-from, .pp-fade-leave-to { opacity: 0; }
.pp-slide-enter-active, .pp-slide-leave-active { transition: transform .24s cubic-bezier(.22,.61,.36,1); }
.pp-slide-enter-from, .pp-slide-leave-to { transform: translateY(100%); }

/* Desktop: a clean floating, centered, rounded bar instead of a full-width band */
@media (min-width: 840px) {
  .pp-root--fixed .pp-bar__wrap {
    margin: 0 auto 16px; border: 1px solid var(--border); border-radius: 18px;
    overflow: hidden; background: var(--surface);
    box-shadow: 0 10px 34px rgba(16, 24, 40, .14), 0 2px 6px rgba(16, 24, 40, .06);
  }
  .pp-root--fixed.pp-dark .pp-bar__wrap { box-shadow: 0 12px 34px rgba(0,0,0,.5); }
  .pp-root--fixed .pp-context { background: transparent; border-top: none; border-bottom: 1px solid var(--border); }
  .pp-root--fixed .pp-bar { border-top: none; box-shadow: none; background: transparent; padding: 8px 10px; }
  .pp-item { flex: 0 1 128px; }
  .pp-item:hover { background: var(--surface-2); }
  .pp-item__ico .pp-svg { width: 22px; height: 22px; }
  .pp-item__label { font-size: 12px; }
}
</style>
