/* Compact "find a service" box
   Filters the service cards as you type; Enter opens the first match,
   Esc clears. Only searches this dashboard's services (no internet search).
   Quick Launch (type anywhere) is also enabled in settings.yaml. */
(function () {
    function norm(t) {
        return (t || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }
    function services() {
        return Array.prototype.slice.call(
            document.querySelectorAll("#services li.service"),
        );
    }
    function apply(q) {
        q = norm(q).trim();
        services().forEach(function (li) {
            var hay = norm(
                li.getAttribute("data-name") +
                    " " +
                    ((li.querySelector(".service-description") || {})
                        .textContent || ""),
            );
            li.style.display = !q || hay.indexOf(q) !== -1 ? "" : "none";
        });
        document
            .querySelectorAll("#services .services-group")
            .forEach(function (g) {
                var any = Array.prototype.some.call(
                    g.querySelectorAll("li.service"),
                    function (li) {
                        return li.style.display !== "none";
                    },
                );
                g.style.display = any ? "" : "none";
            });
    }
    function firstHref() {
        var li = services().filter(function (l) {
            return l.style.display !== "none";
        })[0];
        var a = li && li.querySelector("a[href]");
        return a ? a.href : null;
    }
    function build() {
        var box = document.createElement("div");
        box.id = "lh-search";
        box.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
            '<input type="search" placeholder="Search services…" aria-label="Search services" autocomplete="off" spellcheck="false">';
        var input = box.querySelector("input");
        input.addEventListener("input", function () {
            apply(input.value);
        });
        input.addEventListener("keydown", function (e) {
            e.stopPropagation(); /* don't trigger Quick Launch while typing here */
            if (e.key === "Enter") {
                var h = firstHref();
                if (h) window.open(h, "_blank", "noopener");
            }
            if (e.key === "Escape") {
                input.value = "";
                apply("");
                input.blur();
            }
        });
        return box;
    }
    function mount() {
        /* sits in the right side of the top bar, before the date */
        var host = document.getElementById("information-widgets-right");
        if (!host) return;
        var box = document.getElementById("lh-search");
        if (box && box.parentElement === host && host.firstChild === box)
            return;
        host.insertBefore(box || build(), host.firstChild);
    }
    /* Homepage is a React app: (re)mount if the header is re-rendered */
    var t = setInterval(mount, 1000);
    mount();
    setTimeout(function () {
        clearInterval(t);
        setInterval(mount, 5000);
    }, 15000);
})();

/* UniFi uptime: whole days, rounded up (e.g. 16.5 Days -> 17 Days) */
(function () {
    var re = /^(\d+[.,]\d+)(\s+\S+)$/;
    function fix() {
        document
            .querySelectorAll('[data-name="UniFi Gateway"] div')
            .forEach(function (el) {
                if (el.children.length) return;
                var m = el.textContent.trim().match(re);
                if (m && /day|dia/i.test(m[2]))
                    el.textContent =
                        Math.ceil(parseFloat(m[1].replace(",", "."))) + m[2];
            });
    }
    new MutationObserver(fix).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
    });
    fix();
})();

/* Speedtest card: full-width HA-style bars (scale 1000 Mbit/s), small text above,
   ping with 1 decimal, last-test time as a tiny footer. Source tiles are hidden. */
(function () {
    var MAX = 1000;
    function mbps(t) {
        var m = t.replace(",", ".").match(/([\d.]+)\s*([GMK])?bit/i);
        if (!m) return null;
        var v = parseFloat(m[1]),
            u = (m[2] || "M").toUpperCase();
        return u === "G" ? v * 1000 : u === "K" ? v / 1000 : v;
    }
    function esc(s) {
        return s.replace(/[&<>]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
        });
    }
    function fix() {
        var card = document.querySelector('[data-name="Speedtest"]');
        if (!card) return;
        var blocks = card.querySelectorAll(".service-block");
        if (!blocks.length) return;
        var d = {},
            parents = [];
        blocks.forEach(function (b) {
            var l = b.querySelector(".service-block-label"),
                v = b.querySelector(".service-block-value");
            if (l && v)
                d[l.textContent.trim().toLowerCase()] = v.textContent.trim();
            var p = b.parentElement;
            if (parents.indexOf(p) < 0) parents.push(p);
        });
        parents.forEach(function (p) {
            if (!p.classList.contains("lh-hide")) p.classList.add("lh-hide");
        });
        var dl = d["download"] || "",
            ul = d["upload"] || "",
            pg = d["ping"] || "",
            last = "";
        Object.keys(d).forEach(function (k) {
            if (/teste|test/.test(k)) last = d[k];
        });
        var pm = pg.replace(",", ".").match(/([\d.]+)\s*(\S+)?/);
        var ping = pm
            ? parseFloat(pm[1]).toFixed(1).replace(".", ",") +
              " " +
              (pm[2] || "ms")
            : pg;
        function row(name, val, cls) {
            var v = mbps(val),
                pct =
                    v == null
                        ? 0
                        : Math.max(1.5, Math.min(100, (v / MAX) * 100));
            return (
                '<div class="lh-sp-row"><div class="lh-sp-txt"><span>' +
                name +
                "</span><span>" +
                esc(val) +
                "</span></div>" +
                '<div class="lh-sp-bar ' +
                cls +
                '"><i style="width:' +
                pct.toFixed(1) +
                '%"></i></div></div>'
            );
        }
        var html =
            row("Download", dl, "dl") +
            row("Upload", ul, "ul") +
            '<div class="lh-sp-txt lh-sp-ping"><span>Ping</span><span>' +
            esc(ping) +
            "</span></div>" +
            (last
                ? '<div class="lh-sp-foot">Last test · ' + esc(last) + "</div>"
                : "");
        var host = parents[parents.length - 1];
        var panel = card.querySelector(".lh-sp");
        if (!panel) {
            panel = document.createElement("div");
            panel.className = "lh-sp";
            host.parentElement.insertBefore(panel, host.nextSibling);
        }
        if (panel.innerHTML !== html) panel.innerHTML = html;
    }
    new MutationObserver(fix).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
    });
    fix();
})();

/* NAS card: same pattern as Speedtest - one full-width usage bar, small text above, tiny footer */
(function () {
    function esc(s) {
        return s.replace(/[&<>]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
        });
    }
    function fix() {
        var card = document.querySelector('[data-name="NAS"]');
        if (!card) return;
        var blocks = card.querySelectorAll(".service-block");
        if (!blocks.length) return;
        var d = {},
            parents = [];
        blocks.forEach(function (b) {
            var l = b.querySelector(".service-block-label"),
                v = b.querySelector(".service-block-value");
            if (l && v)
                d[l.textContent.trim().toLowerCase()] = v.textContent.trim();
            var p = b.parentElement;
            if (parents.indexOf(p) < 0) parents.push(p);
        });
        /* widget labels may be English or Portuguese */
        var used = d["used"] || d["usado"] || "",
            free = d["free"] || d["livre"] || "",
            total = d["total"] || "",
            uso = d["usage"] || d["uso"] || "";
        var pm = uso.replace(",", ".").match(/([\d.]+)/),
            pct = pm ? parseFloat(pm[1]) : 0;
        var html =
            '<div class="lh-sp-row"><div class="lh-sp-txt"><span>Used</span><span>' +
            esc(used) +
            " of " +
            esc(total) +
            "</span></div>" +
            '<div class="lh-sp-bar"><i style="width:' +
            Math.max(1.5, Math.min(100, pct)).toFixed(1) +
            '%"></i></div></div>' +
            '<div class="lh-sp-txt"><span>Free</span><span>' +
            esc(free) +
            "</span></div>" +
            '<div class="lh-sp-foot">' +
            esc(uso) +
            " used</div>";
        var host = parents[parents.length - 1];
        var panel = card.querySelector(".lh-sp");
        if (!panel) {
            panel = document.createElement("div");
            panel.className = "lh-sp";
            host.parentElement.insertBefore(panel, host.nextSibling);
        }
        if (panel.innerHTML !== html) panel.innerHTML = html;
    }
    new MutationObserver(fix).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
    });
    fix();
})();

/* Monitoring + Proxmox: same bar pattern - every % tile becomes a full-width bar,
   other tiles go into the tiny footer ("Online 3/3", "VMs 0/0 · LXC 2/2"). */
(function () {
    var CARDS = ["Monitoring", "Proxmox"];
    function esc(s) {
        return s.replace(/[&<>]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
        });
    }
    function cap(s) {
        s = s.toLowerCase();
        if (s === "cpu" || s === "ram" || s === "lxc" || s === "vms")
            return s.toUpperCase().replace("VMS", "VMs");
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function fix() {
        CARDS.forEach(function (name) {
            var card = document.querySelector('[data-name="' + name + '"]');
            if (!card) return;
            var blocks = card.querySelectorAll(".service-block");
            if (!blocks.length) return;
            var bars = "",
                foot = [],
                parents = [];
            blocks.forEach(function (b) {
                var p = b.parentElement;
                if (parents.indexOf(p) < 0) parents.push(p);
                var l = b.querySelector(".service-block-label"),
                    v = b.querySelector(".service-block-value");
                if (!l || !v) return;
                var lab = cap(l.textContent.trim()),
                    val = v.textContent.trim();
                var m = val.replace(",", ".").match(/^([\d.]+)\s*%$/);
                if (m) {
                    var pct = Math.max(1.5, Math.min(100, parseFloat(m[1])));
                    bars +=
                        '<div class="lh-sp-row"><div class="lh-sp-txt"><span>' +
                        esc(lab) +
                        "</span><span>" +
                        esc(val) +
                        "</span></div>" +
                        '<div class="lh-sp-bar"><i style="width:' +
                        pct.toFixed(1) +
                        '%"></i></div></div>';
                } else if (val && val !== "-")
                    foot.push(esc(lab) + " " + esc(val));
            });
            if (!bars) return;
            var html =
                bars +
                (foot.length
                    ? '<div class="lh-sp-foot">' + foot.join(" · ") + "</div>"
                    : "");
            var host = parents[parents.length - 1];
            var panel = card.querySelector(".lh-sp");
            if (!panel) {
                panel = document.createElement("div");
                panel.className = "lh-sp";
                host.parentElement.insertBefore(panel, host.nextSibling);
            }
            if (panel.innerHTML !== html) panel.innerHTML = html;
        });
    }
    new MutationObserver(fix).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
    });
    fix();
})();

/* 2026-10-24: bar cards (Home Assistant, TeslaMate, qBittorrent) with the .lh-sp pattern,
   AdGuard latency with 1 decimal, and a small "Backup" indicator next to the system resources. */
(function () {
    function esc(s) {
        return String(s).replace(/[&<>]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
        });
    }
    function num(t) {
        var m = (t || "")
            .replace(/\s/g, "")
            .replace(",", ".")
            .match(/-?\d+(\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
    }
    function rateMbps(t) {
        var m = (t || "")
            .replace(",", ".")
            .match(/([\d.]+)\s*([kKMGT]?)i?(B|bit|bps)/);
        if (!m) return null;
        var v =
            parseFloat(m[1]) *
            { "": 1e-6, K: 1e-3, M: 1, G: 1e3, T: 1e6 }[m[2].toUpperCase()];
        return m[3] === "B" ? v * 8 : v;
    }
    function watts(v, t) {
        return v == null ? t : Math.round(v) + " W";
    }
    function kms(v, t) {
        return v == null ? t : Math.round(v) + " km";
    }
    /* bar scales (max values) - adjust to your own setup.
     Keys are the widget block labels (lowercase); English and Portuguese labels are both accepted. */
    var CARDS = {
        "Home Assistant": {
            power: { max: 5000, fmt: watts },
            consumo: { max: 5000, fmt: watts },
            solar: { max: 2000, fmt: watts, cls: "sol" },
        },
        TeslaMate: {
            battery: { max: 100, with: "range", withFmt: kms },
            bateria: { max: 100, with: "autonomia", withFmt: kms },
        },
        qBittorrent: {
            download: { max: 1000, rate: true },
            upload: { max: 1000, rate: true, cls: "ul" },
        },
    };
    function bars() {
        Object.keys(CARDS).forEach(function (name) {
            var spec = CARDS[name],
                card = document.querySelector('[data-name="' + name + '"]');
            if (!card) return;
            var blocks = card.querySelectorAll(".service-block");
            if (!blocks.length) return;
            var rows = {},
                foot = [],
                parents = [],
                vals = {},
                merged = [];
            Object.keys(spec).forEach(function (k) {
                if (spec[k].with) merged.push(spec[k].with);
            });
            blocks.forEach(function (b) {
                var p = b.parentElement;
                if (parents.indexOf(p) < 0) parents.push(p);
                var l = b.querySelector(".service-block-label"),
                    v = b.querySelector(".service-block-value");
                if (!l || !v) return;
                var lab = l.textContent.trim(),
                    val = v.textContent.trim(),
                    s = spec[lab.toLowerCase()];
                vals[lab.toLowerCase()] = val;
                if (merged.indexOf(lab.toLowerCase()) >= 0) return;
                if (s) {
                    var n = s.rate ? rateMbps(val) : num(val);
                    var pct =
                        n == null
                            ? 0
                            : Math.max(1.5, Math.min(100, (n / s.max) * 100));
                    var shown = s.fmt ? s.fmt(n, val) : val;
                    rows[lab.toLowerCase()] = {
                        lab: lab,
                        shown: shown,
                        pct: pct,
                        s: s,
                    };
                } else if (val && val !== "-")
                    foot.push(esc(lab) + " " + esc(val));
            });
            var html = Object.keys(spec)
                .map(function (k) {
                    var r = rows[k];
                    if (!r) return "";
                    var shown = r.shown;
                    if (r.s.with && vals[r.s.with] && vals[r.s.with] !== "-") {
                        var w = vals[r.s.with];
                        shown +=
                            " · " + (r.s.withFmt ? r.s.withFmt(num(w), w) : w);
                    }
                    return (
                        '<div class="lh-sp-row"><div class="lh-sp-txt"><span>' +
                        esc(r.lab) +
                        "</span><span>" +
                        esc(shown) +
                        "</span></div>" +
                        '<div class="lh-sp-bar' +
                        (r.s.cls ? " " + r.s.cls : "") +
                        '"><i style="width:' +
                        r.pct.toFixed(1) +
                        '%"></i></div></div>'
                    );
                })
                .join("");
            if (!html) return;
            if (foot.length)
                html +=
                    '<div class="lh-sp-foot">' + foot.join(" · ") + "</div>";
            var host = parents[parents.length - 1];
            var panel = card.querySelector(".lh-sp");
            if (!panel) {
                panel = document.createElement("div");
                panel.className = "lh-sp";
                host.parentElement.insertBefore(panel, host.nextSibling);
            }
            if (panel.innerHTML !== html) panel.innerHTML = html;
        });
    }
    function latency() {
        document
            .querySelectorAll('[data-name="AdGuard Home"] .service-block')
            .forEach(function (b) {
                var l = b.querySelector(".service-block-label"),
                    v = b.querySelector(".service-block-value");
                if (
                    !l ||
                    !v ||
                    !/lat/i.test(l.textContent) ||
                    v.children.length
                )
                    return;
                var t = v.textContent.trim(),
                    m = t.match(/^(\d+)([.,])(\d{2,})\s*(.*)$/);
                if (!m) return;
                var r = (Math.round(parseFloat(m[1] + "." + m[3]) * 10) / 10)
                    .toFixed(1)
                    .replace(".", m[2]);
                v.textContent = r + (m[4] ? " " + m[4] : "");
            });
    }
    var bk = null;
    function loadBackup() {
        fetch("/status/backup.json", { cache: "no-store" })
            .then(function (r) {
                return r.json();
            })
            .then(function (d) {
                bk = d;
                paintBackup();
            })
            .catch(function () {
                bk = null;
            }); /* optional: no /status/backup.json -> no pill */
    }
    function paintBackup() {
        var el = document.getElementById("lh-backup");
        if (!el || !bk) return;
        var dt = new Date(bk.time),
            when = isNaN(dt)
                ? "?"
                : dt
                      .toLocaleString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                      .replace(",", "");
        var html =
            '<span class="lh-backup-dot"></span><span class="lh-bk-l">Backup </span>' +
            esc(when) +
            '<span class="lh-bk-s"> · ' +
            esc(bk.size || "?") +
            "</span>";
        if (el.innerHTML !== html) el.innerHTML = html;
        var warn = String(bk.status || "").toUpperCase() !== "OK";
        if (el.classList.contains("warn") !== warn)
            el.classList.toggle("warn", warn);
        el.title = "Last backup status: " + (bk.status || "?");
    }
    function mountBackup() {
        if (document.getElementById("lh-backup")) return;
        var res = document.querySelector(
            "#information-widgets .information-widget-resource",
        );
        if (!res || !bk) return;
        var el = document.createElement("div");
        el.id = "lh-backup";
        el.className = "lh-backup";
        res.parentElement.appendChild(el);
        paintBackup();
    }
    function fix() {
        bars();
        latency();
        mountBackup();
    }
    new MutationObserver(fix).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
    });
    loadBackup();
    setInterval(loadBackup, 300000);
    fix();
})();
