# Moped parcel tracker

A tracking page for InPost parcels. It shows the same live status as InPost, but the parcel rides to the customer on a little moped.

- **No backend.** The page reads InPost's public tracking API (`api-shipx-pl.easypack24.net`) straight from the browser. It needs no API key.
- **InPost's own wording.** Every status title and description comes from InPost's status list, in Polish or English, so customers see exactly what InPost says.
- **Live.** It re-checks every 60 seconds and whenever the customer comes back to the tab. It stops once the parcel is delivered.
- **No typing for customers.** The tracking number is in the link.

## How to use it

1. Send the parcel at InPost as usual and copy the tracking number.
2. Open the site with no parameters (e.g. `https://your-site/`). Paste the number and press **Utwórz link**, then **Kopiuj**.
3. Send that link (`https://your-site/?p=<number>`) to the customer.

`?p=demo` shows a demo with buttons for every stage.

New parcels can take a few hours to appear at InPost. Until then the page says so and keeps checking.

## What the moped does

| InPost status | Scene |
|---|---|
| created / confirmed | parked outside the shop, waiting |
| sent, at a branch or sorting centre | riding through town |
| out for delivery | riding fast |
| in the Paczkomat / ready to collect | parked at the locker (or house, for courier delivery) |
| delivered | the box is gone and the locker is open |
| returned, undelivered, expired… | stopped, with a warning sign |

## Branding

Edit `config.js` to change the shop name, the label on the tin, the refresh interval and the default language.

## Hosting

These are static files (`index.html`, `styles.css`, `app.js`, `config.js`), so any static host works:

- **Vercel / Netlify:** import the repo with no build command.
- **GitHub Pages:** Settings → Pages → deploy from this branch, folder `/`.

To run it locally: `python3 -m http.server`, then open http://localhost:8000/?p=demo.
