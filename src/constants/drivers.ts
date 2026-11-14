import type { Ride } from '@/components/RideCard';
import type { Coords } from '@/hooks/useUserLocation';

type Driver = Ride & {
  offset: Coords;
};

export type PlacedDriver = Ride & {
  coordinate: Coords;
};

const DRIVERS: Driver[] = [
  {
    id: '1',
    driver: 'Lena M.',
    departure: '07:10',
    route: 'Marktplatz → Schule',
    offset: { latitude: 0.0021, longitude: -0.0034 },
  },
  {
    id: '2',
    driver: 'Jonas K.',
    departure: '07:25',
    route: 'Bahnhof → Schule',
    offset: { latitude: -0.0038, longitude: 0.0027 },
  },
  {
    id: '3',
    driver: 'Mia S.',
    departure: '07:30',
    route: 'Südstadt → Schule',
    offset: { latitude: 0.0049, longitude: 0.0041 },
  },
  {
    id: '4',
    driver: 'Ben R.',
    departure: '07:40',
    route: 'Am Park → Schule',
    offset: { latitude: -0.0016, longitude: -0.0058 },
  },
];

export function placeDrivers(origin: Coords): PlacedDriver[] {
  return DRIVERS.map(({ offset, ...ride }) => ({
    ...ride,
    coordinate: {
      latitude: origin.latitude + offset.latitude,
      longitude: origin.longitude + offset.longitude,
    },
  }));
}