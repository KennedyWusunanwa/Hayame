// Hayame app icon generator.
//
// Builds every launcher asset for iOS and Android from the master logo
// (public/logo-white.png) so both platforms ship the same icon:
//
//   * HayameIOS/HayameIOS/AppIcon.icon/Assets/*.png   – Icon Composer layers (iOS 26 Liquid Glass)
//   * HayameIOS/HayameIOS/Assets.xcassets/AppIcon.appiconset/*.png – glossy fallback for iOS 17/18
//   * android-native/app/src/main/res/mipmap-*/ic_launcher_foreground.png / _monochrome.png – adaptive layers
//   * android-native/app/src/main/res/mipmap-*/ic_launcher.png / ic_launcher_round.png – legacy launcher icons
//   * design/icons/*.png – App Store / Play Store exports and previews
//
// Usage:  swiftc -O -o /tmp/make-icons design/icons/make-icons.swift && /tmp/make-icons "<repo root>"
//
// Composition: the car mark alone, centred at 80% of the tile width at its native aspect ratio.
// The blue is a deep glossy gradient (brand blue to navy) with a glass sheen across the top; the car gets a white-to-ice
// gradient, a specular highlight, a soft halo and a faint floor reflection. On iOS 26 the system
// renders the layered .icon in Liquid Glass on top of that.

import AppKit
import CoreGraphics
import Foundation

let root = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : FileManager.default.currentDirectoryPath
let fm = FileManager.default
let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

// MARK: - Brand colours

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(colorSpace: srgb, components: [
        CGFloat((hex >> 16) & 0xFF) / 255, CGFloat((hex >> 8) & 0xFF) / 255, CGFloat(hex & 0xFF) / 255, alpha,
    ])!
}
let blueTop = rgb(0x1E7FE8)      // brand blue, top
let blueMid = rgb(0x0B4CC6)      // deep blue, middle
let blueBottom = rgb(0x051C6E)   // navy, bottom

// MARK: - Source artwork

// Master logo: 1808x944, white on transparent. The car mark box was measured from the alpha channel.
let logoURL = URL(fileURLWithPath: root).appendingPathComponent("public/logo-white.png")
guard let logoImage = NSImage(contentsOf: logoURL),
      let logo = logoImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fatalError("Cannot load \(logoURL.path)")
}
let carBox = CGRect(x: 40, y: 35, width: 838, height: 310)   // car mark incl. speed lines
let carImage = logo.cropping(to: carBox)!
let wordBox = CGRect(x: 41, y: 345, width: 1725, height: 565) // HAYAME incl. the Y tail
let wordCapHeight: CGFloat = 356                              // letter height without the tail
let wordImage = logo.cropping(to: wordBox)!

// MARK: - Drawing helpers

final class Canvas {
    let size: Int
    let ctx: CGContext
    init(_ size: Int) {
        self.size = size
        ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                        space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        ctx.interpolationQuality = .high
        // Flip so that y grows downwards like image coordinates.
        ctx.translateBy(x: 0, y: CGFloat(size))
        ctx.scaleBy(x: 1, y: -1)
    }
    var n: CGFloat { CGFloat(size) }

    func draw(_ image: CGImage, in rect: CGRect, alpha: CGFloat = 1) {
        ctx.saveGState()
        ctx.setAlpha(alpha)
        ctx.translateBy(x: rect.minX, y: rect.maxY)
        ctx.scaleBy(x: 1, y: -1)
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: rect.width, height: rect.height))
        ctx.restoreGState()
    }

    /// Fills `image`'s silhouette (its alpha) with a vertical gradient. `stops` run top -> bottom.
    /// `flipped` mirrors the artwork vertically (used for the floor reflection).
    func drawTinted(_ image: CGImage, in rect: CGRect, stops: [(CGFloat, CGColor)], flipped: Bool = false) {
        ctx.saveGState()
        ctx.translateBy(x: rect.minX, y: rect.maxY)
        ctx.scaleBy(x: 1, y: -1)
        let local = CGRect(x: 0, y: 0, width: rect.width, height: rect.height)
        if flipped {
            ctx.translateBy(x: 0, y: rect.height)
            ctx.scaleBy(x: 1, y: -1)
        }
        ctx.clip(to: local, mask: alphaMask(of: image))
        if flipped {   // undo the flip so the gradient still runs top -> bottom on the canvas
            ctx.translateBy(x: 0, y: rect.height)
            ctx.scaleBy(x: 1, y: -1)
        }
        let g = CGGradient(colorsSpace: srgb, colors: stops.map { $0.1 } as CFArray, locations: stops.map { $0.0 })!
        ctx.drawLinearGradient(g, start: CGPoint(x: 0, y: local.maxY), end: CGPoint(x: 0, y: local.minY), options: [])
        ctx.restoreGState()
    }

    func shadow(_ offsetY: CGFloat, blur: CGFloat, color: CGColor, _ body: () -> Void) {
        ctx.saveGState()
        // Shadow offsets are in base space (y up), so a negative y casts downwards.
        ctx.setShadow(offset: CGSize(width: 0, height: -offsetY), blur: blur, color: color)
        body()
        ctx.restoreGState()
    }

    func linear(_ stops: [(CGFloat, CGColor)], from: CGPoint, to: CGPoint) {
        let g = CGGradient(colorsSpace: srgb, colors: stops.map { $0.1 } as CFArray, locations: stops.map { $0.0 })!
        ctx.drawLinearGradient(g, start: from, end: to, options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
    }

    func radial(_ stops: [(CGFloat, CGColor)], center: CGPoint, radius: CGFloat) {
        let g = CGGradient(colorsSpace: srgb, colors: stops.map { $0.1 } as CFArray, locations: stops.map { $0.0 })!
        ctx.drawRadialGradient(g, startCenter: center, startRadius: 0, endCenter: center, endRadius: radius, options: [])
    }

    /// Glossy blue: vertical gradient, a glass sheen over the top half, a corner bloom and a dark floor.
    func fillGlossyBackground() {
        linear([(0, blueTop), (0.5, blueMid), (1, blueBottom)], from: CGPoint(x: n * 0.3, y: 0), to: CGPoint(x: n * 0.7, y: n))
        radial([(0, rgb(0xFFFFFF, 0.22)), (1, rgb(0xFFFFFF, 0))], center: CGPoint(x: n * 0.25, y: n * 0.1), radius: n * 0.7)
        // Sheen: bright at the top, fading out along a curved lower edge.
        ctx.saveGState()
        ctx.addEllipse(in: CGRect(x: -n * 0.35, y: -n * 1.05, width: n * 1.7, height: n * 1.55))
        ctx.clip()
        linear([(0, rgb(0xFFFFFF, 0.26)), (1, rgb(0xFFFFFF, 0.03))], from: CGPoint(x: 0, y: 0), to: CGPoint(x: 0, y: n * 0.5))
        ctx.restoreGState()
        // Depth at the floor.
        linear([(0, rgb(0x000000, 0)), (1, rgb(0x02103F, 0.45))], from: CGPoint(x: 0, y: n * 0.6), to: CGPoint(x: 0, y: n))
    }

    /// The glossy car: halo, drop shadow, ice gradient fill, specular highlight.
    func drawGlossyCar(in rect: CGRect) {
        // Halo so the mark looks lit from within.
        shadow(0, blur: rect.height * 0.35, color: rgb(0xFFFFFF, 0.45)) { draw(carImage, in: rect, alpha: 0.001) }
        shadow(0, blur: rect.height * 0.12, color: rgb(0xFFFFFF, 0.55)) { draw(carImage, in: rect) }
        // Drop shadow for lift.
        shadow(rect.height * 0.06, blur: rect.height * 0.14, color: rgb(0x031A5C, 0.45)) { draw(carImage, in: rect) }
        // Body: white at the roof, ice blue at the sills.
        drawTinted(carImage, in: rect, stops: [(0, rgb(0xFFFFFF)), (0.55, rgb(0xEAF5FF)), (1, rgb(0xB9DCFF))])
        // Specular: a bright band across the upper body that fades out before the wheels.
        drawTinted(carImage, in: rect, stops: [(0, rgb(0xFFFFFF, 0.0)), (0.12, rgb(0xFFFFFF, 0.55)), (0.5, rgb(0xFFFFFF, 0))])
    }

    /// The glossy wordmark for the alternate "Name" icon: same treatment as the car.
    func drawGlossyWord(in rect: CGRect) {
        shadow(0, blur: rect.height * 0.5, color: rgb(0xFFFFFF, 0.4)) { draw(wordImage, in: rect, alpha: 0.001) }
        shadow(0, blur: rect.height * 0.16, color: rgb(0xFFFFFF, 0.5)) { draw(wordImage, in: rect) }
        shadow(rect.height * 0.07, blur: rect.height * 0.18, color: rgb(0x031A5C, 0.45)) { draw(wordImage, in: rect) }
        drawTinted(wordImage, in: rect, stops: [(0, rgb(0xFFFFFF)), (0.5, rgb(0xEAF5FF)), (1, rgb(0xB9DCFF))])
        drawTinted(wordImage, in: rect, stops: [(0, rgb(0xFFFFFF, 0.0)), (0.1, rgb(0xFFFFFF, 0.5)), (0.45, rgb(0xFFFFFF, 0))])
    }

    /// Faint mirrored car under `rect`, fading downwards, like a reflection on glass.
    func drawReflection(of rect: CGRect, alpha: CGFloat) {
        let gap = rect.height * 0.06
        let r = CGRect(x: rect.minX, y: rect.maxY + gap, width: rect.width, height: rect.height)
        drawTinted(carImage, in: r, stops: [(0, rgb(0xFFFFFF, alpha)), (0.55, rgb(0xFFFFFF, 0))], flipped: true)
    }

    func clipRoundedSquare(inset: CGFloat, radius: CGFloat) {
        let r = CGRect(x: inset, y: inset, width: n - 2 * inset, height: n - 2 * inset)
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: radius, cornerHeight: radius, transform: nil))
        ctx.clip()
    }

    func clipCircle(inset: CGFloat) {
        ctx.addEllipse(in: CGRect(x: inset, y: inset, width: n - 2 * inset, height: n - 2 * inset))
        ctx.clip()
    }

    func write(_ relativePath: String) {
        let url = URL(fileURLWithPath: root).appendingPathComponent(relativePath)
        try! fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
        try! rep.representation(using: .png, properties: [:])!.write(to: url)
        print("wrote \(relativePath)")
    }
}

var maskCache: [ObjectIdentifier: CGImage] = [:]
func alphaMask(of image: CGImage) -> CGImage {
    if let m = maskCache[ObjectIdentifier(image)] { return m }
    let w = image.width, h = image.height
    var rgba = [UInt8](repeating: 0, count: w * h * 4)
    let c = CGContext(data: &rgba, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                      space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    c.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
    var gray = [UInt8](repeating: 0, count: w * h)
    for i in 0..<(w * h) { gray[i] = rgba[i * 4 + 3] }
    let data = Data(gray) as CFData
    let provider = CGDataProvider(data: data)!
    let mask = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: w,
                       space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: 0),
                       provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent)!
    maskCache[ObjectIdentifier(image)] = mask
    return mask
}

/// Car rect on a canvas of `size`: `fraction` of the width, native aspect ratio, centred on `centerY`.
func carRect(size: Int, fraction: CGFloat, centerY: CGFloat = 0.47) -> CGRect {
    let n = CGFloat(size)
    let w = fraction * n, h = w * carBox.height / carBox.width
    return CGRect(x: (n - w) / 2, y: centerY * n - h / 2, width: w, height: h)
}

/// Wordmark rect: `fraction` of the width, native aspect ratio, with the letters (not the tail)
/// centred on `centerY`.
func wordRect(size: Int, fraction: CGFloat, centerY: CGFloat = 0.5) -> CGRect {
    let n = CGFloat(size)
    let w = fraction * n, h = w * wordBox.height / wordBox.width
    let capCenter = (wordCapHeight / 2) / wordBox.height * h
    return CGRect(x: (n - w) / 2, y: centerY * n - capCenter, width: w, height: h)
}

/// Full glossy "Name" tile (alternate icon).
func drawGlossyWordIcon(on c: Canvas, fraction: CGFloat, centerY: CGFloat = 0.5) {
    c.fillGlossyBackground()
    c.drawGlossyWord(in: wordRect(size: c.size, fraction: fraction, centerY: centerY))
}

/// Full glossy tile: used wherever the OS cannot render layers itself.
func drawGlossyIcon(on c: Canvas, fraction: CGFloat, centerY: CGFloat = 0.47) {
    let r = carRect(size: c.size, fraction: fraction, centerY: centerY)
    c.fillGlossyBackground()
    c.drawReflection(of: r, alpha: 0.28)
    c.drawGlossyCar(in: r)
}

// MARK: - iOS: Icon Composer layers (iOS 26+) --------------------------------------------------

let iconLayers = "HayameIOS/HayameIOS/AppIcon.icon/Assets"
do {
    let r = carRect(size: 1024, fraction: 0.80, centerY: 0.5)
    let car = Canvas(1024)
    car.drawTinted(carImage, in: r, stops: [(0, rgb(0xFFFFFF)), (1, rgb(0xDDEFFF))])
    car.write("\(iconLayers)/car.png")
    let glow = Canvas(1024)
    glow.radial([(0, rgb(0xFFFFFF, 0.55)), (0.5, rgb(0xFFFFFF, 0.18)), (1, rgb(0xFFFFFF, 0))],
                center: CGPoint(x: r.midX, y: r.midY), radius: 1024 * 0.45)
    glow.write("\(iconLayers)/glow.png")
    let sheen = Canvas(1024)
    sheen.ctx.saveGState()
    sheen.ctx.addEllipse(in: CGRect(x: -1024 * 0.35, y: -1024 * 1.05, width: 1024 * 1.7, height: 1024 * 1.55))
    sheen.ctx.clip()
    sheen.linear([(0, rgb(0xFFFFFF, 0.5)), (1, rgb(0xFFFFFF, 0.05))], from: CGPoint(x: 0, y: 0), to: CGPoint(x: 0, y: 1024 * 0.5))
    sheen.ctx.restoreGState()
    sheen.write("\(iconLayers)/sheen.png")
    try? fm.removeItem(at: URL(fileURLWithPath: root).appendingPathComponent("\(iconLayers)/wordmark.png"))
}

// MARK: - iOS: glossy fallback for the asset catalogue (iOS 17/18) ---------------------------

let appiconset = "HayameIOS/HayameIOS/Assets.xcassets/AppIcon.appiconset"
for px in [20, 29, 40, 50, 57, 58, 60, 72, 76, 80, 87, 100, 114, 120, 144, 152, 167, 180, 1024] {
    let c = Canvas(px); drawGlossyIcon(on: c, fraction: 0.80); c.write("\(appiconset)/\(px).png")
}

// MARK: - Android --------------------------------------------------------------------------------

let res = "android-native/app/src/main/res"
let densities: [(String, CGFloat)] = [("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)]
// Adaptive icon: 108 dp canvas, 66 dp safe circle. Car at 232/432 of the canvas is ~80% of the
// visible 72 dp area, matching iOS.
let adaptiveFraction: CGFloat = 232.0 / 432.0
for (name, scale) in densities {
    let px = Int(108 * scale)
    let r = carRect(size: px, fraction: adaptiveFraction, centerY: 0.49)
    let fg = Canvas(px)
    fg.drawReflection(of: r, alpha: 0.22)
    fg.drawGlossyCar(in: r)
    fg.write("\(res)/mipmap-\(name)/ic_launcher_foreground.png")

    let mono = Canvas(px)
    mono.drawTinted(carImage, in: r, stops: [(0, rgb(0x000000)), (1, rgb(0x000000))])
    mono.write("\(res)/mipmap-\(name)/ic_launcher_monochrome.png")
}
// Legacy launcher bitmaps (48 dp). Unused on minSdk 26 devices but kept consistent.
for (name, scale) in densities + [("ldpi", 0.75)] {
    let px = Int(48 * scale)
    let square = Canvas(px)
    square.clipRoundedSquare(inset: square.n * 0.04, radius: square.n * 0.2)
    drawGlossyIcon(on: square, fraction: 0.72)
    square.write("\(res)/mipmap-\(name)/ic_launcher.png")

    let round = Canvas(px)
    round.clipCircle(inset: round.n * 0.04)
    drawGlossyIcon(on: round, fraction: 0.66, centerY: 0.48)
    round.write("\(res)/mipmap-\(name)/ic_launcher_round.png")
}

// MARK: - Store exports and previews -------------------------------------------------------------

do {
    let appStore = Canvas(1024); drawGlossyIcon(on: appStore, fraction: 0.80); appStore.write("design/icons/app-store-1024.png")
    let play = Canvas(512); drawGlossyIcon(on: play, fraction: 0.80); play.write("design/icons/play-store-512.png")
    // How a round-mask launcher shows the adaptive icon (72 dp of the 108 dp canvas).
    let preview = Canvas(432)
    preview.clipCircle(inset: 72)
    preview.fillGlossyBackground()
    let r = carRect(size: 432, fraction: adaptiveFraction, centerY: 0.49)
    preview.drawReflection(of: r, alpha: 0.22)
    preview.drawGlossyCar(in: r)
    preview.write("design/icons/preview-android-round.png")
}
// MARK: - Alternate "Name" icon (wordmark) --------------------------------------------------------

let wordLayers = "HayameIOS/HayameIOS/AppIconWordmark.icon/Assets"
do {
    let r = wordRect(size: 1024, fraction: 0.84)
    let word = Canvas(1024)
    word.drawTinted(wordImage, in: r, stops: [(0, rgb(0xFFFFFF)), (1, rgb(0xDDEFFF))])
    word.write("\(wordLayers)/wordmark.png")
    let glow = Canvas(1024)
    glow.radial([(0, rgb(0xFFFFFF, 0.5)), (0.5, rgb(0xFFFFFF, 0.16)), (1, rgb(0xFFFFFF, 0))],
                center: CGPoint(x: 512, y: 512), radius: 1024 * 0.5)
    glow.write("\(wordLayers)/glow.png")
    let sheen = Canvas(1024)
    sheen.ctx.saveGState()
    sheen.ctx.addEllipse(in: CGRect(x: -1024 * 0.35, y: -1024 * 1.05, width: 1024 * 1.7, height: 1024 * 1.55))
    sheen.ctx.clip()
    sheen.linear([(0, rgb(0xFFFFFF, 0.5)), (1, rgb(0xFFFFFF, 0.05))], from: CGPoint(x: 0, y: 0), to: CGPoint(x: 0, y: 1024 * 0.5))
    sheen.ctx.restoreGState()
    sheen.write("\(wordLayers)/sheen.png")
}
let wordAppiconset = "HayameIOS/HayameIOS/Assets.xcassets/AppIconWordmark.appiconset"
for px in [20, 29, 40, 50, 57, 58, 60, 72, 76, 80, 87, 100, 114, 120, 144, 152, 167, 180, 1024] {
    let c = Canvas(px); drawGlossyWordIcon(on: c, fraction: 0.84); c.write("\(wordAppiconset)/\(px).png")
}
// In-app previews for the icon picker (Settings > Appearance > App icon).
for (name, draw) in [("AppIconPreviewLogo", { (c: Canvas) in drawGlossyIcon(on: c, fraction: 0.80) }),
                     ("AppIconPreviewWordmark", { (c: Canvas) in drawGlossyWordIcon(on: c, fraction: 0.84) })] {
    for (scale, px) in [("1x", 72), ("2x", 144), ("3x", 216)] {
        let c = Canvas(px); draw(c); c.write("HayameIOS/HayameIOS/Assets.xcassets/\(name).imageset/\(name)@\(scale).png")
    }
}
let wordAdaptiveFraction: CGFloat = 236.0 / 432.0
for (name, scale) in densities {
    let px = Int(108 * scale)
    let r = wordRect(size: px, fraction: wordAdaptiveFraction)
    let fg = Canvas(px); fg.drawGlossyWord(in: r); fg.write("\(res)/mipmap-\(name)/ic_launcher_wordmark_foreground.png")
    let mono = Canvas(px)
    mono.drawTinted(wordImage, in: r, stops: [(0, rgb(0x000000)), (1, rgb(0x000000))])
    mono.write("\(res)/mipmap-\(name)/ic_launcher_wordmark_monochrome.png")
}
for (name, scale) in densities + [("ldpi", 0.75)] {
    let px = Int(48 * scale)
    let square = Canvas(px)
    square.clipRoundedSquare(inset: square.n * 0.04, radius: square.n * 0.2)
    drawGlossyWordIcon(on: square, fraction: 0.76)
    square.write("\(res)/mipmap-\(name)/ic_launcher_wordmark.png")
    let round = Canvas(px)
    round.clipCircle(inset: round.n * 0.04)
    drawGlossyWordIcon(on: round, fraction: 0.68)
    round.write("\(res)/mipmap-\(name)/ic_launcher_wordmark_round.png")
}
do {
    let logoPreview = Canvas(320); drawGlossyIcon(on: logoPreview, fraction: 0.80)
    logoPreview.write("\(res)/drawable-nodpi/app_icon_preview_logo.png")
    let wordPreview = Canvas(320); drawGlossyWordIcon(on: wordPreview, fraction: 0.84)
    wordPreview.write("\(res)/drawable-nodpi/app_icon_preview_wordmark.png")
    let store = Canvas(1024); drawGlossyWordIcon(on: store, fraction: 0.84); store.write("design/icons/app-store-1024-wordmark.png")
}
print("done")
