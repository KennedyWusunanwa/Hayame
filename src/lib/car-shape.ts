/**
 * The shape of a car listing as the browse/explore UI consumes it.
 *
 * This type previously lived in `src/lib/mock-data.ts` alongside eight
 * hardcoded fake cars. The fake cars were deleted (they were being served to
 * real users on an empty database — see git history), but the type is genuinely
 * load-bearing: `ExploreCar` in src/app/explore/page.tsx derives from it.
 *
 * There is deliberately no sample/placeholder data in this file. If you need
 * fixtures for a test, define them in the test.
 */
export type CarShape = {
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
