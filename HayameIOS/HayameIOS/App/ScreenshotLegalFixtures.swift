#if DEBUG
import Foundation

// DEBUG only: the real Terms of Service and policy documents, copied from
// src/lib/terms.ts and src/lib/legal-docs.ts, so the screenshot routes show
// the text users will read. Generated; when the server copy changes, copy it
// again rather than editing here. Each fixture is the server's JSON reply and
// goes through the same decoding as a live response.
enum ScreenshotLegalFixtures {
    static func legalDocument(_ kind: LegalDocumentKind) -> LegalDocument? {
        let json: String
        switch kind {
        case .protection: json = protectionJSON
        case .cancellation: json = cancellationJSON
        case .privacy: json = privacyJSON
        }
        guard let data = json.data(using: .utf8),
              let envelope = try? JSONDecoder().decode(LegalDocumentEnvelopeDTO.self, from: data) else {
            return nil
        }
        return envelope.data
    }

    static var terms: TermsDTO? {
        guard let data = termsJSON.data(using: .utf8),
              let envelope = try? JSONDecoder().decode(TermsEnvelopeDTO.self, from: data) else {
            return nil
        }
        return envelope.data
    }

    private static let protectionJSON = #"""
{
  "data": {
    "slug": "protection",
    "eyebrow": "Trust and safety",
    "title": "Protection on Hayame",
    "lastUpdated": "10 November 2026",
    "summary": "How Hayame keeps renters, hosts and cars safe: who we verify, how money and deposits are handled, what to do if something goes wrong, and what Hayame does and does not cover.",
    "highlights": [
      {
        "title": "Everyone is checked",
        "body": "Renters send a face photo and both sides of their driving licence before they can pay. Hosts are verified with a government ID before they can list."
      },
      {
        "title": "Money goes through Hayame",
        "body": "You pay securely with Paystack. If the host declines, you are refunded in full."
      },
      {
        "title": "Deposits are protected by evidence",
        "body": "A deposit can only be reduced for a real cost backed by photos, receipts or a report."
      },
      {
        "title": "Hayame is not an insurer",
        "body": "The car is covered by the host's own motor insurance. Hayame does not sell insurance today."
      }
    ],
    "groups": [
      {
        "title": "The basics",
        "questions": [
          {
            "q": "What does protection mean on Hayame?",
            "a": [
              "Protection is the set of checks and rules that make a trip safe for both sides. It covers who is allowed to book and list, how payments and deposits are held, the record we keep of every trip, and the help you get from our team when there is a problem.",
              "It is not an insurance policy. Read \"Is the car insured?\" below so you know exactly where you stand before you drive."
            ]
          },
          {
            "q": "Is Hayame a car rental company?",
            "a": [
              "No. Hayame is a marketplace. Cars belong to their hosts, and the rental agreement for each trip is between the renter and the host. Hayame provides the app, takes the payment, keeps the trip record and steps in to help when the two sides cannot agree."
            ]
          },
          {
            "q": "Is the car insured?",
            "a": [
              "Every host must keep valid motor insurance on the car and confirm with their insurer that it may be hired out. That policy, with its own limits and exclusions, is the cover on the trip.",
              "Hayame does not provide or sell bundled insurance at the moment. If a listing shows an insurance amount at checkout, that is set by the host and described on the listing. If you need more cover, ask the host in the chat before you book, or speak to your own insurer.",
              "Whatever cover exists may not apply if the rules are broken, for example if someone other than the verified renter drives, or the car is used as a taxi or driven after drinking. In that case the renter carries the full cost."
            ]
          }
        ]
      },
      {
        "title": "Verification",
        "questions": [
          {
            "q": "Why do I have to send a photo of my face and my driving licence?",
            "a": [
              "Hosts are handing over a valuable car. Before your first booking we check that you are a real person, that you hold a valid licence, and that the person collecting the car is the person who booked it.",
              "You send three photos: your face, and the front and back of your licence. Our team reviews them, usually within a few hours, and emails you as soon as you are approved. You only do this once, unless your licence expires or we need to check again."
            ]
          },
          {
            "q": "Who can see my licence and face photo?",
            "a": [
              "Only the Hayame team members who review verifications. They are stored privately and are never shown to hosts or other users."
            ]
          },
          {
            "q": "How are hosts checked?",
            "a": [
              "Anyone who wants to list a car applies with a government-issued ID and their details, and is approved by our team before their first listing. Every car listing is also reviewed before it appears. Verified hosts are marked on their profile and listings."
            ]
          },
          {
            "q": "Can I book a car for someone else to drive?",
            "a": [
              "No. The person who books is the person who drives. You may not rent on behalf of another person or hand the car to anyone else. A second driver is only allowed if the host agrees to that named person in the Hayame chat before they drive, and that person has their own verified Hayame account.",
              "Hosts are asked to check that the person collecting the car matches the booking and their licence, and to refuse the handover if they do not."
            ]
          }
        ]
      },
      {
        "title": "Payments and deposits",
        "questions": [
          {
            "q": "Is it safe to pay through the app?",
            "a": [
              "Yes. Payments are processed by Paystack, by mobile money, card or bank transfer. Your card details are entered on Paystack's secure page and are never stored by Hayame.",
              "Always pay inside Hayame. If someone asks you to pay them directly, by cash or mobile money outside the app, decline and report it. A trip paid for outside Hayame has no deposit handling, no refund rights and no support from us."
            ]
          },
          {
            "q": "What happens to my money if the host says no?",
            "a": [
              "Unless a listing offers instant booking, the host has to accept your request. If the host declines or does not respond, you are refunded in full, including the deposit."
            ]
          },
          {
            "q": "What is the refundable deposit for?",
            "a": [
              "Some listings include a security deposit. It is shown as its own line before you pay. It is there to cover real costs that come up from the trip, such as new damage, missing fuel, a late return, heavy cleaning, or a traffic fine or toll.",
              "If nothing is owed, the whole deposit comes back to you after the trip. If you cancel before the trip, the deposit is always returned in full."
            ]
          },
          {
            "q": "Can a host keep my deposit for no reason?",
            "a": [
              "No. A deduction has to be for a real cost and supported by evidence: handover and return photos, a receipt or repair quote, a fine notice or a police report. If you disagree, open a dispute in the app and our team will look at what both sides have provided before anything is decided."
            ]
          }
        ]
      },
      {
        "title": "During the trip",
        "questions": [
          {
            "q": "What should I do at pick-up and return?",
            "a": [
              "Walk around the car with the host and take clear photos of every side, the inside, the fuel gauge and the mileage. Do the same at return. Photos taken at handover are the best protection either side has: if there is a disagreement later, they are the first thing our team asks for.",
              "Check that you have the spare tyre and tools, that the lights and brakes work, and that the car matches the listing. If something is wrong, tell the host in the chat before you drive away so there is a record."
            ]
          },
          {
            "q": "What do I do if there is an accident?",
            "a": [
              "Make sure everyone is safe first. In an emergency call 112, or the police on 191, the fire service on 192 or an ambulance on 193.",
              "Then tell the host and Hayame straight away through the app. Report to the Ghana Police Service where anyone is hurt, another vehicle or property is involved, or the law requires it, and get a police report. Take photos of the scene, the vehicles and any other driver's details. Do not admit fault, do not leave the car, and do not arrange repairs yourself."
            ]
          },
          {
            "q": "What if the car breaks down?",
            "a": [
              "Stop somewhere safe and message the host in the app. A fault that existed before the trip, or ordinary mechanical failure, is the host's responsibility, and the host should arrange help or a replacement. If the trip cannot continue through no fault of yours, contact us and we will help you with a fair refund for the unused days.",
              "Damage caused by how the car was driven, for example driving through flood water or on a road the car is not suited to, is the renter's responsibility."
            ]
          },
          {
            "q": "What if the car is stolen?",
            "a": [
              "Report it to the police immediately and tell the host and Hayame through the app. Keep the keys and give them to the host. Cars on Hayame may be fitted with a tracker, which the host and Hayame can use to help recover the car."
            ]
          },
          {
            "q": "Who pays for traffic fines, tolls and towing?",
            "a": [
              "The renter pays any fine, toll, parking charge, towing or impound fee that arises during the trip, even if the notice arrives after the trip has ended."
            ]
          },
          {
            "q": "Who pays if the car is damaged?",
            "a": [
              "From handover until return, the renter is responsible for the car. The renter pays for new damage and for reasonable recovery costs, except where the host's insurance pays, or where the damage was caused by the host or by a fault that was already there.",
              "Normal wear, such as light stone chips or tyre wear from ordinary driving, is not damage."
            ]
          }
        ]
      },
      {
        "title": "For hosts",
        "questions": [
          {
            "q": "How is my car protected when I host?",
            "a": [
              "Every renter is verified with a face photo and driving licence before they can pay. You see who is booking, you can accept or decline requests (unless you choose instant booking), and you can ask questions in the chat first.",
              "You can set a security deposit on your listing, a surcharge for trips outside your region, and your own cancellation policy. Payment is collected before the trip, and the trip record, messages and photos are kept so that a claim can be reviewed fairly."
            ]
          },
          {
            "q": "What do I need to have in place before I list?",
            "a": [
              "You must own the car or have the owner's written permission, and it must be registered, roadworthy and insured for hire. Keep your documents current, service the car, and describe it honestly. At handover, check the renter's face and licence against the booking and take photos together."
            ]
          },
          {
            "q": "A renter returned my car damaged or late. What do I do?",
            "a": [
              "Take photos straight away, message the renter in the chat, and open a dispute in the app within 24 hours of the trip ending. Add your handover photos, the return photos and any quote or receipt. Our team will review both sides and decide how the deposit is applied. If the cost is more than the deposit, the renter still owes the balance."
            ]
          }
        ]
      },
      {
        "title": "Disputes and support",
        "questions": [
          {
            "q": "How do I report a problem?",
            "a": [
              "Message the other person in the Hayame chat first; most issues are settled there. If that does not work, open a dispute from the booking, or contact support. Report trip problems within 24 hours of the trip ending so the evidence is fresh."
            ]
          },
          {
            "q": "How does Hayame decide a dispute?",
            "a": [
              "We look at the booking, the messages, the handover and return photos, and any receipts, quotes or reports from both sides. We may ask either of you for more information. Decisions about deposits are based on that evidence, and we tell both sides the outcome."
            ]
          },
          {
            "q": "What is Hayame not responsible for?",
            "a": [
              "Hayame does not own or inspect the cars and cannot guarantee the condition of a vehicle or the behaviour of any user. We are not an insurer and do not pay for damage, injury, theft or loss arising from a trip. Our responsibility is to run the platform properly, handle payments and deposits as described, and deal with reports fairly. The full detail is in our Terms of Service."
            ]
          }
        ]
      }
    ],
    "contact": "Need help now? Use Help in the app or email support@hayamegh.com. In an emergency call 112 first."
  }
}
"""#

    private static let cancellationJSON = #"""
{
  "data": {
    "slug": "cancellation",
    "eyebrow": "Booking policy",
    "title": "Cancellation Policy",
    "lastUpdated": "10 November 2026",
    "summary": "What you get back when a trip is cancelled, and when. Each listing uses one of three policies, shown before you pay.",
    "highlights": [
      {
        "title": "Your deposit always comes back",
        "body": "If you cancel before the trip, the refundable deposit is returned in full, whatever the policy."
      },
      {
        "title": "Full refund until the host accepts",
        "body": "Cancel while your request is still waiting for the host and you get everything back."
      },
      {
        "title": "Host cancels or declines: full refund",
        "body": "You are never charged for a trip the host does not honour."
      },
      {
        "title": "Earlier is better",
        "body": "The more notice you give, the more of the trip price you get back."
      }
    ],
    "table": {
      "title": "Refund of the trip price when a renter cancels a confirmed booking",
      "caption": "The trip price is everything you paid except the deposit. Notice is counted to the start of your pick-up day (12:00 am, Ghana time).",
      "columns": [
        "Policy",
        "Full refund",
        "Half refund",
        "No refund"
      ],
      "rows": [
        [
          "Flexible",
          "24 hours or more before",
          "Less than 24 hours before",
          "Does not apply"
        ],
        [
          "Moderate",
          "3 days or more before",
          "Between 24 hours and 3 days before",
          "Less than 24 hours before"
        ],
        [
          "Strict",
          "Does not apply",
          "7 days or more before",
          "Less than 7 days before"
        ]
      ]
    },
    "groups": [
      {
        "title": "How it works",
        "questions": [
          {
            "q": "Where do I see which policy applies to my trip?",
            "a": [
              "Every listing shows its policy: Flexible, Moderate or Strict. You see it on the listing and again on the review step before you pay. The policy that applied when you booked is the one that applies to your trip, even if the host changes the listing later. Listings use Moderate unless the host chooses otherwise."
            ]
          },
          {
            "q": "How do I cancel a booking?",
            "a": [
              "Open the trip in Trips and choose Cancel. Cancelling in the app is what counts: a message to the host on its own does not cancel the booking."
            ]
          },
          {
            "q": "How is my refund worked out?",
            "a": [
              "Your payment has two parts. The refundable deposit, if the listing has one, is always returned in full. The rest, which we call the trip price (rental, service fee and any delivery, insurance or outside-region charge), is refunded in full, by half or not at all, depending on the listing's policy and how much notice you give. The table above shows each case."
            ]
          },
          {
            "q": "From when is the notice period counted?",
            "a": [
              "From the moment you cancel in the app to the start of your pick-up day, which is 12:00 am Ghana time on the pick-up date, not your pick-up hour. For example, for a pick-up on Saturday, \"24 hours before\" means before 12:00 am on Friday."
            ]
          },
          {
            "q": "Can you show me an example?",
            "a": [
              "You book a car on a Moderate policy and pay GHS 1,500: GHS 1,000 trip price and a GHS 500 deposit.",
              "Cancel 5 days before: you get GHS 1,500 back. Cancel 2 days before: you get GHS 1,000 back (the full deposit and half the trip price). Cancel on the morning of pick-up: you get the GHS 500 deposit back."
            ]
          }
        ]
      },
      {
        "title": "Before the trip",
        "questions": [
          {
            "q": "I sent a request but the host has not accepted yet. Can I cancel for free?",
            "a": [
              "Yes. Until the host accepts, you can cancel and receive a full refund of everything you paid, whichever policy the listing uses."
            ]
          },
          {
            "q": "What if the host declines or does not reply?",
            "a": [
              "You are refunded in full automatically. You do not need to do anything."
            ]
          },
          {
            "q": "What if the host cancels a booking they already accepted?",
            "a": [
              "You receive a full refund, including the deposit, and we will help you find another car. Hosts who cancel confirmed trips may be charged a fee and can be removed from Hayame if it keeps happening."
            ]
          },
          {
            "q": "Can I change my dates instead of cancelling?",
            "a": [
              "Message the host first. If they are happy with the new dates, contact support before you cancel, so we can help you move the booking without losing money under the cancellation policy. To add days to a trip that is already confirmed, book the extra days as soon as you know, because another renter may take them."
            ]
          },
          {
            "q": "I could not complete my identity check in time. Do I lose my money?",
            "a": [
              "No. You cannot pay until your identity check is approved, so no money is taken for a booking you were not allowed to make. Your selections are saved and you can finish the booking once you are approved, if the dates are still free."
            ]
          }
        ]
      },
      {
        "title": "On the day and during the trip",
        "questions": [
          {
            "q": "What if I do not turn up?",
            "a": [
              "A no-show is treated as a cancellation made with less than 24 hours' notice. The same applies if you arrive without your valid driving licence, or if the person who arrives is not the verified renter on the booking, because the host must refuse the handover. Your deposit is still returned."
            ]
          },
          {
            "q": "The car is not as described, or the host did not show up. What now?",
            "a": [
              "Do not start the trip. Take photos, message the host in the app, and contact support straight away. If the car is unsafe, materially different from the listing, or not made available, you are entitled to a full refund."
            ]
          },
          {
            "q": "Can I cancel after the trip has started?",
            "a": [
              "A trip that has started cannot be cancelled in the app. If you need to end it early, tell the host and contact support. Unused days are not refunded automatically; any refund depends on the reason and on what the host agrees. If the trip ends early because of a fault with the car that was not your doing, we will help you get a fair refund for the unused days."
            ]
          },
          {
            "q": "What about things nobody can control, like serious illness, flooding or a road closure?",
            "a": [
              "Tell the host and contact support as early as you can, with whatever proof you have. We look at these cases one by one and will ask the host to agree to a fair outcome. The standard policy applies unless we confirm otherwise."
            ]
          }
        ]
      },
      {
        "title": "Getting your money back",
        "questions": [
          {
            "q": "How and when will I receive my refund?",
            "a": [
              "Refunds go back to the payment method you used, through Paystack. We send the refund as soon as the cancellation is confirmed. Mobile money refunds usually arrive quickly; card and bank refunds can take up to 10 working days to show, depending on your bank. You will receive an email receipt for every refund."
            ]
          },
          {
            "q": "Is the Hayame service fee refunded?",
            "a": [
              "The service fee is part of the trip price, so it is refunded in the same proportion: in full with a full refund, by half with a half refund."
            ]
          },
          {
            "q": "My refund has not arrived. What should I do?",
            "a": [
              "Check the refund receipt email for the date and reference, then allow the time above. If it still has not arrived, contact support with the booking reference and we will trace it with Paystack."
            ]
          }
        ]
      },
      {
        "title": "For hosts",
        "questions": [
          {
            "q": "Which policy should I choose for my listing?",
            "a": [
              "Flexible attracts the most bookings and suits cars that are easy to re-book. Moderate is the balanced default. Strict gives you the most certainty and suits high-demand cars or long trips, but some renters will choose another car. You set the policy when you create or edit a listing."
            ]
          },
          {
            "q": "What do I receive when a renter cancels?",
            "a": [
              "The part of the trip price that is not refunded to the renter stays with the booking and is paid out to you in the usual way, less Hayame's fee. If the renter receives a full refund, there is no payout for that booking."
            ]
          },
          {
            "q": "What happens if I have to cancel?",
            "a": [
              "Cancel in the app as early as possible and message the renter. The renter is refunded in full. Because a cancelled trip can leave someone stranded, repeated host cancellations affect your standing and can lead to fees or removal. If you cancel because the renter broke the rules, for example the wrong person arrived, tell support so it is not counted against you."
            ]
          }
        ]
      }
    ],
    "contact": "Questions about a cancellation or refund? Use Help in the app or email support@hayamegh.com with your booking reference."
  }
}
"""#

    private static let privacyJSON = #"""
{
  "data": {
    "slug": "privacy",
    "eyebrow": "Your data",
    "title": "Privacy at Hayame",
    "lastUpdated": "10 November 2026",
    "summary": "Plain answers about what Hayame knows about you, why, who sees it, how long we keep it and how to take control. This is a guide to our full Privacy Policy, which is the legal document and is published in full at hayamegh.com/privacy.",
    "highlights": [
      {
        "title": "We do not sell your data",
        "body": "No advertising networks, no data brokers, no tracking you across other apps or websites."
      },
      {
        "title": "Your ID photos stay private",
        "body": "Licence and face photos are seen only by the Hayame team that reviews them. Never by hosts or other users."
      },
      {
        "title": "We never see your card",
        "body": "Card and bank details go straight to Paystack. Hayame only keeps the amount, status and reference."
      },
      {
        "title": "Analytics only if you say yes",
        "body": "Usage analytics is off until you accept it, and you can switch it off again at any time."
      }
    ],
    "groups": [
      {
        "title": "What we collect",
        "questions": [
          {
            "q": "What information does Hayame collect about me?",
            "a": [
              "Account details: your name, email address, phone number and password.",
              "Verification documents: before your first booking, a photo of your face and of the front and back of your driving licence. If you apply to host, a government-issued ID.",
              "Trip information: the cars you view, save and book, your trip dates, the pick-up, delivery or trip area you give us, your booking history and reviews.",
              "Messages: what you and the other party write in the Hayame chat, and what you send to support.",
              "Payment records: the amount, status and reference of each payment. Not your card or bank details.",
              "Device information: an account ID, your device type and app version, and a push notification token so we can send you alerts."
            ]
          },
          {
            "q": "Why do you need my driving licence and a photo of my face?",
            "a": [
              "To confirm that you are who you say you are, that you are licensed to drive, and that the person collecting the car is the person who booked it. Hosts are trusting you with their car, and this check is what makes that possible. Without it we cannot let you book."
            ]
          },
          {
            "q": "Does Hayame track my location?",
            "a": [
              "We use the city or area you type in to show you nearby cars. On Android, and only if you give permission, the app can use your phone's location to improve those results; you can turn that off in your phone's settings at any time. The iPhone app does not ask for your location.",
              "Separately, a car you rent may have a GPS tracker fitted by its host. During a trip, the host and Hayame may use it to locate and recover the car. That is the car's location, not your phone's."
            ]
          },
          {
            "q": "Does Hayame use my camera and photos?",
            "a": [
              "Only when you choose to take or pick a photo: for your profile picture, your verification photos, or pictures of a car you are listing. The app has no access to your camera or photo library at any other time."
            ]
          },
          {
            "q": "Do you store my card or mobile money details?",
            "a": [
              "No. You enter them on Paystack's secure checkout, and they go to Paystack, not to us. We keep only the record of the payment so we can manage your booking, refunds and disputes."
            ]
          }
        ]
      },
      {
        "title": "How we use it",
        "questions": [
          {
            "q": "What do you use my information for?",
            "a": [
              "To create and secure your account; to make bookings, payments, refunds, messages and reviews work; to verify identities and prevent fraud and unsafe activity; to send you updates about your bookings and account; to give you support; to understand how the service is used so we can fix and improve it; and to meet our legal, tax and accounting duties."
            ]
          },
          {
            "q": "Do you sell my data or use it for advertising?",
            "a": [
              "No. We do not sell your personal information, we do not share it with advertising networks or data brokers, and we do not track you across other companies' apps or websites. The iPhone app does not use Apple's advertising identifier."
            ]
          },
          {
            "q": "What is the analytics choice I was asked about?",
            "a": [
              "With your permission, we record how the service is used: which pages and cars are viewed, what is searched for, and where a booking is abandoned. To do that we store a random identifier on your device. It is not your name, your email or an advertising ID, and it is not shared with anyone.",
              "Nothing is recorded until you accept. Saying no does not limit any feature. You can change your mind at any time in Profile, under Privacy, and turning it off deletes the identifier."
            ]
          },
          {
            "q": "Does Hayame read my messages?",
            "a": [
              "Not routinely. Messages are stored so that both sides have a record of what was agreed. Our team may review a conversation when there is a report, a dispute, or a safety or fraud concern."
            ]
          },
          {
            "q": "Are decisions about me made by a computer?",
            "a": [
              "No decision that seriously affects you is made by a machine alone. Your verification photos are reviewed by a person, and suspending or closing an account always involves a person."
            ]
          }
        ]
      },
      {
        "title": "Who sees it",
        "questions": [
          {
            "q": "What does the host or renter on the other side see?",
            "a": [
              "Only what is needed for the trip: your name and profile photo, the booking details, the messages you send them, and a contact number where it is needed for handover. They never see your licence, your ID, your payment details or your email password."
            ]
          },
          {
            "q": "Which companies help Hayame run the service?",
            "a": [
              "Supabase stores our database and files and handles sign-in. Paystack processes payments. Resend sends our emails. Apple and Google deliver push notifications. Each of them works under a written agreement, may only use your data to provide that service to us, and must keep it secure."
            ]
          },
          {
            "q": "Would you ever give my information to the police or anyone else?",
            "a": [
              "Only where the law requires it, for example under a valid legal request, or where it is needed to protect someone's safety, to investigate fraud, or to recover a vehicle. If Hayame were ever sold or merged, your information would move with the service under the same protections."
            ]
          },
          {
            "q": "Is my data sent outside Ghana?",
            "a": [
              "Hayame operates from Ghana, but some of the companies above store and process data in other countries. Where the law requires, we put safeguards in place so your information keeps the same protection. You can ask us for details."
            ]
          }
        ]
      },
      {
        "title": "Keeping it safe",
        "questions": [
          {
            "q": "How is my information protected?",
            "a": [
              "Data is encrypted while it travels between your phone and our servers. Access is restricted so that each user can only reach their own records, and verification documents are kept in private storage that only authorised team members can open. No system is perfectly secure, but we treat your data as we would want ours treated."
            ]
          },
          {
            "q": "How long do you keep my information?",
            "a": [
              "Account details: while your account is open, and deleted within 30 days of closing it.",
              "Booking and payment records: as long as Ghanaian tax and accounting law requires, generally up to six years.",
              "Licence, face photo and host ID: only as long as needed to keep you verified and meet our legal and fraud-prevention duties, then securely deleted.",
              "Messages, reviews and support requests: while they are needed to run the service and settle disputes.",
              "Analytics events: up to 400 days."
            ]
          }
        ]
      },
      {
        "title": "Your choices and rights",
        "questions": [
          {
            "q": "What rights do I have over my data?",
            "a": [
              "Under Ghana's Data Protection Act, 2012 (Act 843), and similar laws elsewhere, you can ask for a copy of the information we hold about you, ask us to correct it, ask us to delete it, object to or restrict certain uses, and withdraw any consent you have given. We will not treat you differently for using these rights."
            ]
          },
          {
            "q": "How do I see, correct or download my information?",
            "a": [
              "You can edit your name, phone number, city and photo in your profile at any time. For a copy of everything else, or to correct something you cannot change yourself, email support@hayamegh.com from the address on your account. We reply as quickly as we can, and always within the time the law allows."
            ]
          },
          {
            "q": "How do I delete my account?",
            "a": [
              "Open More in the app and choose Delete account, or email us from the address on your account. We delete your account information within 30 days. We must keep some records, such as past payments, for as long as the law requires, and we cannot close an account that has an active trip or money owing until that is settled."
            ]
          },
          {
            "q": "How do I stop notifications or emails?",
            "a": [
              "You can choose which push notifications you receive in the app's notification settings, or switch them off in your phone's settings. Emails about your bookings, payments and account security are part of the service and cannot be switched off while you have an account."
            ]
          },
          {
            "q": "Can children use Hayame?",
            "a": [
              "No. Hayame is for adults aged 18 and over. We do not knowingly collect information from anyone under 18, and we delete it if we learn that we have."
            ]
          },
          {
            "q": "Who do I contact with a privacy question or complaint?",
            "a": [
              "Email support@hayamegh.com and we will do our best to put it right. If you are not satisfied, you may complain to the Data Protection Commission of Ghana."
            ]
          },
          {
            "q": "Will this change?",
            "a": [
              "If we change how we handle your information in an important way, we will update the Privacy Policy, change the date at the top, and tell you in the app or by email before the change takes effect."
            ]
          }
        ]
      }
    ],
    "contact": "Privacy questions: support@hayamegh.com. The full legal Privacy Policy is at hayamegh.com/privacy."
  }
}
"""#

    private static let termsJSON = #"""
{
  "data": {
    "version": "2026-11-10",
    "title": "Terms of Service",
    "lastUpdated": "10 November 2026",
    "sections": [
      {
        "title": "1. Your agreement with Hayame",
        "paragraphs": [
          "Hayame is an online marketplace, operated by Hayame Technologies in Ghana, where car owners (hosts) list vehicles and other people (renters) book them. These terms are a binding agreement between you and Hayame. By tapping Accept, creating an account, listing a car or booking a trip, you agree to them, together with our Privacy Policy, Cancellation Policy and Protection information.",
          "If you do not agree, you may not use Hayame. If you use Hayame for a company or another organisation, you confirm that you are allowed to accept these terms on its behalf."
        ]
      },
      {
        "title": "2. Who can use Hayame",
        "paragraphs": [
          "You must be at least 18 years old and legally able to enter into a contract. To rent a car you must also hold a valid, unexpired driving licence that allows you to drive that type of vehicle in Ghana, and you must not be disqualified from driving.",
          "We may refuse, suspend or close any account, and decline any booking, where we believe there is a safety, fraud or legal risk."
        ]
      },
      {
        "title": "3. Your account and identity checks",
        "paragraphs": [
          "The information you give us must be true, current and your own. You may hold one account only, and you must keep your password and phone secure. You are responsible for everything done through your account.",
          "Before your first booking we ask for a photo of your face and photos of the front and back of your driving licence, and we must approve them before you can pay for a trip. Hosts are verified with a government-issued ID. Submitting documents that are false, altered, expired or belong to someone else is a serious breach of these terms and may be reported to the police.",
          "You agree that we may check your details, ask for more information at any time, and repeat these checks when a licence expires or something about your account changes."
        ]
      },
      {
        "title": "4. How bookings work",
        "paragraphs": [
          "When a booking is confirmed, the rental agreement is between the renter and the host. Hayame is not a car rental company, does not own the vehicles and is not a party to that agreement. We provide the platform, collect payment, and help both sides when something goes wrong.",
          "A booking is confirmed when it is paid and, unless the listing offers instant booking, accepted by the host. If the host declines or does not respond in time, the renter is refunded in full. Dates, pick-up or delivery details, the area where the car will be driven and the price shown at checkout form part of the booking."
        ]
      },
      {
        "title": "5. Only you may drive: no renting for someone else",
        "paragraphs": [
          "The person who books is the person who drives. You may not book a car on behalf of another person, and you may not rent, lend, hand over, sub-let or otherwise pass the car to anyone else, whether or not they pay you.",
          "Nobody else may drive the car unless the host has agreed to that named person in the Hayame chat before they drive, and that person holds their own verified Hayame account and a valid driving licence. You remain fully responsible for the car and for anything an additional driver does.",
          "The host must hand the keys only to the verified renter shown on the booking, after checking that the person and their driving licence match. If someone else arrives, the host should refuse the handover and tell Hayame.",
          "Where a listing comes with a driver, only the host's driver may drive, and the renter may not take the wheel.",
          "If a car is found being driven by an unauthorised person, the trip may be ended immediately without refund, the car may be recovered at the renter's cost, any protection may not apply, and the renter is liable for all resulting loss."
        ]
      },
      {
        "title": "6. Payments, fees and the deposit",
        "paragraphs": [
          "Prices are in Ghana cedis (GHS). Payment is taken at checkout through our payment partner, Paystack, by mobile money, card or bank transfer. The total shown before you pay includes the rental price, the Hayame service fee and, where they apply, insurance, delivery, an outside-region surcharge and a refundable deposit.",
          "The deposit is returned after the trip, less any amounts owed under these terms, for example for damage, missing fuel, late return, cleaning, traffic fines, tolls or towing. If the deposit does not cover what is owed, you agree to pay the balance when we ask for it.",
          "All payments for a trip must be made through Hayame. Hosts are paid for completed trips after Hayame's fee is deducted. You are responsible for any taxes that apply to the money you earn or pay."
        ]
      },
      {
        "title": "7. Cancellations and refunds",
        "paragraphs": [
          "Each listing shows its cancellation policy (flexible, moderate or strict). If a renter cancels, the refund follows that policy and depends on how close to pick-up the cancellation is made. If a host cancels a confirmed booking, the renter is refunded in full and the host may be charged a fee or removed from Hayame for repeated cancellations.",
          "If the renter does not arrive, arrives without their valid driving licence, or is not the verified person on the booking, the host may refuse the handover and the booking is treated as a late cancellation by the renter. Refunds go back to the original payment method and may take several working days to appear."
        ]
      },
      {
        "title": "8. How the car may be used",
        "paragraphs": [
          "You must drive carefully, obey the road traffic laws of Ghana, wear seat belts, and carry no more passengers than the car has seats. The car must stay within the area stated in the booking; trips outside the listing's region carry the surcharge shown at checkout and must be declared when you book.",
          "You must not use or allow the car to be used: (a) by anyone under the influence of alcohol or drugs; (b) for any unlawful purpose; (c) as a taxi, for ride-hailing, deliveries or to carry passengers or goods for payment, unless the host has agreed in the Hayame chat; (d) for racing, speed testing, driving lessons, off-road driving or on roads not suitable for the car; (e) to tow or push anything; (f) to carry dangerous, illegal or strongly smelling goods; (g) outside Ghana; or (h) in any way that overloads or damages it.",
          "You must not smoke in the car, carry animals without the host's agreement, remove or tamper with any tracker, odometer, number plate or other part, make repairs or changes without the host's agreement, or leave the car unlocked or with the keys inside."
        ]
      },
      {
        "title": "9. Pick-up, return, fuel and condition",
        "paragraphs": [
          "At pick-up and at return, both renter and host should inspect the car together and take clear, dated photos of its outside, inside, fuel level and mileage. These photos are the main evidence if there is a disagreement, so a party who takes none may find it hard to prove their case.",
          "The renter must return the car on time, to the agreed place, in the same condition (allowing for normal wear), reasonably clean and with the same amount of fuel. To keep the car longer you must ask for and receive an extension through Hayame before the booking ends. Keeping a car past the end of the booking without agreement is a serious breach: late fees apply, any protection may stop, and the car may be reported to the police as taken without consent.",
          "The host must provide the car on time, clean, roadworthy, with enough fuel to reach a filling station, and as described in the listing."
        ]
      },
      {
        "title": "10. Accidents, damage, theft and breakdowns",
        "paragraphs": [
          "From handover until the car is returned to the host, the renter is responsible for it. If there is an accident, damage, theft, fire or breakdown, you must make sure everyone is safe, then immediately tell the host and Hayame through the app, and report to the Ghana Police Service where the law requires it or where anyone is injured, another vehicle or property is involved, or the car is stolen. You must obtain a police report and give us and the host every reasonable help, including statements and photos.",
          "Do not admit fault to others, abandon the car or arrange repairs yourself. The renter is liable for loss of or damage to the car during the trip, for the cost of recovery and towing, and for the host's reasonable loss of income while the car is repaired, except to the extent the loss is paid by insurance or was caused by the host or a fault that existed before the trip."
        ]
      },
      {
        "title": "11. Fines, tolls and other charges",
        "paragraphs": [
          "The renter must pay all tolls, parking charges, traffic fines, penalties, towing and impound fees incurred during the trip, including those that arrive after the trip has ended. If the host or Hayame pays any of these, the renter must repay them together with any reasonable administration cost."
        ]
      },
      {
        "title": "12. Insurance and protection",
        "paragraphs": [
          "Hayame is not an insurance company. Any cover on a trip is the insurance the host holds on the vehicle, together with any insurance or protection item shown at checkout, and is subject to the terms, limits and exclusions of that policy. Cover may not apply where these terms are broken, for example where an unauthorised person drives or the car is used in a prohibited way, and the renter then bears the full loss.",
          "Hosts must keep valid motor insurance that permits the vehicle to be hired out, and are responsible for confirming this with their insurer."
        ]
      },
      {
        "title": "13. If you are a host",
        "paragraphs": [
          "You confirm that you own each car you list or have the owner's written permission to hire it out, and that it is registered with the DVLA, has a valid roadworthiness certificate and insurance, is safe, well maintained and free of any recall or defect you know about.",
          "Your listing, photos, price, features and availability must be accurate and kept up to date. You must honour confirmed bookings, respond to requests promptly, hand over only to the verified renter, and treat renters fairly and without unlawful discrimination. You are responsible for your own car and for meeting any licensing, tax and legal duties that apply to hiring it out."
        ]
      },
      {
        "title": "14. Keep it on Hayame",
        "paragraphs": [
          "You may not ask for or accept payment outside Hayame for a trip found on Hayame, or use Hayame to find people and then arrange the rental privately. Off-platform arrangements have no protection, no deposit handling and no support from us, and may lead to your account being closed."
        ]
      },
      {
        "title": "15. Respect, messages and reviews",
        "paragraphs": [
          "Treat other users with respect. You may not harass, threaten, deceive or discriminate against anyone, post false or misleading content, or use Hayame to send spam. Reviews must be honest and based on a real trip. We may review messages and trip records to investigate a report, resolve a dispute or keep users safe, and we may remove content that breaks these terms."
        ]
      },
      {
        "title": "16. Vehicle tracking and your data",
        "paragraphs": [
          "Vehicles on Hayame may be fitted with GPS or other tracking devices, and you agree that the host and Hayame may use them during a trip to locate and recover the car and to investigate a breach of these terms. We handle personal data, including your identity documents, as described in our Privacy Policy and in line with Ghana's Data Protection Act, 2012 (Act 843)."
        ]
      },
      {
        "title": "17. Suspension and ending this agreement",
        "paragraphs": [
          "You may stop using Hayame and ask us to close your account at any time, once you have no active trips or amounts owing. We may suspend or close your account, cancel bookings or remove listings if you break these terms, fail a verification check, put others at risk, or where the law requires it. Amounts you owe, and terms that by their nature should continue, remain in force after your account is closed."
        ]
      },
      {
        "title": "18. Hayame's responsibility",
        "paragraphs": [
          "We work to keep Hayame safe and reliable, but we do not own, inspect or control the vehicles, and we do not guarantee the conduct of any host or renter, the condition or legality of any car, or that the service will always be available or free of errors. You use Hayame and any vehicle at your own risk.",
          "To the fullest extent the law allows, Hayame is not liable for indirect or consequential loss, loss of profit or loss of data, and our total liability to you for any claim connected with a booking is limited to the Hayame service fee paid on that booking. Nothing in these terms limits liability that cannot lawfully be limited, including for death or personal injury caused by our negligence, or for fraud.",
          "You agree to compensate Hayame for losses and reasonable costs we suffer because you broke these terms or the law, or because of how you used a vehicle."
        ]
      },
      {
        "title": "19. Disputes and governing law",
        "paragraphs": [
          "If something goes wrong, contact the other party through the Hayame chat first, and report the problem to us in the app within 24 hours of the trip ending so we can help. You agree to give us the photos and information we reasonably ask for, and that we may decide how a deposit is applied based on the evidence both sides provide.",
          "These terms are governed by the laws of the Republic of Ghana. We and you will first try to settle any dispute by negotiation, and may agree to mediation under the Alternative Dispute Resolution Act, 2010 (Act 798). Otherwise the courts of Ghana have jurisdiction."
        ]
      },
      {
        "title": "20. Changes to these terms",
        "paragraphs": [
          "We may update these terms as Hayame grows or the law changes. When we make an important change we will show you the new terms in the app and ask you to accept them before you continue. A booking is governed by the terms in force when it was made."
        ]
      },
      {
        "title": "21. Contact us",
        "paragraphs": [
          "Questions about these terms can be sent to support@hayamegh.com or through Help in the app. Hayame Technologies, Accra Digital Centre, Ring Road West, Accra, Ghana."
        ]
      }
    ]
  }
}
"""#
}
#endif
