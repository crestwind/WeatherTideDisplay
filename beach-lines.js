// What the guy in the hammock says, in the Tropical display style. Each group is a list of lines in quotes, separated
// by commas. He picks lines that match the weather, the time of day and the temperature, and never repeats one too soon.
// These words are filled in for you: {temp} (temperature now), {high} and {low} (today's), {town}, {day} (e.g. Friday).
// To add a line, copy an existing one, keep the quotes and the comma at the end, and change the words.
// Any group can have a Day and a Night version next to it (like clear, clearDay and clearNight): lines in clearDay are
// only said by day (sunshine, sunglasses, blue skies…), lines in clearNight only at night (stars, the moon…).
window.TW_BEACH_LINES = {

  // ---------- in the hammock in calm weather ----------
  hammock: [
    "This is the life.",
    "Island time, baby.",
    "Do not disturb.",
    "I could get used to this.",
    "Hammock: 1. Stress: 0.",
    "Someone bring me another coconut.",
    "Shoes are optional here.",
    "Is it Monday? Don't tell me.",
    "Listen to those waves.",
    "Sand in my shorts. Worth it.",
    "Just five more minutes. Or hours.",
    "Who needs Wi-Fi?",
    "The tide's coming in. So is my nap.",
    "Out of office: permanently.",
    "Best hammock on the island.",
    "No plans. Perfect plans.",
  ],
  hammockDay: [
    "Another day in paradise.",
    "Sunscreen check: done.",
  ],
  hammockNight: [
    "Another night in paradise.",
    "Sleeping under the stars tonight.",
  ],

  // ---------- in the hut in bad weather ----------
  hut: [
    "Good thing I've got this hut.",
    "The hammock can wait.",
    "Staying dry in here.",
    "Hope the roof holds.",
    "Rain on a tin roof. Er, grass roof.",
    "Paradise is closed for a bit.",
  ],

  // ---------- anything, in any weather except storms ----------
  any: [
    "Check the tides before your beach walk!",
    "{town}, you're looking good today.",
    "Happy {day}, everybody!",
    "Drink some water today!",
    "Who keeps flying that plane around?",
    "Scroll down for the radar and the tide tables!",
    "Don't forget to call your mom.",
    "Life's better at the beach.",
    "Swim near a lifeguard, folks.",
  ],

  // ---------- by weather ----------
  clear: [
    "Not a cloud in the sky!",
  ],
  clearDay: [
    "It's gonna be a beautiful day!",
    "Sunscreen weather, folks.",
    "Perfect beach day.",
    "Sunglasses: on. Worries: off.",
    "Blue skies all day!",
    "Bring a hat today, it's bright out there.",
    "If you're stuck inside today, I'm sorry.",
    "The water looks amazing today.",
  ],
  clearNight: [
    "Clear night. Look at all those stars!",
    "The moon on the water. Beautiful.",
    "Make a wish on a shooting star!",
    "The waves sound louder at night.",
    "You can see the Milky Way from this hammock.",
    "Warm breeze, clear sky. Perfect night.",
    "Stars above, waves below. Not bad.",
    "Somebody's having a bonfire down the beach.",
    "Clear skies. Good night for sleeping under the stars.",
    "The stars are out tonight.",
  ],
  partly: [
    "A few clouds, nothing to worry about.",
    "Pretty nice out, all things considered.",
  ],
  partlyDay: [
    "Sun's playing peekaboo today.",
    "Nice mix of sun and clouds.",
    "That cloud looks like a coconut.",
    "Good day for a walk on the beach.",
  ],
  partlyNight: [
    "A few clouds drifting past the moon.",
    "Nice night, all things considered.",
    "The moon keeps ducking behind the clouds.",
    "A few stars peeking through.",
  ],
  cloudy: [
    "Bring a light jacket, just in case.",
  ],
  cloudyDay: [
    "No sun today, but no rain either.",
    "Cloudy days are cozy days.",
    "Grey day. Still beats the office.",
    "The sun's taking a day off.",
    "No sunburn today at least.",
  ],
  cloudyNight: [
    "No stars tonight. Too cloudy.",
    "Cloudy night. Still beats the office.",
    "Clouds are keeping it nice and warm tonight.",
    "Dark night. Just the waves and me.",
    "Hope it holds off till morning.",
  ],
  fog: [
    "Can't see a thing out here!",
    "Pea soup out here today.",
    "Where did the island go?",
    "Drive slow in this fog, folks!",
    "Spooky out here in the fog.",
    "Headlights on if you're driving!",
  ],
  drizzle: [
    "Just a little drizzle.",
    "Don't forget your umbrella!",
    "Bit damp out here.",
    "Roads might be slick today.",
    "A hood will do today, no umbrella needed.",
  ],
  rain: [
    "Don't forget your umbrella!",
    "Rain jacket weather.",
    "Puddles everywhere today!",
    "Watch out for slick roads.",
    "Rain, rain, go away…",
    "Perfect weather for a nap. Indoors.",
  ],
  rainDay: [
    "Good day to stay in with a book.",
  ],
  rainNight: [
    "Good night to stay in with a book.",
  ],
  heavy: [
    "It's really coming down!",
    "Watch for flooded roads today.",
    "Turn around, don't drown!",
    "Maybe stay inside today.",
    "Stay off the beach today.",
  ],
  storm: [
    "When thunder roars, go indoors!",
    "Lightning! Get off the beach!",
    "Stay out of the water in this!",
    "Unplug anything you love.",
    "Count the seconds after the flash!",
  ],
  flurries: [
    "Is that snow?! On the beach?!",
    "A few flakes flying around.",
    "Hot cocoa weather. In paradise?",
    "Bundle up out there!",
  ],
  snow: [
    "Brrr! Bundle up!",
    "Snow on the palm trees. Now I've seen it all.",
    "Drive slow on the snowy roads.",
    "Check on your neighbors today.",
  ],
  snowDay: [
    "Snow day!",
    "Build a sandman for me!",
  ],
  snowNight: [
    "It'll be a snow day tomorrow! On the beach!",
    "Snow on the beach at night. Now that's strange.",
  ],
  heavysnow: [
    "Whoa, look at it snow!",
    "Stay off the roads if you can.",
    "Shovel slowly, take breaks!",
    "Keep your pets warm today.",
    "I came here to get away from this!",
  ],
  windy: [
    "Hold onto your hat!",
    "Whoa, that gust!",
    "Not a day for umbrellas, they'll fly away.",
    "Secure your trash cans!",
    "Watch out for falling coconuts!",
    "My hammock's swinging by itself!",
  ],
  windyDay: [
    "Great day for kite surfing.",
  ],
  windyNight: [
    "The palms are really swaying tonight.",
    "Windy night. Hold onto that hammock!",
  ],

  // ---------- hurricanes and tornadoes: safety first ----------
  hurricane: [
    "Stay safe out there!",
    "Hurricane warning. Please take it seriously.",
    "Listen to local officials.",
    "If they say evacuate, go!",
    "Head inland if you're told to.",
    "Have water, food and batteries ready.",
    "Charge your phone now.",
    "Stay away from the water today.",
    "Don't drive through flooded roads.",
    "This hut won't do. Get somewhere safe!",
  ],
  tornado: [
    "Tornado warning! Take cover now!",
    "Get to the lowest floor, away from windows.",
    "Stay safe out there!",
    "Basement or an inside room, now!",
    "Cover your head and neck.",
    "Don't try to outrun it in a car.",
    "Listen for local alerts.",
    "Stay sheltered until the warning ends.",
  ],

  // ---------- by time of day ----------
  morning: [
    "Good morning!",
    "Sunrise over the water. Not bad.",
    "Morning! {high}° today.",
    "Coffee and the sound of the waves.",
    "Early swim, anyone?",
  ],
  afternoon: [
    "Good afternoon!",
    "Siesta time.",
    "Halfway through {day}!",
    "Time for another coconut.",
  ],
  evening: [
    "Good evening!",
    "Look at that sky tonight.",
    "Sunset from a hammock. Unbeatable.",
    "Torches are lit. Party's on.",
    "Almost time for dinner on the beach.",
  ],
  night: [
    "Shouldn't you be asleep?",
    "Good night, {town}!",
    "Low tonight: {low}°. Grab a blanket.",
    "Listen to the waves at night.",
    "Hammock sleeping is the best sleeping.",
  ],

  // ---------- by temperature ----------
  hot: [
    "Whew, it's a hot one! {temp}° right now.",
    "Stay hydrated today!",
    "Don't leave pets in the car!",
  ],
  hotDay: [
    "Time for a dip in the water.",
    "Sunscreen. Reapply. Repeat.",
  ],
  hotNight: [
    "Still {temp}° and it's dark out!",
    "Even the night is hot. Time for a moonlight swim.",
  ],
  cold: [
    "Brrr! {temp}° out here.",
    "Layer up today!",
    "Too cold for the beach. I'm staying anyway.",
    "Watch for ice on the roads.",
    "Cold hands, warm heart.",
  ],

  // ---------- after a sip of his coconut drink ----------
  snack: [
    "Ahh. That's the stuff.",
    "Perfectly chilled.",
    "Best drink on the island.",
    "Mmm. Coconut.",
    "Ten out of ten.",
    "Who needs a fridge?",
  ],

  // ---------- Halloween (when the Halloween holiday theme is on) ----------
  halloween: [
    "Happy Halloween!",
    "Trick or treat!",
    "My costume? Tourist.",
    "Coconuts make great jack-o'-lanterns.",
    "Save me some candy, {town}!",
    "Spooky night on the island.",
    "Watch out for little ghosts on the roads tonight!",
  ],
  witch: [
    "Was that… a witch?!",
    "Nice broom!",
    "Happy Halloween to you too!",
    "Fly safe up there!",
  ],

  // ---------- Thanksgiving (when the Thanksgiving holiday theme is on) ----------
  thanksgiving: [
    "Happy Thanksgiving!",
    "Pineapple stuffing. It's a thing.",
    "Somebody save me some pie.",
    "Happy Thanksgiving, {town}!",
  ],
  thanksgivingDay: [
    "Thankful for sunshine and a hammock.",
  ],
  thanksgivingNight: [
    "Thankful for warm nights and a hammock.",
  ],
  geese: [
    "Geese! They know where the warm weather is.",
    "Honk honk! Come on down!",
  ],
};
