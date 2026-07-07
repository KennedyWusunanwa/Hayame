import Combine
import CoreLocation

final class HomeLocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    @Published var coordinate: CLLocationCoordinate2D?
    @Published var cityName: String?
    @Published var regionName: String?
    @Published var isResolvingLocation = false
    @Published var didResolveLocation = false

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyThreeKilometers
    }

    func requestIfNeeded() {
        switch manager.authorizationStatus {
        case .notDetermined:
            isResolvingLocation = true
            didResolveLocation = false
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            isResolvingLocation = true
            didResolveLocation = false
            manager.requestLocation()
        default:
            isResolvingLocation = false
            didResolveLocation = true
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.first else { return }
        CLGeocoder().reverseGeocodeLocation(loc) { placemarks, _ in
            DispatchQueue.main.async {
                guard let placemark = placemarks?.first,
                      let browseLocation = Self.ghanaBrowseLocation(from: placemark) else {
                    self.coordinate = nil
                    self.cityName = nil
                    self.regionName = nil
                    self.isResolvingLocation = false
                    self.didResolveLocation = true
                    return
                }
                self.coordinate = loc.coordinate
                self.cityName = browseLocation.city
                self.regionName = browseLocation.region
                self.isResolvingLocation = false
                self.didResolveLocation = true
            }
        }
    }

    private static func ghanaBrowseLocation(from placemark: CLPlacemark) -> (city: String?, region: String?)? {
        let countryCode = placemark.isoCountryCode?.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if let countryCode, !countryCode.isEmpty, countryCode != "GH" {
            return nil
        }

        let knownRegions = Set(MockDataService.citiesByRegion.keys.map { $0.lowercased() })
        let normalizedRegion = placemark.administrativeArea.map {
            MockDataService.normalizedRegion($0)
        }
        let region = normalizedRegion.flatMap { knownRegions.contains($0.lowercased()) ? $0 : nil }
        let cityCandidates = [
            placemark.locality,
            placemark.subAdministrativeArea,
        ]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let city = cityCandidates.compactMap {
            MockDataService.canonicalCity($0, region: region)
        }.first

        if countryCode == "GH" {
            return (city: city, region: region)
        }
        guard city != nil || region != nil else { return nil }
        return (city: city, region: region)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse ||
            manager.authorizationStatus == .authorizedAlways {
            isResolvingLocation = true
            didResolveLocation = false
            manager.requestLocation()
        } else if manager.authorizationStatus == .denied ||
                    manager.authorizationStatus == .restricted {
            isResolvingLocation = false
            didResolveLocation = true
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.isResolvingLocation = false
            self.didResolveLocation = true
        }
    }
}
