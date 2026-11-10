import SwiftUI

// MARK: - Listing cards
//
// One card for every listing surface (Home, Explore, Saved). Image first: the
// photo carries the card with rounded corners and no container, the heart and
// any badge float over it, and the facts sit as plain text underneath. Two
// layouts share the same anatomy: a tile (photo on top) and a row (photo on
// the left) for compact lists. Call sites that wrap the card in a
// `NavigationLink` pass `showsFavoriteButton: false` and overlay
// `ListingHeartButton` themselves so the heart never competes with the push.

enum ListingCardLayout: Equatable {
    /// Photo on top, text below. `width` fixes the card width for carousels.
    case tile(width: CGFloat? = nil, imageHeight: CGFloat = 156)
    /// Photo on the left, text on the right.
    case row
}

struct ListingCard: View {
    let car: Car
    let isFavorite: Bool
    var layout: ListingCardLayout = .tile()
    var showsFavoriteButton = true
    /// Saved uses a filled brand-danger heart; everywhere else the heart is a
    /// white outline that fills when saved.
    var emphasizeSaved = false
    var onToggleFavorite: () -> Void = {}

    private var ratingLine: String {
        if car.reviewsCount > 0 {
            return String(format: "%.1f", car.rating)
        }
        return car.isNewListing ? "New" : "No reviews yet"
    }

    var body: some View {
        switch layout {
        case .tile(let width, let imageHeight):
            VStack(alignment: .leading, spacing: 10) {
                photo(height: imageHeight)
                facts
            }
            .frame(width: width, alignment: .leading)
            .frame(maxWidth: width == nil ? .infinity : nil, alignment: .leading)
            .contentShape(Rectangle())
        case .row:
            HStack(alignment: .top, spacing: 14) {
                photo(height: 96)
                    .frame(width: 128)
                facts
                    .padding(.top, 2)
                Spacer(minLength: 0)
                if showsFavoriteButton {
                    ListingHeartButton(isFavorite: isFavorite, emphasizeSaved: emphasizeSaved, onDark: false, action: onToggleFavorite)
                }
            }
        }
    }

    private func photo(height: CGFloat) -> some View {
        ZStack(alignment: .topTrailing) {
            NetworkOrFallbackImage(urlString: car.imageNames.first, targetSize: CGSize(width: 520, height: 360))
                .frame(height: height)
                .frame(maxWidth: .infinity)
                .clipped()
                // A scaled-to-fill photo keeps its unclipped bounds for hit testing;
                // without this a tap above the card could land on it.
                .contentShape(Rectangle())

            if showsFavoriteButton, case .tile = layout {
                ListingHeartButton(isFavorite: isFavorite, emphasizeSaved: emphasizeSaved, action: onToggleFavorite)
                    .padding(8)
            }

            if car.instantBook || car.allowOneDayBooking || car.withDriver {
                // Three labelled pills do not fit a narrow grid tile. Rather than
                // let the labels wrap, fall back to icon-only pills, keeping the
                // "1 day" label longest because its icon alone says least.
                ViewThatFits(in: .horizontal) {
                    photoPills(labelInstantAndDriver: true, labelOneDay: true)
                    photoPills(labelInstantAndDriver: false, labelOneDay: true)
                    photoPills(labelInstantAndDriver: false, labelOneDay: false)
                }
                .padding(8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func photoPills(labelInstantAndDriver: Bool, labelOneDay: Bool) -> some View {
        HStack(spacing: 6) {
            if car.instantBook {
                photoPill(systemImage: "bolt.fill", text: "Instant", showsText: labelInstantAndDriver)
            }
            if car.withDriver {
                photoPill(systemImage: "person.fill", text: "Driver", showsText: labelInstantAndDriver)
            }
            if car.allowOneDayBooking {
                photoPill(systemImage: "calendar", text: "1 day", showsText: labelOneDay)
            }
        }
    }

    /// Small dark capsule over the photo: "Instant", "1 day". Never wraps.
    private func photoPill(systemImage: String, text: String, showsText: Bool = true) -> some View {
        HStack(spacing: 4) {
            Image(systemName: systemImage)
                .font(.hayame(size: 9, weight: .bold))
            if showsText {
                Text(text)
                    .font(.hayame(size: 10, weight: .bold))
                    .lineLimit(1)
                    .fixedSize(horizontal: true, vertical: false)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(.black.opacity(0.42), in: Capsule())
    }

    private var facts: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(car.displayTitle)
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 5) {
                Text(String(car.year))
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                Circle()
                    .fill(HayameTheme.mutedText.opacity(0.5))
                    .frame(width: 3, height: 3)
                HStack(spacing: 3) {
                    Text(ratingLine)
                        .font(.hayame(size: 13, weight: car.reviewsCount > 0 ? .bold : .medium))
                        .foregroundStyle(car.reviewsCount > 0 ? HayameTheme.brandNavy : HayameTheme.mutedText)
                    if car.reviewsCount > 0 {
                        Image(systemName: "star.fill")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                        Text("(\(car.reviewsCount))")
                            .font(.hayame(size: 13, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
            }
            .lineLimit(1)

            Text(car.city)
                .font(.hayame(size: 12, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .lineLimit(1)

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text("GHS \(car.dailyPrice)")
                    .font(.hayame(size: 17, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text("/day")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(.top, 4)
        }
    }
}

/// The heart that floats over a listing photo (or sits beside a row).
struct ListingHeartButton: View {
    let isFavorite: Bool
    var emphasizeSaved = false
    /// Over a photo the heart is white on a dark disc; beside text it is navy.
    var onDark = true
    let action: () -> Void

    @State private var bounce = 0

    private var tint: Color {
        if isFavorite { return emphasizeSaved || !onDark ? HayameTheme.danger : .white }
        return onDark ? .white : HayameTheme.brandNavy
    }

    private var disc: Color {
        if onDark { return (isFavorite && emphasizeSaved) ? HayameTheme.floatingControlBackground : Color.black.opacity(0.22) }
        return HayameTheme.fieldBackground
    }

    var body: some View {
        Button {
            HayameHaptics.light()
            bounce += 1
            action()
        } label: {
            Image(systemName: isFavorite ? "heart.fill" : "heart")
                .font(.hayame(size: 15, weight: .bold))
                .foregroundStyle(tint)
                .symbolEffect(.bounce, value: bounce)
                .shadow(color: onDark ? .black.opacity(0.3) : .clear, radius: 4, x: 0, y: 1)
                .frame(width: 34, height: 34)
                .background(disc, in: Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isFavorite ? "Remove from saved" : "Save")
    }
}

/// Shimmer stand-in with the same anatomy as `ListingCard`.
struct ListingCardSkeleton: View {
    var layout: ListingCardLayout = .tile()

    var body: some View {
        switch layout {
        case .tile(let width, let imageHeight):
            VStack(alignment: .leading, spacing: 10) {
                SkeletonBlock(height: imageHeight, cornerRadius: 18)
                SkeletonBlock(width: 150, height: 15, cornerRadius: 6)
                SkeletonBlock(width: 110, height: 11, cornerRadius: 5)
                SkeletonBlock(width: 80, height: 14, cornerRadius: 6)
            }
            .frame(width: width)
        case .row:
            HStack(alignment: .top, spacing: 14) {
                SkeletonBlock(width: 128, height: 96, cornerRadius: 18)
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonBlock(width: 150, height: 15, cornerRadius: 6)
                    SkeletonBlock(width: 110, height: 11, cornerRadius: 5)
                    SkeletonBlock(width: 80, height: 14, cornerRadius: 6)
                }
                Spacer()
            }
        }
    }
}
