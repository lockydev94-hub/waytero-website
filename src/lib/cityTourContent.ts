// ============================================================
// Editorial copy for /tours/in/{city}.
//
// These pages are generated from the tour feed, so without copy they were a
// grid of cards and about 300 words of boilerplate — thin enough that Google
// has no reason to rank them above the package pages they link to. The
// content here is written per city and rendered above the grid, with FAQ
// schema, so each page answers the question a searcher actually typed
// ("tour packages from Cuttack", "how far is Puri from Bhubaneswar").
//
// A city with no entry here gets noindex + follow and is left out of the
// sitemap: a card grid alone is not a destination page.
// ============================================================

export interface CityTourContent {
  /** Paragraphs rendered between the hero and the package grid. */
  intro: string[];
  /** Short, factual cards — the things that decide whether a trip works. */
  highlights: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
}

export const CITY_TOUR_CONTENT: Record<string, CityTourContent> = {
  puri: {
    intro: [
      "Puri is where most Odisha itineraries end — one of the four Char Dham towns, home to the Jagannath Temple, and a beach town in the same breath. The temple sits in the middle of the old town behind its wall, the sea is a ten-minute walk south, and Konark's Sun Temple is 35 km up the coast road. Those three together are why a two- or three-day package out of Puri makes sense rather than a day trip.",
      "The town is 60 km from Bhubaneswar on the marine drive, so it works as a base as easily as a destination. Trains from Bhubaneswar take about an hour and a half; by road it is roughly ninety minutes with a stop at Pipili for appliqué work. Our packages from Puri start and end at the town, which means you are not paying for the Bhubaneswar–Puri transfer twice.",
      "Plan around the temple calendar rather than the weather if you can help it. Ratha Yatra in June or July empties the temple and fills the Grand Road with a crowd that is genuinely worth seeing once — but hotels triple and the roads close, so book months ahead or avoid the week entirely. The rest of the year is calm and the sea is at its best between November and February.",
    ],
    highlights: [
      {
        title: "Jagannath darshan",
        text: "The temple opens before dawn and closes late; the queue is shortest in the early morning and longest on weekends and festival days.",
      },
      {
        title: "Konark, 35 km away",
        text: "The Sun Temple is an hour up the coast road and pairs naturally with a Chandrabhaga beach stop on the way back.",
      },
      {
        title: "Chilika at Satapada",
        text: "The dolphin point at the lagoon's mouth is about 50 km from Puri — a half-day trip, best started early.",
      },
    ],
    faqs: [
      {
        question: "How far is Puri from Bhubaneswar?",
        answer:
          "About 60 km, roughly ninety minutes by road on the marine drive, or around an hour and a half by train. Most visitors arrive from Bhubaneswar and use Puri as their base afterwards.",
      },
      {
        question: "How many days do you need in Puri?",
        answer:
          "Two nights covers the temple, the beach and Konark comfortably. Three gives you Chilika or a slower beach day as well; our Puri packages run for three days including Konark.",
      },
      {
        question: "When is the best time to visit Puri?",
        answer:
          "October to February is the most comfortable weather. Ratha Yatra in June or July is spectacular but crowded and expensive, and the monsoon months bring rough seas.",
      },
      {
        question: "Can non-Hindus enter the Jagannath Temple?",
        answer:
          "Only Hindus may enter the temple itself. Visitors of other faiths can see the temple from the Grand Road and the rooftop viewpoints nearby, and the beach and Konark are open to everyone.",
      },
    ],
  },

  cuttack: {
    intro: [
      "Cuttack is Odisha's old capital, 28 km from Bhubaneswar and joined to it by a nearly continuous stretch of road — the two cities function as one urban area, which makes Cuttack an easy starting point for trips that head east rather than south. The Mahanadi and Kathajodi rivers meet here, and the Barabati Fort, the stone revetment along the river and the silver filigree workshops of Balu Bazaar are all within a couple of kilometres of each other.",
      "As a tour base its advantage is direction. Bhitarkanika, the mangrove delta with the state's largest saltwater crocodile population, is roughly 100 km east via Chandbali — closer from Cuttack than from Bhubaneswar, and the reason our mangrove package starts and ends here. The drive out crosses the Mahanadi delta, which is half the point of going.",
      "Cuttack itself rewards half a day: the fort mound and Barabati stadium, the Netaji birthplace museum, and the old lanes around Choudhury Bazaar where filigree is still made by hand. November's Bali Yatra, marking the state's maritime trade with Bali, is the one time the riverbank fills completely.",
    ],
    highlights: [
      {
        title: "28 km from Bhubaneswar",
        text: "Close enough to combine with an airport arrival or a Bhubaneswar hotel — the drive is under an hour outside peak traffic.",
      },
      {
        title: "Bhitarkanika gateway",
        text: "The mangrove national park is about 100 km east via Chandbali, a shorter run from Cuttack than from the capital.",
      },
      {
        title: "Old capital, half a day",
        text: "Barabati Fort, the Netaji museum and the silver filigree lanes of Balu Bazaar sit within a few kilometres of the centre.",
      },
    ],
    faqs: [
      {
        question: "How far is Cuttack from Bhubaneswar?",
        answer:
          "About 28 km, usually 45 minutes to an hour by road. The two cities are effectively contiguous, so a Cuttack stop costs little time on the way in or out of Bhubaneswar.",
      },
      {
        question: "Is Cuttack worth a day on its own?",
        answer:
          "Half a day covers the fort, the Netaji birthplace museum and the filigree workshops. Most visitors treat it as a stop rather than a base unless they are heading to Bhitarkanika.",
      },
      {
        question: "How far is Bhitarkanika from Cuttack?",
        answer:
          "Roughly 100 km east, via Chandbali and Rajkanikanagar. The drive takes three hours or more, so a Bhitarkanika trip needs at least two nights rather than a day return.",
      },
      {
        question: "What is the best time for a Cuttack or Bhitarkanika trip?",
        answer:
          "November to February for both. Bhitarkanika's boat channels are best in the cool months, and the mangrove park closes to visitors during parts of the monsoon.",
      },
    ],
  },

  berhampur: {
    intro: [
      "Berhampur is the biggest city in south Odisha and the natural base for everything below Chilika — Gopalpur-on-Sea is 15 km away, Taptapani's hot springs about 50 km, and the hill country around Daringbadi and the tribal belt of Koraput and Rayagada all start from here. Four of our packages begin in Berhampur for exactly that reason: this is where the roads fan out.",
      "The city sits on NH-16 about 165 km from Bhubaneswar, a three-hour drive, and it has its own railhead on the main Howrah–Chennai line. That makes it a practical start point for travellers coming from Andhra or Kolkata as well as from the capital.",
      "What the packages here share is distance. Nothing on the south Odisha circuit is a quick hop — Daringbadi is roughly 120 km of hill road, Koraput and Rayagada are a long day's drive, and Gopalpur is the only genuinely close one. Spread the trip over three or four days rather than trying to compress it, and treat Berhampur as the place you sleep before and after rather than a sight in itself.",
    ],
    highlights: [
      {
        title: "Gopalpur, 15 km",
        text: "The old port town's beach and lighthouse are a short drive — easy to add to any Berhampur arrival or departure.",
      },
      {
        title: "Taptapani hot springs",
        text: "About 50 km into the hills, a sulphur spring that has been a bathing stop for centuries, usually paired with a Gopalpur night.",
      },
      {
        title: "Tribal belt and hills",
        text: "Daringbadi, Koraput and Rayagada are all long drives from here — plan three to six days, not a day return.",
      },
    ],
    faqs: [
      {
        question: "How far is Berhampur from Bhubaneswar?",
        answer:
          "About 165 km on NH-16, roughly three hours by road. Berhampur also has its own railway station on the main coastal line.",
      },
      {
        question: "Which tours start from Berhampur?",
        answer:
          "Four: the Chilika Lake escape, the Daringbadi hill trip, the Gopalpur and Taptapani beach holiday, and the longer tribal Odisha circuit through Koraput and Rayagada.",
      },
      {
        question: "How far is Gopalpur from Berhampur?",
        answer:
          "About 15 km, a twenty-minute drive. It is the closest of the south Odisha stops and works as a half-day or an overnight.",
      },
      {
        question: "When should I visit Daringbadi?",
        answer:
          "December and January, when the hill station is at its coolest and the coffee and pine country is green. Summers are hot and the monsoon makes the hill roads slow.",
      },
    ],
  },

  rourkela: {
    intro: [
      "Rourkela is Odisha's steel city, in the north-western corner of the state near the Jharkhand border — about 340 km from Bhubaneswar, and a long way from the coastal circuit most visitors do. It is not a tourist town in the usual sense, but it is the right starting point for the western belt: Hirakud, one of the longest earthen dams in the world, is roughly 110 km away at Sambalpur, and the temples and forests around it are best reached from here.",
      "Our package from Rourkela runs four days through Sambalpur, Hirakud, Huma — a temple on a hill above the Mahanadi that leans noticeably off its axis — and Ushakothi's wildlife sanctuary. It is a slower, greener trip than the Puri–Konark run, and it suits travellers who have already seen the coast.",
      "Practically, plan the travel days. Rourkela to Bhubaneswar is five to six hours by road or an overnight train, and Jharsuguda airport about 130 km away, so the sensible shape is to arrive, sleep, and start the circuit the next morning rather than squeezing a drive in on arrival day.",
    ],
    highlights: [
      {
        title: "Hirakud Dam, 110 km",
        text: "One of the world's longest earthen dams, at Sambalpur — the centrepiece of the western Odisha circuit.",
      },
      {
        title: "Huma's leaning temple",
        text: "A Shiva temple tilted off its axis above the Mahanadi, reached by a detour from Sambalpur on the same route.",
      },
      {
        title: "Ushakothi sanctuary",
        text: "A small wildlife sanctuary on the Sambalpur road, usually the last stop before the return to Rourkela.",
      },
    ],
    faqs: [
      {
        question: "How far is Rourkela from Bhubaneswar?",
        answer:
          "About 340 km, five to six hours by road or an overnight train. It is in the north-west of the state, so most itineraries treat it as a separate trip rather than a stop on the coastal route.",
      },
      {
        question: "What does the Rourkela tour cover?",
        answer:
          "Four days through Sambalpur, Hirakud Dam, the Huma temple and Ushakothi sanctuary, starting and ending in Rourkela.",
      },
      {
        question: "Which airport serves Rourkela?",
        answer:
          "Jharsuguda, about 130 km away, has the nearest scheduled flights. Most travellers arrive by train instead, since Rourkela is on the main Howrah–Mumbai line.",
      },
      {
        question: "When is the best time for the Hirakud trip?",
        answer:
          "October to February. The dam is fullest after the monsoon, and the sanctuary and temple roads are at their easiest in the cool months.",
      },
    ],
  },
};

export function cityTourContent(slug: string): CityTourContent | null {
  return CITY_TOUR_CONTENT[slug] ?? null;
}
