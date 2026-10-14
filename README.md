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

The map only redraws while something is moving, so an idle page uses almost no battery. While someone is dragging or pinching, the page slides the already-drawn map instead of redrawing it, and redraws once, sharply, when they let go. Decorative pins are hidden when zoomed out past the whole-route view.

## Map styles

`mapStyle` in `config.js` picks the map's colours (currently `noir`):

- `neon`: purple game map (default)
- `noir`: black and silver, matching the brand
- `night`: dark city with lit windows and a gold route
- `day`: light, Google-Maps-like
- `blueprint`: blue and white

To preview any style without changing the site, add `&map=<style>` to a link, e.g. `?p=demo&map=noir`.

## Map layouts

`mapLayout` in `config.js` picks the city's design. All four have the same four stops, and they work with any map style:

- `grid`: an island city with avenues, a winding river, a harbour bay with piers, a lake, small islands off the coast, and quieter suburbs towards the shore
- `city3d`: the same city with raised 3D buildings, taller downtown (live)
- `oldtown`: ring roads around a market square, with a ring park and a river (Kraków-style)
- `metro`: a transit-map look, with the delivery route as the main line

`routeColor` (`red`, `cyan`, `gold`, `green` or `white`) overrides the route colour of any style. To preview a route colour, add `&route=red` to a link.

The layouts are drawn in `layouts.js`. The page picks the map rotation that fits the screen best. To preview a layout, add `&layout=<name>` to a link, e.g. `?p=demo&map=noir&layout=city3d`.

## Flavour carousel

Under the pickup point, customers see a **Popularne smaki / Popular flavours** carousel. They can swipe it, or use the arrows or dots.

Below it, the **Zamów … na Instagramie** button opens a chat with the shop's Instagram account (`ig.me/m/snus.shop24`). Instagram doesn't let websites pre-fill a DM, so the page copies a ready-made order message when the button is tapped, and the customer pastes it into the chat. The message names the chosen flavour and includes the customer's last parcel number, so it's easy to see who's ordering.

The flavours come from the shop's menu and are set in `config.js`:

- **`lines`** lists the product lines: Pablo Exclusive 50 mg/g, Cuba Black 66 mg/g and K#rwa Collection Max 64 mg/g. Each has a strength and a tin rim colour. When there's more than one line, customers see filter buttons for them.
- **`products`** lists the flavours. Each one has a line, a name, emoji and a colour.

Without a photo, the page draws a tin in the flavour's colour, with the line name, emoji and strength. To use a real photo, put it in `assets/products/` (square works best) and add `image: "assets/products/<file>"` to that flavour. When stock changes, add, remove or reorder lines in `products`.

## Branding

Edit `config.js` to change the shop name used in the page title, the refresh interval and the default language.

The Snus Shop 24 artwork lives in `assets/`:

- `wordmark.webp`: the header logo
- `logo.webp`: the round logo on the link-maker page
- `favicon.png` and `apple-touch-icon.png`: browser and home-screen icons
- `rider.webp`: the courier on the map
- `rider-large.webp`: the bigger rider on the link-maker page

To update the artwork, replace these files with new versions of the same size. Phones keep files from `assets/` for up to a week (see `vercel.json`), so give a changed image a new file name (e.g. `rider-2.webp`) and update the reference to it. Otherwise returning customers may keep seeing the old one.

## Hosting

These are static files (`index.html`, `styles.css`, `app.js`, `config.js`), so any static host works:

- **Vercel / Netlify:** import the repo with no build command.
- **GitHub Pages:** Settings → Pages → deploy from this branch, folder `/`.

To run it locally: `python3 -m http.server`, then open http://localhost:8000/?p=demo.
