<img width="1860" height="1521" alt="Lima 2026-11-01 at 00 10 34" src="https://github.com/user-attachments/assets/0dfcf3d5-846f-4588-97da-af021f2ffb7d" />


# Homepage theme — "Home Assistant style"

A dark theme for [Homepage](https://gethomepage.dev) (gethomepage/homepage): charcoal background, rounded cards, round glowing icons, pastel "pill" bars and the Inter font.

## Files (`src/`)

| File                  | What it is                                                                            |
| --------------------- | ------------------------------------------------------------------------------------- |
| `custom.css`          | The look (required).                                                                  |
| `custom.js`           | Optional: a service search box in the top bar and "HA-style" bars for specific cards. |
| `settings-theme.yaml` | 4 lines to merge into your `settings.yaml`.                                           |

## Installation

1. **Prerequisite:** a working Homepage install (Docker or source) and access to its config folder (in Docker, the volume mounted at `/app/config`).

2. **Copy the CSS (and the JS, if you want it)** into the config folder, next to `settings.yaml`:

    ```sh
    cp src/custom.css /path/to/homepage/config/custom.css
    cp src/custom.js  /path/to/homepage/config/custom.js   # optional
    ```

    Homepage automatically loads `custom.css` and `custom.js` from this folder.

3. **Merge the settings** from `src/settings-theme.yaml` into your `config/settings.yaml` (don't replace the file — just add/adjust these keys):

    ```yaml
    theme: dark # dark theme
    color: neutral # neutral palette (the CSS overrides the colours)
    headerStyle: clean
    hideHostname: true
    ```

4. **Reload:** hard-refresh the browser (Ctrl/Cmd+Shift+R). If nothing changes, restart the container (`docker restart homepage`).

## Notes

- **Inter font:** imported from Google Fonts at the top of `custom.css`. Offline (or if you prefer), remove the `@import` line — it falls back to the system font.
- **Colours:** edit the `:root` block at the start of `custom.css`. Icon glow / bar colours are assigned per service group by position (1st group blue, 2nd green, 3rd amber, 4th pink, 5th purple).
- **`custom.js` (optional):**
    - Service search in the top bar ("Search services…"): filters cards as you type, Enter opens the first match, Esc clears.
    - Bars are drawn for cards whose `name` in `services.yaml` matches **exactly**: `Speedtest`, `NAS`, `Monitoring`, `Proxmox`, `Home Assistant`, `TeslaMate`, `qBittorrent`, `AdGuard Home`, `UniFi Gateway`. Rename your cards to match, or edit the names in `custom.js`. Cards with other names keep the normal CSS style.
    - Some cards read specific widget labels (lowercase). English and Portuguese labels both work:
        - `NAS`: `used`, `free`, `total`, `usage` (a percentage)
        - `Home Assistant`: `power` (W), `solar` (W)
        - `TeslaMate`: `battery` (%), `range` (km)
        - `qBittorrent` / `Speedtest`: `download`, `upload` (and `ping` for Speedtest)
    - Bar scales (`max`) live in the `CARDS` objects in `custom.js` — adjust them to your setup.
    - "Backup" pill in the top bar: only shown if your server serves `/status/backup.json` (`{"status":"OK","time":"…","size":"…"}`); otherwise it's ignored.
