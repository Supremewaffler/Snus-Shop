// Edit these to brand the page.
window.TRACK_CONFIG = {
  brandName: "Snus Shop 24",   // used in the page title
  refreshSeconds: 60,          // how often the page re-checks InPost
  defaultLang: "pl",           // "pl" or "en"
  mapStyle: "noir",            // "neon", "noir", "night", "day" or "blueprint"
  mapLayout: "grid",           // "grid", "city3d", "oldtown" or "metro"

  // Instagram account customers are sent to from the flavour carousel.
  instagram: "snus.shop24",

  // Product lines: name shown on the tin and in the filter, strength, and the tin's rim colour.
  lines: {
    pablo: { name: "Pablo Exclusive", short: "PABLO", strength: "50 mg/g", rim: "#d8b45a" },
    cuba:  { name: "Cuba Black",      short: "CUBA",  strength: "66 mg/g", rim: "#d9d9de" },
    max:   { name: "K#rwa Collection Max", short: "K#RWA MAX", strength: "64 mg/g", rim: "#e5484d" }
  },

  // Flavours in the "Popular flavours" carousel, in this order.
  //   line:  one of the lines above
  //   emoji: shown on the drawn tin
  //   color: the flavour's colour on the drawn tin
  //   image: optional photo in assets/products/ (square works best); replaces the drawn tin
  products: [
    { line: "pablo", name: "Mango Ice",        emoji: "🥭🧊", color: "#ffb347" },
    { line: "pablo", name: "Passion Fruit",    emoji: "🥭🌴", color: "#b06cff" },
    { line: "pablo", name: "Tropical Punch",   emoji: "🌴🥊", color: "#ff6f61" },
    { line: "pablo", name: "Cherry Cola",      emoji: "🍒🥤", color: "#c2183c" },
    { line: "pablo", name: "Dark Cherry",      emoji: "🖤🍒", color: "#7a0a24" },
    { line: "pablo", name: "Kiwi",             emoji: "🥝",   color: "#7cc242" },
    { line: "pablo", name: "Grape Ice",        emoji: "🍇🧊", color: "#9b59b6" },
    { line: "pablo", name: "Blue Raspberry",   emoji: "🫐🍓", color: "#3d7bff" },
    { line: "pablo", name: "Lemonade",         emoji: "🍋🥤", color: "#ffd84d" },
    { line: "pablo", name: "Sour Blueberries", emoji: "🫐🍋", color: "#5b6cff" },
    { line: "pablo", name: "Blue Mint",        emoji: "🫐🌿", color: "#2ec4b6" },

    { line: "cuba",  name: "Grape",            emoji: "🍇",     color: "#8e44ad" },
    { line: "cuba",  name: "Forest Berries",   emoji: "🫐🍓🌲", color: "#b0306b" },
    { line: "cuba",  name: "Black Currant",    emoji: "🫐🖤",   color: "#5a2160" },
    { line: "cuba",  name: "Blueberry",        emoji: "🫐",     color: "#3f51b5" },

    { line: "max",   name: "Grape Ice",        emoji: "🍇🧊",   color: "#9b59b6" },
    { line: "max",   name: "Blueberry Ice",    emoji: "🫐🧊",   color: "#4f7cff" },
    { line: "max",   name: "Triple Mango",     emoji: "🥭🥭🥭", color: "#ffa726" },
    { line: "max",   name: "Strong Mint",      emoji: "🌿❄️",   color: "#26c6a6" }
  ]
};
