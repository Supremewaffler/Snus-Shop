# Moped parcel tracker

A tracking page for InPost parcels. It shows the same live status as InPost, but on a game-style city map where a courier on a moped drives the parcel to the customer.

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

## The map

The page shows a dark, game-style city map with four pins: **Warehouse — dispatch → InPost sorting hub → Local depot → your Paczkomat / home**. A courier on a moped drives along the glowing route between them:

| InPost status | Moped |
|---|---|
| created / confirmed | parked at the warehouse |
| sent / collected | driving to the sorting hub |
| at the sorting centre | parked at the hub |
| sent from the sorting centre | driving to the local depot (crosses the bridge) |
| at the destination branch | parked at the depot |
| out for delivery | driving to the customer |
| in the Paczkomat / delivered | parked at the customer's pin |
| returned, undelivered, expired… | stopped, shown in red |

InPost doesn't publish the courier's GPS position, so the map position is an estimate. Each InPost update moves the moped to the correct stage. Between updates it creeps closer to the next pin, based on how long that stage usually takes. The page tells customers the position is approximate.

The city is generated in the browser (no map service or API key needed). Each tracking number gets its own city layout. On phones the map rotates so the route runs top-to-bottom. **Śledź / Follow** zooms in on the moped, and **Trasa / Route** shows the whole route.

The map can be moved and zoomed within the city's limits:

- **Computer:** drag to move, scroll wheel or double-click to zoom.
- **Phone:** two fingers to move and pinch-zoom. One finger still scrolls the page, and a short tip explains this.
- **Both:** the + / − buttons zoom in and out.

The map only redraws while something is moving, so an idle page uses almost no battery.

## Flavour carousel

Under the pickup point, customers see a **Popularne smaki / Popular flavours** carousel. They can swipe it, or use the arrows or dots.

Below it, the **Zamów … na Instagramie** button opens a chat with the shop's Instagram account (`ig.me/m/snus.shop24`). Instagram doesn't let websites pre-fill a DM, so the page copies a ready-made order message when the button is tapped, and the customer pastes it into the chat. The message names the chosen flavour and includes the customer's last parcel number, so it's easy to see who's ordering.

To add or change flavours, edit `products` in `config.js` and put photos in `assets/products/` (square photos work best). If a flavour has no `image`, the page draws a tin with its name instead.

## Branding

Edit `config.js` to change the shop name used in the page title, the refresh interval and the default language.

The Snus Shop 24 artwork lives in `assets/`:

- `wordmark.png`: the header logo
- `logo.png`: the round logo on the link-maker page
- `favicon.png` and `apple-touch-icon.png`: browser and home-screen icons
- `rider.webp`: the courier on the map
- `rider-large.webp`: the bigger rider on the link-maker page

To update the artwork, replace these files with new versions of the same name and size.

## Hosting

These are static files (`index.html`, `styles.css`, `app.js`, `config.js`), so any static host works:

- **Vercel / Netlify:** import the repo with no build command.
- **GitHub Pages:** Settings → Pages → deploy from this branch, folder `/`.

To run it locally: `python3 -m http.server`, then open http://localhost:8000/?p=demo.
