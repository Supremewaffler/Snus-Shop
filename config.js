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
  extras: false,
  thanksCode: "",              // discount code shown when the parcel arrives (blank = no code)
  pickupHours: 48,             // how long InPost usually keeps a parcel in the Paczkomat
  autoNight: true,             // switch the map to the night style after sunset
  analytics: false,            // Vercel Web Analytics — enable it in the Vercel dashboard first

  // Instagram account customers are sent to from the flavour carousel.
  instagram: "snus.shop24",

  // Product lines: name shown on the tin and in the filter, strength, and the tin's rim colour.
  lines: {
    cuba:    { name: "Cuba",    short: "CUBA",    strength: "66 mg/g", rim: "#d9d9de" },
    killa:   { name: "Killa",   short: "KILLA",   strength: "12 mg/g", rim: "#ff5fa2" },
    iceberg: { name: "Iceberg", short: "ICEBERG", strength: "50 mg/g", rim: "#8fd8ff" },
    pablo:   { name: "Pablo",   short: "PABLO",   strength: "50 mg/g", rim: "#d8b45a" }
  },

  // Flavours in the "Popular flavours" carousel, in this order.
  //   line:  one of the lines above
  //   emoji: shown on the drawn tin
  //   color: the flavour's colour on the drawn tin
  //   image: optional photo in assets/products/ (square works best); replaces the drawn tin
  products: [
    { line: "cuba",    name: "Cherry",                 emoji: "🍒",   color: "#c2183c" },
    { line: "cuba",    name: "Forest Berries",         emoji: "🌲🫐", color: "#b0306b" },
    { line: "cuba",    name: "Blueberry",              emoji: "🫐",   color: "#3f51b5" },
    { line: "cuba",    name: "Blackcurrant",           emoji: "🫐",   color: "#5a2160" },
    { line: "cuba",    name: "Apple Juice",            emoji: "🍏",   color: "#6fb83a" },
    { line: "cuba",    name: "Grape",                  emoji: "🍇",   color: "#8e44ad" },
    { line: "cuba",    name: "Banana Hit",             emoji: "🔥",   color: "#e8b923" },
    { line: "cuba",    name: "Blackberry",             emoji: "🫐",   color: "#4b2a6b" },
    { line: "cuba",    name: "Pineapple",              emoji: "🍍",   color: "#f2a93b" },
    { line: "cuba",    name: "Ice Spearmint",          emoji: "🌿",   color: "#2ec4b6" },

    { line: "killa",   name: "Grape Ice",              emoji: "🍇",   color: "#9b59b6" },

    { line: "iceberg", name: "Grape",                  emoji: "🍇",   color: "#8e44ad" },
    { line: "iceberg", name: "Black",                  emoji: "🧊",   color: "#59606b" },

    { line: "pablo",   name: "Exclusive Frosted Mint", emoji: "🌿",   color: "#26c6a6" }
  ]
};
