import { EVENT_ID, EVENT_ID_PP } from "./event";

/**
 * Editorial content for an event's public pages — the About text, FAQ, how to
 * reach the venue, and gallery captions.
 *
 * This used to be scattered as page-local constants: the FAQ was a hardcoded
 * English array shown identically for every event, with refund terms that
 * contradicted the real policy; "how to reach" was typed inside the venue
 * page. Keeping it per event, next to the other fixtures, is what lets a
 * second organizer have their own — and it maps onto a single
 * `event_content` row when the database lands (HANDOFF-TO-BACKEND.md).
 *
 * The refund answer is deliberately absent: the FAQ page renders it from the
 * shared refund tiers so it can never drift from the policy again.
 */
export interface EventFaq {
  q: string;
  a: string;
}

export interface EventContent {
  eventId: string;
  about: string[];
  highlights: string[];
  faqs: EventFaq[];
  howToReach: { mode: string; detail: string }[];
  /** Gallery tiles until real photography is uploaded — one per night, captioned. */
  galleryCaptions: string[];
}

export const eventContent: EventContent[] = [
  {
    eventId: EVENT_ID,
    about: [
      "Nine nights of Garba and Dandiya Raas on the open lawns of Sardar Patel Ground, with live folk orchestras every night and a different theme and dress code each evening.",
      "Passes are sold by zone and by the nights they cover. A Season pass is valid on all nine nights with unlimited re-entry; a Couple pass admits two people on one QR code, so you only show one screen at the gate.",
    ],
    highlights: [
      "Live orchestra and folk singers every night",
      "Separate family enclosure in the General Zone",
      "Food court with 40+ stalls, cashless via the event wallet",
      "Women-only security lane at every gate",
    ],
    faqs: [
      {
        q: "How do I receive my pass?",
        a: "Your QR pass appears on screen the moment payment goes through, and stays in My Passes. It's also sent to your WhatsApp.",
      },
      {
        q: "Can I attend any night with a Season pass?",
        a: "Yes. A Season pass covers every night of the event — come on as many of them as you like.",
      },
      {
        q: "Is re-entry allowed?",
        a: "Yes, re-entry is unlimited while the gates are open. Your pass is scanned out and back in.",
      },
      {
        q: "One QR for a Couple or Family pass — how does entry work?",
        a: "The whole group enters together on one scan. The gate shows how many people the pass admits.",
      },
      {
        q: "What is the dress code?",
        a: "Each night has its own theme and dress code, listed on the night's page. It's checked at the gate.",
      },
      {
        q: "Which gate do I use?",
        a: "Use the gate for your zone — it's printed on your pass. A Gold pass won't open the General gate, and the other way round.",
      },
      {
        q: "What if my payment fails?",
        a: "Nothing is charged and your selection stays in the cart. Try again, or use a different UPI app or card.",
      },
    ],
    howToReach: [
      { mode: "Metro", detail: "Old High Court station, 10 minutes on foot" },
      { mode: "Bus", detail: "AMTS routes 28, 32 and 45 stop at Law Garden" },
      { mode: "Auto / cab", detail: "Drop-off point is Gate 4 on Ellisbridge Road" },
      { mode: "Parking", detail: "4-wheeler parking pass sold as an add-on; two-wheeler parking free near Gate 2" },
    ],
    galleryCaptions: [
      "Opening night aarti",
      "The first circle forms",
      "Dandiya under the lights",
      "Live orchestra stage",
      "Family enclosure",
      "Peacock night colours",
      "Midnight raas",
      "Silver night crowd",
      "Grand finale",
    ],
  },
  {
    eventId: EVENT_ID_PP,
    about: [
      "Three nights of Garba on one open ground in Satellite — no zones, no seating chart, just a pass and the circle.",
      "A Season pass covers all three nights; single-night and couple passes are sold per night if you're only coming for one.",
    ],
    highlights: [
      "One general ground — every ticket gets the same view",
      "Live sound system every night",
      "Couple entry on one QR for Saturday",
      "Short walk from Satellite Road",
    ],
    faqs: [
      {
        q: "How do I receive my pass?",
        a: "Your QR pass appears on screen the moment payment goes through, and stays in My Passes.",
      },
      {
        q: "Can I attend any night with the Season pass?",
        a: "Yes. A Season pass covers all three nights — come to as many as you like.",
      },
      {
        q: "Is re-entry allowed?",
        a: "Yes, re-entry is unlimited while the gates are open.",
      },
      {
        q: "Is there more than one zone?",
        a: "No — this ground sells one general ticket. Every pass enters through the same gate.",
      },
      {
        q: "What if my payment fails?",
        a: "Nothing is charged and your selection stays in the cart. Try again, or use a different UPI app or card.",
      },
    ],
    howToReach: [
      { mode: "Bus", detail: "AMTS Satellite Road stop, 5 minutes on foot" },
      { mode: "Auto / cab", detail: "Drop-off at the main gate on Satellite Road" },
      { mode: "Parking", detail: "Free two-wheeler parking near the gate; limited car parking on the service road" },
    ],
    galleryCaptions: ["Opening night", "Friday raas", "Saturday finale"],
  },
];

export function findEventContent(eventId: string): EventContent | undefined {
  return eventContent.find((c) => c.eventId === eventId);
}
