# NOOR — Islamic Companion

Installable web app (PWA): prayer times, Quran reader (Uthmani text + Malay translation), duas & zikir, digital tasbih, qibla, daily habit tracker and reflections. No build step, no dependencies, data stays on the device (localStorage).

## Deploy to GitHub Pages
1. Create a new GitHub repo and push this folder to the `main` branch:
   ```
   git init -b main && git add . && git commit -m "NOOR"
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes on every push. Your app will be at `https://<you>.github.io/<repo>/`.

On iPhone: open the URL in Safari → Share → **Add to Home Screen**.

## Run locally
```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Data sources
- Prayer times: [Aladhan API](https://aladhan.com/prayer-times-api) (method 17 = JAKIM). May differ by a minute or two from the official zone tables at e-solat.gov.my.
- Quran: [Al Quran Cloud](https://alquran.cloud) — `quran-uthmani` + `ms.basmeih`. Surahs you open are cached for offline reading.
- Duas: `js/duas.js`. Please have the texts and references reviewed by a qualified person before public release.

## Notes
- Prayer times are cached per day; offline the app shows the last known times, marked as estimates.
- Backup/restore is in Profil → Export / Import JSON.
- Each deploy stamps `sw.js` with the commit SHA so users get the new version.
