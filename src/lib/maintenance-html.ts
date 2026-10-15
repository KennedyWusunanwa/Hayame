// The visitor-facing maintenance page as one self-contained HTML document.
// The proxy returns this directly instead of rewriting to an app route, so no
// site layout (navbar, banner, cookie notice, hydration) can flash before it.
import {
  resolveBackgroundUrl,
  splitHeadline,
  type MaintenanceSettings,
  type MaintenanceTheme,
} from "@/lib/maintenance-core";

const THEMES: Record<MaintenanceTheme, { bg: string; text: string; accent: string; chip: string; tile: string; logo: string }> = {
  navy: { bg: "linear-gradient(160deg,#06182E 0%,#0A2B54 55%,#0E4C8C 100%)", text: "#FFFFFF", accent: "#7CCBFF", chip: "rgba(255,255,255,.14)", tile: "rgba(255,255,255,.12)", logo: "/logo-white.png" },
  blue: { bg: "linear-gradient(155deg,#0E66B8 0%,#1484D9 55%,#2E9BEA 100%)", text: "#FFFFFF", accent: "#0A2B54", chip: "rgba(255,255,255,.2)", tile: "rgba(255,255,255,.18)", logo: "/logo-white.png" },
  light: { bg: "#EDF7FF", text: "#0A2B54", accent: "#1484D9", chip: "rgba(20,132,217,.12)", tile: "#FFFFFF", logo: "/logo.png" },
};

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Only plain https links make it into an attribute. */
function safeUrl(url: string) {
  return /^https:\/\/[^\s"'<>()\\]+$/i.test(url) ? url : null;
}

export function renderMaintenanceHtml(settings: MaintenanceSettings): string {
  const bg = resolveBackgroundUrl(settings.background);
  const photo = bg ? safeUrl(bg) ?? (bg.startsWith("/") ? bg : null) : null;
  const themeKey: MaintenanceTheme = photo && settings.theme === "light" ? "navy" : settings.theme;
  const th = THEMES[themeKey];
  const dark = settings.theme === "light" && !photo;
  const text = dark ? THEMES.light.text : th.text;
  const timer = settings.mode === "timed" && settings.showCountdown && settings.endsAt && Number.isFinite(Date.parse(settings.endsAt));

  const headline = splitHeadline(settings.headline)
    .map((p) => (p.accent ? `<span style="color:${th.accent}">${escapeHtml(p.text)}</span>` : escapeHtml(p.text)))
    .join("");
  const cell = (label: string, id: string) =>
    `<div class="tile"><div class="num" id="${id}">--</div><div class="lab">${label}</div></div>`;
  const email = settings.contactEmail && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(settings.contactEmail) ? settings.contactEmail : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Hayame · Back soon</title>
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0A2B54">
<link rel="icon" href="/favicon.ico">
<link rel="preload" href="/fonts/Geist-Black.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Geist-Medium.woff2" as="font" type="font/woff2" crossorigin>
${photo ? `<link rel="preload" href="${escapeHtml(photo)}" as="image">` : ""}
<style>
@font-face{font-family:Geist;font-weight:500;font-display:swap;src:url(/fonts/Geist-Medium.woff2) format("woff2")}
@font-face{font-family:Geist;font-weight:700;font-display:swap;src:url(/fonts/Geist-Bold.woff2) format("woff2")}
@font-face{font-family:Geist;font-weight:900;font-display:swap;src:url(/fonts/Geist-Black.woff2) format("woff2")}
*{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100%;background:${themeKey === "light" ? "#EDF7FF" : "#06182E"}}
body{font-family:Geist,-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;color:${text};-webkit-font-smoothing:antialiased;min-height:100vh;min-height:100dvh;background:${th.bg};position:relative;isolation:isolate;overflow-x:hidden}
.photo{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 900ms ease;z-index:-2}
.photo.on{opacity:1}
.shade{position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(6,24,46,.72) 0%,rgba(6,24,46,.5) 45%,rgba(6,24,46,.85) 100%)}
main{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:56px 24px 24px;animation:in 700ms cubic-bezier(.2,.7,.2,1) both}
@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.logo{height:56px;width:auto}
.badge{margin-top:40px;display:inline-block;border-radius:999px;padding:6px 16px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:${th.chip};-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
h1{margin-top:24px;font-weight:900;font-size:36px;line-height:1.02;letter-spacing:-.04em;max-width:15em}
p.msg{margin-top:20px;max-width:36rem;font-size:16px;line-height:1.6;font-weight:500;opacity:.9}
.timer{margin-top:40px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%;max-width:28rem}
.tile{background:${th.tile};border-radius:16px;padding:12px 4px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.num{font-weight:900;font-size:30px;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.lab{margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.open{margin-top:40px;font-size:18px;font-weight:700;color:${th.accent};display:none}
.contact{margin-top:40px;font-size:14px;font-weight:500;opacity:.85}
.contact a{color:inherit;font-weight:700;text-underline-offset:4px}
footer{padding:0 0 32px;text-align:center;font-size:14px;font-weight:700;opacity:.8}
@media(min-width:640px){.logo{height:64px}h1{font-size:60px}p.msg{font-size:18px}.num{font-size:36px}.tile{padding:16px 4px}}
@media(prefers-reduced-motion:reduce){main{animation:none}.photo{transition:none}}
</style></head>
<body>
${photo ? `<img class="photo" id="ph" src="${escapeHtml(photo)}" alt=""><div class="shade"></div>` : ""}
<main>
<img class="logo" src="${dark ? "/logo.png" : "/logo-white.png"}" alt="Hayame" width="220" height="80">
${settings.badge ? `<span class="badge">${escapeHtml(settings.badge)}</span>` : ""}
<h1>${headline}</h1>
${settings.message ? `<p class="msg">${escapeHtml(settings.message)}</p>` : ""}
${timer ? `<div class="timer" id="timer" role="timer" aria-label="Time until we are back">${cell("Days", "d")}${cell("Hours", "h")}${cell("Minutes", "m")}${cell("Seconds", "s")}</div><p class="open" id="open">Opening now…</p>` : ""}
${email ? `<p class="contact">Need us? <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` : ""}
</main>
<footer>www.hayamegh.com</footer>
<script>
(function(){
var ph=document.getElementById("ph");if(ph){if(ph.complete)ph.classList.add("on");else ph.addEventListener("load",function(){ph.classList.add("on")})}
${timer ? `var end=Date.parse(${JSON.stringify(settings.endsAt)});var $=function(i){return document.getElementById(i)};
function pad(n){return(n<10?"0":"")+n}
function tick(){var ms=end-Date.now();
if(ms<=0){$("timer").style.display="none";$("open").style.display="block";setTimeout(function(){location.reload()},2000);setInterval(function(){location.reload()},8000);return}
var t=Math.floor(ms/1000);$("d").textContent=pad(Math.floor(t/86400));$("h").textContent=pad(Math.floor(t%86400/3600));$("m").textContent=pad(Math.floor(t%3600/60));$("s").textContent=pad(t%60);
setTimeout(tick,1000-Date.now()%1000)}
tick();` : ""}
})();
</script>
</body></html>`;
}
