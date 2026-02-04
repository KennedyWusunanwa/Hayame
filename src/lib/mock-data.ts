export type MockCar = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  city: string;
  region: string;
  daily_price: number;
  rating: number;
  reviews: number;
  car_type: string;
  image: string;
  seats: number;
  transmission: "automatic" | "manual";
  fuel: string;
  fuel_type?: string;
  features: string[];
  description: string;
  host: {
    name: string;
    avatar: string;
  };
};

export const mockCars: MockCar[] = [
  {
    id: "car-accra-1",
    name: "Toyota RAV4 2022",
    brand: "Toyota",
    model: "RAV4",
    city: "Accra",
    region: "Greater Accra",
    daily_price: 820,
    rating: 4.9,
    reviews: 112,
    car_type: "SUV",
    seats: 5,
    transmission: "automatic",
    fuel: "Petrol",
    fuel_type: "petrol",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["Air Conditioning", "Automatic", "Bluetooth", "USB Port", "4x4"],
    description:
      "Clean and efficient SUV perfect for weekend getaways or business trips around Accra.",
    host: {
      name: "Ama Owusu",
      avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-accra-2",
    name: "Mercedes C300 2021",
    brand: "Mercedes-Benz",
    model: "C-Class (C300)",
    city: "Accra",
    region: "Greater Accra",
    daily_price: 1350,
    rating: 4.8,
    reviews: 74,
    car_type: "Luxury",
    seats: 5,
    transmission: "automatic",
    fuel: "Petrol",
    fuel_type: "petrol",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["Leather Seats", "Bluetooth", "Automatic", "Sunroof"],
    description: "Luxury comfort with premium interior and seamless ride quality.",
    host: {
      name: "Kwesi Lamptey",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-kumasi-1",
    name: "Toyota Corolla 2020",
    brand: "Toyota",
    model: "Corolla",
    city: "Kumasi",
    region: "Ashanti",
    daily_price: 480,
    rating: 4.7,
    reviews: 91,
    car_type: "Sedan",
    seats: 5,
    transmission: "automatic",
    fuel: "Petrol",
    fuel_type: "petrol",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["Bluetooth", "Automatic", "USB Port", "Air Conditioning"],
    description: "Reliable sedan with great fuel economy for trips across Kumasi.",
    host: {
      name: "Akua Agyeman",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-takoradi-1",
    name: "Hyundai Tucson 2021",
    brand: "Hyundai",
    model: "Tucson",
    city: "Takoradi",
    region: "Western",
    daily_price: 760,
    rating: 4.8,
    reviews: 68,
    car_type: "SUV",
    seats: 5,
    transmission: "automatic",
    fuel: "Diesel",
    fuel_type: "diesel",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["4x4", "Automatic", "Bluetooth", "Air Conditioning"],
    description: "Comfortable SUV with ample boot space for coastal drives.",
    host: {
      name: "Yaw Mensah",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-tamale-1",
    name: "Nissan Patrol 2019",
    brand: "Nissan",
    model: "Patrol",
    city: "Tamale",
    region: "Northern",
    daily_price: 980,
    rating: 4.6,
    reviews: 59,
    car_type: "SUV",
    seats: 7,
    transmission: "automatic",
    fuel: "Diesel",
    fuel_type: "diesel",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["4x4", "Leather Seats", "Automatic", "Air Conditioning"],
    description: "Built for the north—roomy, rugged, and comfortable for long trips.",
    host: {
      name: "Hawa Sule",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-accra-3",
    name: "Honda Fit 2018",
    brand: "Honda",
    model: "Fit/Jazz",
    city: "Accra",
    region: "Greater Accra",
    daily_price: 310,
    rating: 4.5,
    reviews: 88,
    car_type: "Hatchback",
    seats: 4,
    transmission: "automatic",
    fuel: "Petrol",
    fuel_type: "petrol",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["Automatic", "Bluetooth", "USB Port"],
    description: "Compact and easy to park—perfect for quick city errands.",
    host: {
      name: "Efua Armah",
      avatar:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-kumasi-2",
    name: "Ford Ranger 2022",
    brand: "Ford",
    model: "Ranger",
    city: "Kumasi",
    region: "Ashanti",
    daily_price: 890,
    rating: 4.7,
    reviews: 64,
    car_type: "Pickup",
    seats: 5,
    transmission: "automatic",
    fuel: "Diesel",
    fuel_type: "diesel",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["4x4", "Bluetooth", "Automatic", "USB Port"],
    description: "Powerful pickup ready for work trips and off-road adventures.",
    host: {
      name: "Kojo Boadu",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    },
  },
  {
    id: "car-takoradi-2",
    name: "Kia Carnival 2021",
    brand: "Kia",
    model: "Carnival/Sedona",
    city: "Takoradi",
    region: "Western",
    daily_price: 920,
    rating: 4.8,
    reviews: 51,
    car_type: "Van",
    seats: 7,
    transmission: "automatic",
    fuel: "Diesel",
    fuel_type: "diesel",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    features: ["Automatic", "Bluetooth", "USB Port", "Leather Seats"],
    description: "Family-sized comfort with sliding doors and plenty of space.",
    host: {
      name: "Akosua Danso",
      avatar:
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=300&q=80",
    },
  },
];
