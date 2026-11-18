// What the camper says, in the Forest display style. Each group is a list of lines in quotes, separated by commas.
// He picks lines that match the weather, the time of day and the temperature, and never repeats one too soon.
// These words are filled in for you: {temp} (temperature now), {high} and {low} (today's), {town}, {day} (e.g. Friday).
// To add a line, copy an existing one, keep the quotes and the comma at the end, and change the words.
// Any group can have a Day and a Night version next to it (like clear, clearDay and clearNight): lines in clearDay are
// only said by day (sunshine, sunglasses, blue skies…), lines in clearNight only at night (stars, the moon…).
window.TW_CAMP_LINES = {

  // ---------- by the fire in calm weather ----------
  camping: [
    "Nothing beats a campfire.",
    "Golden brown. That's the secret.",
    "Who brought the graham crackers?",
    "Smell that fresh pine air.",
    "No emails out here.",
    "Just me, the trees and the fire.",
    "Best seat in the woods.",
    "A bad day camping beats a good day at work.",
    "Anybody got a ghost story?",
    "Did I pack the bug spray?",
    "Tomorrow: the long trail to the lake.",
    "My boots are still muddy from the hike.",
    "Leave no trace, folks.",
    "Remember to put your fire out properly!",
    "The trick is not to rush the marshmallow.",
    "Signal's terrible out here. I love it.",
    "Pass the hot dogs.",
    "Hiked six miles today. Worth it.",
  ],
  campingNight: [
    "Perfect night for s'mores.",
    "The fire's the only light for miles.",
    "Listen to the crickets.",
  ],
  campingDay: [
    "I could sit here all day.",
    "Perfect afternoon for s'mores.",
  ],

  // ---------- in the tent in bad weather ----------
  tent: [
    "Good thing I packed the tent.",
    "The fire's out. So am I.",
    "Staying dry in here.",
    "Tent's holding up. So far.",
    "Cards, anyone?",
    "Hope my boots dry out by morning.",
  ],

  // ---------- anything, in any weather except storms ----------
  any: [
    "Check the forecast before you hike!",
    "{town}, you're looking good today.",
    "Happy {day}, everybody!",
    "Drink some water today!",
    "Who keeps flying that plane around?",
    "Scroll down for the radar and the tide tables!",
    "Don't forget to call your mom.",
    "Life's better in the woods.",
    "Tell someone your trail plan before you go.",
  ],

  // ---------- by weather ----------
  clear: [
    "Not a cloud in the sky!",
  ],
  clearDay: [
    "It's gonna be a beautiful day!",
    "Sunscreen weather, folks.",
    "Perfect day for a hike.",
    "Sunglasses: on. Worries: off.",
    "Blue skies all day!",
    "Bring a hat today, it's bright out there.",
    "If you're stuck inside today, I'm sorry.",
    "Great day to hit the trail.",
  ],
  clearNight: [
    "Clear night. Look at all those stars!",
    "You can see the Milky Way out here.",
    "Clear skies tonight. It'll be chilly.",
    "Make a wish on a shooting star!",
    "Not a cloud. Just stars and firelight.",
    "There's the Big Dipper!",
    "Cold, clear night. Scoot closer to the fire.",
    "Clear skies. Good night for sleeping under the stars.",
    "I can see my breath tonight.",
    "The stars are out tonight.",
  ],
  partly: [
    "A few clouds, nothing to worry about.",
    "Pretty nice out, all things considered.",
  ],
  partlyDay: [
    "Sun's playing peekaboo today.",
    "Nice mix of sun and clouds.",
    "That cloud looks like a bear. I hope it's a cloud.",
    "Good day for a walk in the woods.",
  ],
  partlyNight: [
    "A few clouds drifting past the moon.",
    "Stars peeking out between the clouds.",
    "Nice night, all things considered.",
    "The moon keeps ducking behind the clouds.",
    "A few stars peeking through the trees.",
  ],
  cloudy: [
    "Bring a light jacket, just in case.",
  ],
  cloudyDay: [
    "No sun today, but no rain either.",
    "Cloudy days are cozy days.",
    "Grey day. Good day for soup.",
    "The sun's taking a day off.",
    "Good hiking weather. Not too hot.",
  ],
  cloudyNight: [
    "No stars tonight. Too cloudy.",
    "Cloudy night. Good thing I've got the fire.",
    "Dark in the woods tonight.",
    "Clouds are keeping it a little warmer tonight.",
    "Pitch dark past the firelight.",
    "Hope it holds off till morning.",
  ],
  fog: [
    "Can't see a thing out here!",
    "Pea soup out here today.",
    "Stay on the trail in this fog!",
    "Drive slow in this fog, folks!",
    "Spooky out here in the fog.",
    "Where did the trees go?",
    "Headlights on if you're driving!",
  ],
  drizzle: [
    "Just a little drizzle.",
    "Don't forget your umbrella!",
    "Bit damp out here.",
    "Roads might be slick today.",
    "A hood will do today, no umbrella needed.",
    "Trails will be muddy today.",
  ],
  rain: [
    "Don't forget your umbrella!",
    "Rain jacket weather.",
    "Puddles everywhere today!",
    "Watch out for slick roads.",
    "Rain, rain, go away…",
    "Perfect weather for a nap.",
    "The rain on the tent is kind of relaxing.",
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
    "Stay off the trails today.",
    "Hope this tent's waterproof!",
  ],
  storm: [
    "When thunder roars, go indoors!",
    "Lightning! Stay away from tall trees.",
    "Stay off the trails in this!",
    "Unplug anything you love.",
    "Count the seconds after the flash!",
    "Not a day for hiking. Or golf.",
  ],
  flurries: [
    "Is that snow?!",
    "A few flakes flying around.",
    "Hot cocoa weather is here.",
    "Snowflakes in the campfire. Pretty.",
    "Bundle up out there!",
  ],
  snow: [
    "Brrr! Bundle up!",
    "Cocoa's the only thing keeping me warm.",
    "Drive slow on the snowy roads.",
    "Check on your neighbors today.",
    "Snowy pines. Like a postcard.",
  ],
  snowDay: [
    "Snow day!",
    "Build a snowman for me!",
  ],
  snowNight: [
    "Snow falling in the firelight. Beautiful.",
    "It'll be a snow day tomorrow!",
  ],
  heavysnow: [
    "Whoa, look at it snow!",
    "Stay off the roads if you can.",
    "Shovel slowly, take breaks!",
    "Keep your pets warm today.",
    "Is the tent still under here?",
    "Somebody bring me another cocoa.",
  ],
  windy: [
    "Hold onto your hat!",
    "Whoa, that gust!",
    "Not a day for umbrellas, they'll fly away.",
    "Secure your trash cans!",
    "Watch for falling branches.",
    "Hold onto the tent!",
    "Listen to those trees creak.",
  ],
  windyNight: [
    "Listen to those pines in the wind tonight.",
    "Windy night. Good thing the tent's staked down.",
  ],

  // ---------- hurricanes and tornadoes: safety first ----------
  hurricane: [
    "Stay safe out there!",
    "Hurricane warning. Please take it seriously.",
    "Listen to local officials.",
    "If they say evacuate, go!",
    "Have water, food and batteries ready.",
    "Charge your phone now.",
    "Don't drive through flooded roads.",
    "Check on your neighbors.",
    "Bring the pets inside.",
    "Camping's cancelled. Get somewhere safe.",
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
    "A tent is not shelter. Get inside a building!",
  ],

  // ---------- by time of day ----------
  morning: [
    "Good morning!",
    "Coffee on the campfire. Perfect.",
    "Nothing beats a sunrise in the woods.",
    "Morning! {high}° today.",
    "Up early to hit the trail.",
    "The birds woke me up again.",
  ],
  afternoon: [
    "Good afternoon!",
    "Trail lunch is the best lunch.",
    "Halfway through {day}!",
    "Time for a nap in the hammock.",
  ],
  evening: [
    "Good evening!",
    "Look at that sky tonight.",
    "Fire's just about perfect now.",
    "Sunsets through the trees are the best.",
    "Time to start dinner.",
  ],
  night: [
    "Shouldn't you be asleep?",
    "Good night, {town}!",
    "Low tonight: {low}°. Grab a blanket.",
    "Hear that owl?",
    "What was that noise?",
    "Ghost story time.",
  ],

  // ---------- by temperature ----------
  hot: [
    "Whew, it's a hot one! {temp}° right now.",
    "Stay hydrated today!",
    "Too hot for a campfire. Not too hot for s'mores.",
    "Don't leave pets in the car!",
  ],
  hotDay: [
    "Hike early, before the heat.",
  ],
  hotNight: [
    "Still {temp}° and it's dark out!",
  ],
  cold: [
    "Brrr! {temp}° out here.",
    "Layer up today!",
    "Good thing I've got this fire.",
    "Watch for ice on the roads.",
    "Cold hands, warm heart.",
    "Thermos of cocoa: essential gear.",
  ],

  // ---------- after eating a marshmallow ----------
  snack: [
    "Perfectly toasted!",
    "Mmm. Another one.",
    "That's the stuff.",
    "Best one yet.",
    "Okay, just one more.",
    "Ten out of ten.",
  ],

  // ---------- Halloween (when the Halloween holiday theme is on) ----------
  halloween: [
    "Happy Halloween!",
    "Trick or treat!",
    "Who wants to hear a ghost story?",
    "Did you hear something in the woods?",
    "Perfect night for a campfire story.",
    "I'm not scared. You're scared.",
    "Marshmallows: the best Halloween candy.",
    "Something's watching from the trees…",
    "Save me some candy, {town}!",
    "Watch out for little ghosts on the roads tonight!",
  ],
  witch: [
    "Was that… a witch?!",
    "Nice broom!",
    "Happy Halloween to you too!",
    "She didn't even wave.",
    "Fly safe up there!",
  ],
  ghost: [
    "Did you see that?!",
    "Nope. Nope nope nope.",
    "I knew these woods were haunted!",
    "Boo to you too!",
  ],
  spider: [
    "That is the biggest spider I've ever seen.",
    "Poor little bat.",
    "I'm sleeping with the tent zipped tonight.",
    "Nope. Nope nope nope.",
  ],
  zombies: [
    "Are those… zombies?!",
    "Nobody make a sound.",
    "They're walking awfully slow. Good.",
    "Do zombies like marshmallows?",
    "Are those skeletons with them?!",
    "Look at those bones go!",
  ],

  // ---------- Thanksgiving (when the Thanksgiving holiday theme is on) ----------
  thanksgiving: [
    "Happy Thanksgiving!",
    "Thankful for a warm fire and a good marshmallow.",
    "Pumpkin pie s'mores. Hear me out.",
    "Somebody save me a drumstick.",
    "I'm thankful the bear stayed away this year.",
    "Leftovers taste better around a campfire.",
    "Happy Thanksgiving, {town}!",
    "I'm stuffed, and I only had marshmallows.",
    "Is that the game on somebody's radio?",
    "Gobble gobble!",
  ],
  geese: [
    "Look at those geese heading south!",
    "Honk honk! Safe travels!",
    "Even the geese are going home for the holidays.",
    "Nice V, geese. Very organized.",
  ],
};
