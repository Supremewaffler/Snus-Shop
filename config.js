// Edit these to brand the page.
window.TRACK_CONFIG = {
  brandName: "Snus Shop 24",   // used in the page title
  refreshSeconds: 60,          // how often the page re-checks InPost
  defaultLang: "pl",           // "pl" or "en"
  mapStyle: "noir",            // "neon", "noir", "night", "day" or "blueprint"
  mapLayout: "city3d",         // "grid", "city3d", "oldtown" or "metro"
  routeColor: "",              // optional: "red", "cyan", "gold", "green" or "white" (blank = the style's own)

  // Extra features (directions, your order, celebration, pickup countdown, night map, weather,
  // status alerts, share/QR and "My parcels"). Preview them with ?preview=1 before switching on.
  extras: {
    directions: false,         // 1. "Navigate to the Paczkomat" button
    order: true,               // 2. "Your order" + order again (pick the flavour when making the link)
    celebrate: false,          // 3. confetti when it arrives (+ thanksCode below)
    countdown: false,          // 4. pickup countdown
    nightMap: false,           // 5. night map after sunset
    weather: false,            // 6. weather + rain/snow on the map
    alerts: false,             // 7. alert when the status changes
    share: false,              // 8. share buttons + QR code on the link maker
    myParcels: true            // 9. "My parcels" list on the link maker
  },
  thanksCode: "",              // discount code shown when the parcel arrives (blank = no code)
  pickupHours: 48,             // how long InPost usually keeps a parcel in the Paczkomat
  autoNight: true,             // switch the map to the night style after sunset
  analytics: false,            // Vercel Web Analytics — enable it in the Vercel dashboard first

  // 18+ confirmation before the flavours and ordering are shown (tracking is never locked).
  ageGate: true,
  ageGateDays: 30,             // how long a "yes" is remembered on the customer's phone

  // Instagram account customers are sent to from the flavour carousel.
  instagram: "snus.shop24",

  // The menu (product lines and flavours) lives in menu.js, so the Telegram bot can update it.
};
