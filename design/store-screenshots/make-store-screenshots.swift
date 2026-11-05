// Builds the App Store and Google Play screenshots in Hayame's own format.
//
// Format, following Apple's asset best practices: one flat illustrated scene
// (sky, clouds, city blocks, hills, palms) shared by the header, the search
// results art and every screenshot, so the whole product page reads as one
// story. Each screenshot has a short two-line headline and one plain line
// above a real app screen; the key part of that screen is magnified in place.
// No gradients, prices, URLs or other companies' names. The first image recreates the
// "Hayame, explained." post from social/posts in the post's own font (Geist).
// The script also builds the App Store product page header and search
// results art.
//
// Usage (from the repo root):
//   swift design/store-screenshots/make-store-screenshots.swift
// Inputs:  design/store-screenshots/captures/*.png  (light mode, launched with -HAYAME_STORE_SHOTS)
//          design/store-screenshots/assets/hero-car.png (subject lifted from public/Mercedes-Benz GLE 2026.png)
// Outputs: design/store-screenshots/app-store-6.9-inch/*.png (1320 x 2868, large iPhone slot)
//          design/store-screenshots/app-store-6.3-inch/*.png (1206 x 2622, medium iPhone slot)
//          design/store-screenshots/play-store/*.png (1080 x 1920, phone)
//          design/store-screenshots/app-store-page/header.png         (3840 x 1646, 21:9)
//          design/store-screenshots/app-store-page/search-results.png (3840 x 2560, 3:2)
//          design/store-screenshots/play-store/feature-graphic.png     (1024 x 500)

import AppKit
import CoreText
import ImageIO
import SwiftUI
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let base = root.appendingPathComponent("design/store-screenshots")

CTFontManagerRegisterFontsForURL(
    root.appendingPathComponent("HayameIOS/HayameIOS/Fonts/Manrope-Variable.ttf") as CFURL,
    .process,
    nil
)
// The social posts use Geist; the "explained" page matches them.
for weight in ["Black", "Bold", "SemiBold"] {
    CTFontManagerRegisterFontsForURL(
        root.appendingPathComponent("scripts/assets/geist/Geist-\(weight).woff2") as CFURL,
        .process,
        nil
    )
}

func geist(_ weight: String, _ size: CGFloat) -> Font {
    .custom("Geist-\(weight)", size: size)
}

// MARK: - Palette (solid colours only)

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

enum Palette {
    static let navy = Color(hex: 0x0A2B54)
    static let blue = Color(hex: 0x1484D9)
    static let sky = Color(hex: 0x7CCBFF)
    static let appPage = Color(hex: 0xF7FAFF)
}

/// The illustrated scene, far to near: each layer a step darker.
enum SceneColor {
    static let sky = Color(hex: 0x1484D9)
    static let sun = Color(hex: 0x3A9FEA)
    static let cloud = Color(hex: 0x6CB9F0)
    static let farCity = Color(hex: 0x1172C3)
    static let midHills = Color(hex: 0x0D5FA8)
    static let nearHills = Color(hex: 0x0A4A8A)
    static let road = Color(hex: 0x0A2B54)
    static let palms = Color(hex: 0x082448)
    /// Text on the sky.
    static let accentText = Color(hex: 0x0A2B54)
    static let detailText = Color(hex: 0xE3F1FD)
}

func manrope(_ weight: String, _ size: CGFloat) -> Font {
    .custom("Manrope-\(weight)", size: size)
}

// MARK: - Images

func loadImage(_ url: URL) -> CGImage {
    guard let image = NSImage(contentsOf: url),
          let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fatalError("Missing image: \(url.path)")
    }
    return cg
}

let logoBlue = loadImage(root.appendingPathComponent("public/logo.png"))
let logoWhite = loadImage(root.appendingPathComponent("public/logo-white.png"))
let heroCar = loadImage(base.appendingPathComponent("assets/hero-car.png"))
let pickupCar = loadImage(base.appendingPathComponent("assets/fiat-fullback.png"))

/// Captures are full simulator screenshots; the status bar is trimmed off.
let statusBarFraction: CGFloat = 0.062

// MARK: - Content

struct Step {
    let file: String
    let lineOne: String
    let lineTwo: String
    let detail: String
    let capture: String
    /// The part of the capture to magnify, as fractions of the full capture.
    let focus: CGRect
}

let steps: [Step] = [
    Step(file: "02-find-your-next-ride",
         lineOne: "Find your", lineTwo: "next ride.", detail: "Search by city, car type or host.",
         capture: "home", focus: CGRect(x: 0.03, y: 0.150, width: 0.94, height: 0.071)),
    Step(file: "03-book-in-minutes",
         lineOne: "Book in", lineTwo: "minutes.", detail: "Pick your dates. See the price as you go.",
         capture: "booking-dates", focus: CGRect(x: 0.03, y: 0.369, width: 0.94, height: 0.164)),
    Step(file: "04-pay-safely",
         lineOne: "Pay safely", lineTwo: "in the app.", detail: "Mobile Money or card, all in one checkout.",
         capture: "booking-pay", focus: CGRect(x: 0.03, y: 0.369, width: 0.94, height: 0.189)),
    Step(file: "05-every-trip-on-track",
         lineOne: "Every trip,", lineTwo: "on track.", detail: "Dates, pickup and status in one place.",
         capture: "trips", focus: CGRect(x: 0.03, y: 0.247, width: 0.94, height: 0.276)),
    Step(file: "06-chat-with-your-host",
         lineOne: "Chat with", lineTwo: "your host.", detail: "Agree on pickup before you set off.",
         capture: "chat", focus: CGRect(x: 0.03, y: 0.370, width: 0.80, height: 0.081)),
    Step(file: "07-your-car-your-income",
         lineOne: "Your car.", lineTwo: "Your income.", detail: "List your car and earn when it's free.",
         capture: "host-earnings", focus: CGRect(x: 0.03, y: 0.172, width: 0.94, height: 0.172)),
]

/// Shared measurements. `u` is one layout unit: 1% of the width, or less on
/// shorter canvases so text never crowds the app screen.
struct Metrics {
    let w: CGFloat
    let h: CGFloat
    var u: CGFloat { min(w, h * 0.46) / 100 }

    var headlineSize: CGFloat { 10 * u }
    var headlineTop: CGFloat { 10 * u }
    /// Manrope's line box is about 1.36 x the font size; lines overlap by 0.3.
    var headlineBlock: CGFloat { headlineSize * 1.36 * 2 - headlineSize * 0.3 }
    var detailSize: CGFloat { 3.7 * u }
    var detailTop: CGFloat { headlineTop + headlineBlock + 1.6 * u }
    /// Leaves room above the screen for the skyline to show.
    var cardTop: CGFloat { detailTop + detailSize * 1.36 + 12 * u }
    var cardWidth: CGFloat { w * 0.8 }
    var cardX: CGFloat { (w - cardWidth) / 2 }
}

// MARK: - Pieces

/// The app screen in a card that runs off the bottom, with one part lifted out
/// and magnified right where it sits on the screen.
struct ScreenWithFocus: View {
    let capture: CGImage
    let focus: CGRect
    let m: Metrics

    var body: some View {
        let captureW = CGFloat(capture.width)
        let captureH = CGFloat(capture.height)
        let statusBar = captureH * statusBarFraction
        let screen = capture.cropping(to: CGRect(x: 0, y: Int(statusBar), width: capture.width, height: Int(captureH - statusBar)))!
        let scale = m.cardWidth / captureW
        let corner = 6 * m.u
        let visible = m.h - m.cardTop

        // The magnified piece: a bit wider than the card's own copy of it.
        let piece = capture.cropping(to: CGRect(
            x: focus.minX * captureW,
            y: focus.minY * captureH,
            width: focus.width * captureW,
            height: focus.height * captureH
        ))!
        let lift = min(1.16, (m.w * 0.94) / (focus.width * captureW * scale))
        let pieceW = focus.width * captureW * scale * lift
        let pieceH = focus.height * captureH * scale * lift
        let centreX = m.cardX + focus.midX * captureW * scale
        let centreY = m.cardTop + (focus.midY * captureH - statusBar) * scale
        let pieceX = min(max(centreX - pieceW / 2, m.w * 0.03), m.w * 0.97 - pieceW)
        let pieceCorner = 3.6 * m.u

        ZStack(alignment: .topLeading) {
            // Screen card.
            ZStack(alignment: .top) {
                Palette.appPage
                Image(decorative: screen, scale: 1)
                    .resizable()
                    .frame(width: m.cardWidth, height: CGFloat(screen.height) * scale)
            }
            .frame(width: m.cardWidth, height: visible + corner * 2, alignment: .top)
            .clipShape(RoundedRectangle(cornerRadius: corner, style: .continuous))
            .frame(width: m.cardWidth, height: visible, alignment: .top)
            .clipped()
            .shadow(color: Color.black.opacity(0.22), radius: 3 * m.u, x: 0, y: 1.2 * m.u)
            .offset(x: m.cardX, y: m.cardTop)

            // Magnified piece.
            Image(decorative: piece, scale: 1)
                .resizable()
                .interpolation(.high)
                .frame(width: pieceW, height: pieceH)
                .background(Palette.appPage)
                .clipShape(RoundedRectangle(cornerRadius: pieceCorner, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: pieceCorner, style: .continuous)
                        .strokeBorder(Palette.blue, lineWidth: 0.5 * m.u)
                )
                .shadow(color: Color.black.opacity(0.3), radius: 3.6 * m.u, x: 0, y: 1.6 * m.u)
                .offset(x: pieceX, y: centreY - pieceH / 2)
        }
        .frame(width: m.w, height: m.h, alignment: .topLeading)
    }
}

// MARK: - Screenshots

struct StepScreenshot: View {
    let step: Step
    let m: Metrics

    var body: some View {
        let capture = loadImage(base.appendingPathComponent("captures/\(step.capture).png"))

        ZStack(alignment: .top) {
            PortraitScene(m: m)

            VStack(spacing: 0) {
                VStack(spacing: -m.headlineSize * 0.3) {
                    Text(step.lineOne).foregroundStyle(Color.white)
                    Text(step.lineTwo).foregroundStyle(SceneColor.accentText)
                }
                .font(manrope("ExtraBold", m.headlineSize))
                .tracking(-m.headlineSize * 0.012)
                .multilineTextAlignment(.center)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .padding(.top, m.headlineTop)

                Text(step.detail)
                    .font(manrope("SemiBold", m.detailSize))
                    .foregroundStyle(SceneColor.detailText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .padding(.top, 1.6 * m.u)
            }
            .frame(width: m.w * 0.88)

            ScreenWithFocus(capture: capture, focus: step.focus, m: m)
        }
        .frame(width: m.w, height: m.h)
        .clipped()
    }
}

/// The header's scene, laid out for a tall screenshot: clouds in the top
/// corners, and the skyline, hills and palms along the top of the app screen,
/// so the screen looks like it rises out of the landscape.
struct PortraitScene: View {
    let m: Metrics

    var body: some View {
        let u = m.u
        let w = m.w
        let top = m.cardTop
        ZStack(alignment: .topLeading) {
            SceneColor.sky

            // Whole clouds beside the headline, clear of the text.
            CloudShape(origin: CGPoint(x: -5 * u, y: 15 * u), scale: u / 25).fill(SceneColor.cloud)
            CloudShape(origin: CGPoint(x: w - 15 * u, y: 5 * u), scale: u / 28).fill(SceneColor.cloud)

            SkylineShape(width: w, baseline: top + 4 * u, scale: u / 30, towerX: w * 0.8)
                .fill(SceneColor.farCity)
            HillShape(points: [(0, top - 1 * u), (w * 0.3, top - 6 * u), (w * 0.62, top - 1 * u), (w, top - 7 * u)], bottom: m.h)
                .fill(SceneColor.midHills)
            HillShape(points: [(0, top + 2 * u), (w * 0.5, top + 6 * u), (w, top + 1 * u)], bottom: m.h)
                .fill(SceneColor.nearHills)

            PalmShape(base: CGPoint(x: 6 * u, y: m.h + 20), crown: CGPoint(x: 3 * u, y: top - 8 * u), frond: 12 * u)
                .fill(SceneColor.palms)
            PalmShape(base: CGPoint(x: w - 7 * u, y: m.h + 20), crown: CGPoint(x: w - 4 * u, y: top - 5 * u), frond: 11 * u)
                .fill(SceneColor.palms)
        }
        .frame(width: m.w, height: m.h, alignment: .topLeading)
        .clipped()
    }
}

/// The "Hayame, explained." post (social/posts/46-hayame-explained.png),
/// rebuilt for the tall screenshot: logo, headline, then a short chat that
/// answers what Hayame is. The website and social icons are left out.
struct ExplainedScreenshot: View {
    let size: CGSize

    private let page = Color(hex: 0xEDF7FF)
    private let lines: [(text: String, fromHayame: Bool)] = [
        ("So… what’s Hayame?", false),
        ("Ghana’s car-sharing marketplace.", true),
        ("Who’s it for?", false),
        ("Car owners who want extra income.\nAnd anyone who needs a ride.", true),
        ("And how do I say it?", false),
        ("Hire me. Or Haya mɛ. Both work.", true),
    ]

    var body: some View {
        let w = size.width
        let h = size.height
        // One unit is 1% of the width, or less on shorter canvases.
        let u = min(w, h * 0.5) / 100
        let margin = w * 0.09
        let top = h * 0.065
        let logoWidth = 22 * u
        let logoHeight = logoWidth * CGFloat(logoBlue.height) / CGFloat(logoBlue.width)
        let headline = 15.5 * u
        // Bubble text as large as possible while the widest line still fits.
        let contentWidth = w - margin * 2
        let padH = 4.6 * u
        let widest = lines.map { measuredWidth($0.text, font: "Geist-Bold", size: 100) }.max() ?? 1
        let bubbleText = min(5.3 * u, (contentWidth * 0.92 - padH * 2) / widest * 100)
        // The chat fills whatever height is left under the headline.
        let headlineBottom = top + logoHeight + 7 * u + headline * 2.05
        let chatTop = headlineBottom + 6 * u
        let chatBottom = h - h * 0.065
        let gap = min(9 * u, max(3 * u, (chatBottom - chatTop - bubbleHeights(u: u, text: bubbleText)) / CGFloat(lines.count - 1)))

        ZStack(alignment: .topLeading) {
            page

            Image(decorative: logoBlue, scale: 1)
                .resizable()
                .interpolation(.high)
                .frame(width: logoWidth, height: logoHeight)
                .offset(x: margin, y: top)

            VStack(alignment: .leading, spacing: -headline * 0.04) {
                Text("Hayame,").foregroundStyle(Palette.navy)
                Text("explained.").foregroundStyle(Palette.blue)
            }
            .font(geist("Black", headline))
            .tracking(-headline * 0.04)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .offset(x: margin - headline * 0.04, y: top + logoHeight + 7 * u)

            VStack(alignment: .leading, spacing: gap) {
                ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                    HStack(spacing: 0) {
                    if line.fromHayame { Spacer(minLength: 0) }
                    Text(line.text)
                        .font(geist("Bold", bubbleText))
                        .foregroundStyle(line.fromHayame ? Color.white : Palette.navy)
                        .lineSpacing(bubbleText * 0.18)
                        // Keep the post's own line breaks.
                        .fixedSize()
                        .padding(.horizontal, padH)
                        .padding(.vertical, 3.4 * u)
                        .background(
                            RoundedRectangle(cornerRadius: 3.6 * u, style: .continuous)
                                .fill(line.fromHayame ? Palette.blue : Color.white)
                                .shadow(color: Palette.navy.opacity(line.fromHayame ? 0.0 : 0.06), radius: 2 * u, x: 0, y: 0.8 * u)
                        )
                    if !line.fromHayame { Spacer(minLength: 0) }
                    }
                    .frame(width: contentWidth)
                }
            }
            .frame(width: contentWidth)
            // Centre the chat in the space under the headline.
            .frame(height: chatBottom - chatTop, alignment: .center)
            .offset(x: margin, y: chatTop)
        }
        .frame(width: w, height: h, alignment: .topLeading)
        .clipped()
    }

    private func measuredWidth(_ text: String, font: String, size: CGFloat) -> CGFloat {
        let nsFont = NSFont(name: font, size: size) ?? NSFont.systemFont(ofSize: size, weight: .bold)
        return text.split(separator: "\n")
            .map { (String($0) as NSString).size(withAttributes: [.font: nsFont]).width }
            .max() ?? 0
    }

    /// Total bubble height, so the gaps can share out the rest of the page.
    private func bubbleHeights(u: CGFloat, text: CGFloat) -> CGFloat {
        let lineHeight = text * 1.26 + text * 0.18
        let rows = lines.reduce(0) { $0 + CGFloat($1.text.split(separator: "\n").count) }
        return rows * lineHeight + CGFloat(lines.count) * 6.8 * u
    }
}

/// Product page header (21:9): a flat illustrated scene in brand blues, in
/// the style of Apple's header examples. City blocks and a crane on the
/// horizon, rolling hills, palm trees, and a road winding in from the
/// horizon, with the full white logo in the middle. No photos, no gradients.
/// The logo sits inside Apple's centred safe area (x 1097–2743, y 493–1154);
/// the scene fills the rest so any crop still looks finished.
struct HeaderArt: View {
    let size = CGSize(width: 3840, height: 1646)

    private let sky = SceneColor.sky
    private let sun = SceneColor.sun
    private let cloud = SceneColor.cloud
    private let farCity = SceneColor.farCity
    private let midHills = SceneColor.midHills
    private let nearHills = SceneColor.nearHills
    private let road = SceneColor.road
    private let palms = SceneColor.palms

    var body: some View {
        let w = size.width
        let h = size.height
        let logoWidth: CGFloat = 980
        let logoHeight = logoWidth * CGFloat(logoWhite.height) / CGFloat(logoWhite.width)

        ZStack(alignment: .topLeading) {
            sky

            Circle()
                .fill(sun)
                .frame(width: 520, height: 520)
                .offset(x: 2560, y: 330)

            CloudShape(origin: CGPoint(x: 640, y: 210), scale: 1.15).fill(cloud)
            CloudShape(origin: CGPoint(x: 2930, y: 150), scale: 0.95).fill(cloud)
            CloudShape(origin: CGPoint(x: 1240, y: 70), scale: 0.6).fill(cloud)

            SkylineShape(width: w, baseline: 1260).fill(farCity)

            HillShape(points: [(0, 1215), (700, 1150), (1500, 1225), (2300, 1165), (3100, 1230), (3840, 1170)], bottom: h)
                .fill(midHills)
            HillShape(points: [(0, 1330), (900, 1265), (1920, 1320), (2900, 1255), (3840, 1335)], bottom: h)
                .fill(nearHills)

            WindingRoad(start: CGPoint(x: 1920, y: 1290), bottom: h)
                .fill(road)
            ForEach(WindingRoad.dashes(start: CGPoint(x: 1920, y: 1290), bottom: h), id: \.id) { dash in
                dash.path.fill(Color.white.opacity(0.92))
            }

            // Palms frame the logo, inside the area a phone keeps.
            PalmShape(base: CGPoint(x: 330, y: h + 20), crown: CGPoint(x: 280, y: 880), frond: 270).fill(palms)
            PalmShape(base: CGPoint(x: 740, y: h + 20), crown: CGPoint(x: 900, y: 600), frond: 360).fill(palms)
            PalmShape(base: CGPoint(x: 3120, y: h + 20), crown: CGPoint(x: 2960, y: 620), frond: 350).fill(palms)
            PalmShape(base: CGPoint(x: 3560, y: h + 20), crown: CGPoint(x: 3620, y: 900), frond: 260).fill(palms)

            // The full logo, never cropped.
            Image(decorative: logoWhite, scale: 1)
                .resizable()
                .interpolation(.high)
                .frame(width: logoWidth, height: logoHeight)
                .offset(x: (w - logoWidth) / 2, y: 505)
        }
        .frame(width: w, height: h, alignment: .topLeading)
        .clipped()
    }
}

/// Puffy cloud made of overlapping circles on a flat base.
private struct CloudShape: Shape {
    let origin: CGPoint
    let scale: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let s = scale
        let bumps: [(CGFloat, CGFloat, CGFloat)] = [(0, 70, 90), (120, 20, 130), (270, 50, 110), (390, 85, 75)]
        for bump in bumps {
            path.addEllipse(in: CGRect(
                x: origin.x + (bump.0 - bump.2) * s,
                y: origin.y + (bump.1 - bump.2) * s + 100 * s,
                width: bump.2 * 2 * s,
                height: bump.2 * 2 * s
            ))
        }
        path.addRoundedRect(
            in: CGRect(x: origin.x - 90 * s, y: origin.y + 150 * s, width: 560 * s, height: 110 * s),
            cornerSize: CGSize(width: 55 * s, height: 55 * s)
        )
        return path
    }
}

/// City blocks along the horizon: taller at the sides, low in the middle so
/// the logo stays clear, with a round tower and a few rooftop details.
private struct SkylineShape: Shape {
    let width: CGFloat
    let baseline: CGFloat
    var scale: CGFloat = 1
    var towerX: CGFloat = 2780

    func path(in rect: CGRect) -> Path {
        var path = Path()
        var seed: UInt64 = 7
        func random() -> CGFloat {
            seed = seed &* 6364136223846793005 &+ 1442695040888963407
            return CGFloat((seed >> 33) % 10_000) / 10_000
        }
        let s = scale
        var x: CGFloat = -40 * s
        while x < width + 40 * s {
            let blockWidth = (110 + random() * 140) * s
            let centre = width / 2
            let distance = min(1, abs(x + blockWidth / 2 - centre) / (width * 0.42))
            let tallest = (120 + distance * distance * 520) * s
            let height = tallest * (0.55 + random() * 0.45)
            let top = baseline - height
            path.addRect(CGRect(x: x, y: top, width: blockWidth, height: height + 40 * s))
            // A few blocks get a stepped top or a rooftop mast.
            if random() > 0.62 {
                path.addRect(CGRect(x: x + blockWidth * 0.25, y: top - 60 * s, width: blockWidth * 0.5, height: 70 * s))
            } else if random() > 0.7 {
                path.addRect(CGRect(x: x + blockWidth / 2 - 6 * s, y: top - 110 * s, width: 12 * s, height: 120 * s))
            }
            x += blockWidth + (14 + random() * 26) * s
        }
        // Round glass tower.
        path.addRoundedRect(
            in: CGRect(x: towerX, y: baseline - 560 * s, width: 190 * s, height: 600 * s),
            cornerSize: CGSize(width: 95 * s, height: 95 * s)
        )
        return path
    }
}

/// Rolling hills through the given points, filled to the bottom edge.
private struct HillShape: Shape {
    let points: [(CGFloat, CGFloat)]
    let bottom: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: -20, y: bottom))
        path.addLine(to: CGPoint(x: -20, y: points[0].1))
        for index in 0..<(points.count - 1) {
            let a = points[index], b = points[index + 1]
            let mid = (a.0 + b.0) / 2
            path.addCurve(
                to: CGPoint(x: b.0, y: b.1),
                control1: CGPoint(x: mid, y: a.1),
                control2: CGPoint(x: mid, y: b.1)
            )
        }
        path.addLine(to: CGPoint(x: points.last!.0 + 20, y: points.last!.1))
        path.addLine(to: CGPoint(x: points.last!.0 + 20, y: bottom))
        path.closeSubpath()
        return path
    }
}

/// A road that winds in from the horizon, widening toward the viewer.
private struct WindingRoad: Shape {
    let start: CGPoint
    let bottom: CGFloat

    struct Dash: Identifiable {
        let id: Int
        let path: Path
    }

    static func centre(_ t: CGFloat, start: CGPoint, bottom: CGFloat) -> CGPoint {
        // Cubic Bézier from the horizon to the bottom edge with an S bend.
        let p0 = start
        let p1 = CGPoint(x: start.x + 520, y: start.y + 110)
        let p2 = CGPoint(x: start.x - 700, y: bottom - 260)
        let p3 = CGPoint(x: start.x + 60, y: bottom + 30)
        let u = 1 - t
        let x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x
        let y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
        return CGPoint(x: x, y: y)
    }

    static func halfWidth(_ t: CGFloat) -> CGFloat {
        8 + 520 * pow(t, 1.7)
    }

    func path(in rect: CGRect) -> Path {
        var left: [CGPoint] = []
        var right: [CGPoint] = []
        for step in 0...80 {
            let t = CGFloat(step) / 80
            let c = Self.centre(t, start: start, bottom: bottom)
            let hw = Self.halfWidth(t)
            left.append(CGPoint(x: c.x - hw, y: c.y))
            right.append(CGPoint(x: c.x + hw, y: c.y))
        }
        var path = Path()
        path.move(to: left[0])
        for point in left.dropFirst() { path.addLine(to: point) }
        for point in right.reversed() { path.addLine(to: point) }
        path.closeSubpath()
        return path
    }

    static func dashes(start: CGPoint, bottom: CGFloat) -> [Dash] {
        var result: [Dash] = []
        var t: CGFloat = 0.05
        var index = 0
        while t < 1 {
            let length = 0.025 + 0.05 * t
            let end = min(1, t + length)
            var left: [CGPoint] = []
            var right: [CGPoint] = []
            for step in 0...6 {
                let s = t + (end - t) * CGFloat(step) / 6
                let c = centre(s, start: start, bottom: bottom)
                let dw = 2 + 16 * pow(s, 1.4)
                left.append(CGPoint(x: c.x - dw, y: c.y))
                right.append(CGPoint(x: c.x + dw, y: c.y))
            }
            var path = Path()
            path.move(to: left[0])
            for point in left.dropFirst() { path.addLine(to: point) }
            for point in right.reversed() { path.addLine(to: point) }
            path.closeSubpath()
            result.append(Dash(id: index, path: path))
            index += 1
            t = end + length * 0.9
        }
        return result
    }
}

/// A palm tree: a gently curved trunk and drooping fronds.
private struct PalmShape: Shape {
    let base: CGPoint
    let crown: CGPoint
    let frond: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        // Trunk: tapered, bowed sideways.
        let bow = CGPoint(x: (base.x + crown.x) / 2 + (crown.x - base.x) * 0.6 - 40, y: (base.y + crown.y) / 2)
        let baseHalf: CGFloat = 34
        let topHalf: CGFloat = 14
        path.move(to: CGPoint(x: base.x - baseHalf, y: base.y))
        path.addQuadCurve(to: CGPoint(x: crown.x - topHalf, y: crown.y), control: CGPoint(x: bow.x - (baseHalf + topHalf) / 2, y: bow.y))
        path.addLine(to: CGPoint(x: crown.x + topHalf, y: crown.y))
        path.addQuadCurve(to: CGPoint(x: base.x + baseHalf, y: base.y), control: CGPoint(x: bow.x + (baseHalf + topHalf) / 2, y: bow.y))
        path.closeSubpath()

        // Fronds: arching leaves that rise from the crown and droop at the tips.
        let fronds: [(CGFloat, CGFloat)] = [
            (-1.0, 0.62), (-0.86, 0.22), (-0.58, -0.22), (-0.2, -0.46),
            (0.24, -0.44), (0.6, -0.2), (0.88, 0.24), (1.0, 0.6),
        ]
        for frondShape in fronds {
            let tip = CGPoint(x: crown.x + frondShape.0 * frond, y: crown.y + frondShape.1 * frond)
            let lift = min(frondShape.1, 0) * frond
            let upper = CGPoint(x: crown.x + frondShape.0 * frond * 0.5, y: crown.y + lift * 0.6 - frond * 0.34)
            let lower = CGPoint(x: crown.x + frondShape.0 * frond * 0.56, y: crown.y + lift * 0.5 - frond * 0.12)
            path.move(to: crown)
            path.addQuadCurve(to: tip, control: upper)
            path.addQuadCurve(to: crown, control: lower)
            path.closeSubpath()
        }
        path.addEllipse(in: CGRect(x: crown.x - 26, y: crown.y - 20, width: 52, height: 44))
        return path
    }
}

/// Search results (3:2): "show the interface". A short headline on the left
/// and the Home screen, large, running off the right and bottom edges. Sized
/// to stay readable when shown about 365 points wide.
struct SearchResultsArt: View {
    let size = CGSize(width: 3840, height: 2560)
    /// Apple's template safe area: x 836–3004, y 765–1795.
    let safe = CGRect(x: 836, y: 765, width: 2168, height: 1030)

    var body: some View {
        let capture = loadImage(base.appendingPathComponent("captures/home.png"))
        let statusBar = CGFloat(capture.height) * statusBarFraction
        let screen = capture.cropping(to: CGRect(x: 0, y: Int(statusBar), width: capture.width, height: capture.height - Int(statusBar)))!
        let cardWidth: CGFloat = 1500
        let scale = cardWidth / CGFloat(screen.width)
        let cardX: CGFloat = 2080
        let cardTop: CGFloat = 520
        let corner: CGFloat = 96
        let horizon: CGFloat = 2110

        ZStack(alignment: .topLeading) {
            // The header's scene, so search and product page match.
            SceneColor.sky
            Circle()
                .fill(SceneColor.sun)
                .frame(width: 440, height: 440)
                .offset(x: 1290, y: 230)
            CloudShape(origin: CGPoint(x: 240, y: 260), scale: 1.05).fill(SceneColor.cloud)
            CloudShape(origin: CGPoint(x: 1600, y: 120), scale: 0.62).fill(SceneColor.cloud)
            SkylineShape(width: size.width, baseline: horizon, scale: 0.85, towerX: 1500)
                .fill(SceneColor.farCity)
            HillShape(points: [(0, horizon - 40), (900, horizon - 110), (1900, horizon - 30), (2900, horizon - 100), (3840, horizon - 40)], bottom: size.height)
                .fill(SceneColor.midHills)
            HillShape(points: [(0, horizon + 90), (1200, horizon + 20), (2400, horizon + 100), (3840, horizon + 30)], bottom: size.height)
                .fill(SceneColor.nearHills)
            PalmShape(base: CGPoint(x: 360, y: size.height + 20), crown: CGPoint(x: 280, y: 1240), frond: 330)
                .fill(SceneColor.palms)

            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: -230 * 0.3) {
                    Text("Rent cars").foregroundStyle(Color.white)
                    Text("across Ghana.").foregroundStyle(SceneColor.accentText)
                }
                .font(manrope("ExtraBold", 230))
                .tracking(-3)
                .lineLimit(1)
                .minimumScaleFactor(0.6)

                Text("From local hosts, booked in minutes.")
                    .font(manrope("SemiBold", 92))
                    .foregroundStyle(SceneColor.detailText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .padding(.top, 44)
            }
            .frame(width: 1180, alignment: .leading)
            .offset(x: safe.minX, y: safe.minY + 190)

            ZStack(alignment: .top) {
                Palette.appPage
                Image(decorative: screen, scale: 1)
                    .resizable()
                    .frame(width: cardWidth, height: CGFloat(screen.height) * scale)
            }
            .frame(width: cardWidth, height: size.height - cardTop + corner * 2, alignment: .top)
            .clipShape(RoundedRectangle(cornerRadius: corner, style: .continuous))
            .frame(width: cardWidth, height: size.height - cardTop, alignment: .top)
            .clipped()
            .shadow(color: Color.black.opacity(0.28), radius: 60, x: 0, y: 24)
            .offset(x: cardX, y: cardTop)
        }
        .frame(width: size.width, height: size.height, alignment: .topLeading)
        .clipped()
    }
}

/// Google Play feature graphic (1024 x 500): the header scene, centred.
struct FeatureGraphic: View {
    let header: CGImage
    let size = CGSize(width: 1024, height: 500)

    var body: some View {
        let scale = size.height / CGFloat(header.height)
        let width = CGFloat(header.width) * scale
        ZStack(alignment: .topLeading) {
            SceneColor.sky
            Image(decorative: header, scale: 1)
                .resizable()
                .interpolation(.high)
                .frame(width: width, height: size.height)
                .offset(x: (size.width - width) / 2)
        }
        .frame(width: size.width, height: size.height, alignment: .topLeading)
        .clipped()
    }
}

// MARK: - Rendering

@MainActor
func snapshot<V: View>(_ view: V, size: CGSize) -> CGImage {
    let renderer = ImageRenderer(content: view.frame(width: size.width, height: size.height))
    renderer.scale = 1
    renderer.proposedSize = ProposedViewSize(size)
    guard let image = renderer.cgImage else { fatalError("Render failed") }
    return image
}

@MainActor
func render<V: View>(_ view: V, size: CGSize, to url: URL) {
    let image = snapshot(view, size: size)

    // Store screenshots must be opaque.
    let context = CGContext(
        data: nil,
        width: Int(size.width),
        height: Int(size.height),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    )!
    context.draw(image, in: CGRect(origin: .zero, size: size))
    let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, context.makeImage()!, nil)
    CGImageDestinationFinalize(destination)
    print("wrote \(url.path.replacingOccurrences(of: root.path + "/", with: ""))")
}

MainActor.assumeIsolated {
    // App Store Connect has a slot per display size: 6.9" (large) and
    // 6.3"/6.1" (medium, "iPhone with Dynamic Island").
    let targets: [(folder: String, size: CGSize)] = [
        ("app-store-6.9-inch", CGSize(width: 1320, height: 2868)),
        ("app-store-6.3-inch", CGSize(width: 1206, height: 2622)),
        ("play-store", CGSize(width: 1080, height: 1920)),
    ]
    // Older single-size folder from earlier runs.
    try? FileManager.default.removeItem(at: base.appendingPathComponent("app-store"))
    for target in targets {
        let folder = base.appendingPathComponent(target.folder)
        // Start clean so renamed screenshots don't linger.
        try? FileManager.default.removeItem(at: folder)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let m = Metrics(w: target.size.width, h: target.size.height)
        render(ExplainedScreenshot(size: target.size), size: target.size, to: folder.appendingPathComponent("01-hayame-explained.png"))
        for step in steps {
            render(StepScreenshot(step: step, m: m), size: target.size, to: folder.appendingPathComponent("\(step.file).png"))
        }
    }

    let pageFolder = base.appendingPathComponent("app-store-page")
    try? FileManager.default.removeItem(at: pageFolder)
    try? FileManager.default.createDirectory(at: pageFolder, withIntermediateDirectories: true)
    let header = HeaderArt()
    render(header, size: header.size, to: pageFolder.appendingPathComponent("header.png"))
    let search = SearchResultsArt()
    render(search, size: search.size, to: pageFolder.appendingPathComponent("search-results.png"))

    let feature = FeatureGraphic(header: snapshot(header, size: header.size))
    render(feature, size: feature.size, to: base.appendingPathComponent("play-store/feature-graphic.png"))
}
