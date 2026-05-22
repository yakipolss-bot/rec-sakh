export interface City {
  name: string;
  code: string;
  lat: number;
  lon: number;
}

export const SAKHALIN_CITIES: City[] = [
  { name: 'Южно-Сахалинск', code: 'yuzhno', lat: 46.959, lon: 142.738 },
  { name: 'Корсаков', code: 'korsakov', lat: 46.632, lon: 142.790 },
  { name: 'Холмск', code: 'kholmsk', lat: 47.043, lon: 142.045 },
  { name: 'Оха', code: 'okha', lat: 53.589, lon: 142.946 },
  { name: 'Невельск', code: 'nevelsk', lat: 46.673, lon: 141.860 },
  { name: 'Поронайск', code: 'poronaysk', lat: 49.221, lon: 143.116 },
  { name: 'Долинск', code: 'dolinsk', lat: 47.324, lon: 142.797 },
  { name: 'Александровск-Сахалинский', code: 'aleksandrovsk', lat: 50.897, lon: 142.169 },
  { name: 'Анива', code: 'aniva', lat: 46.713, lon: 142.527 },
  { name: 'Макаров', code: 'makarov', lat: 48.625, lon: 142.780 },
  { name: 'Томари', code: 'tomari', lat: 47.764, lon: 142.067 },
  { name: 'Углегорск', code: 'uglegorsk', lat: 49.063, lon: 142.033 },
  { name: 'Ноглики', code: 'nogliki', lat: 51.789, lon: 143.142 },
];

export function findNearestCity(lat: number, lon: number): City {
  let nearest = SAKHALIN_CITIES[0];
  let minDist = Infinity;
  for (const c of SAKHALIN_CITIES) {
    const d = Math.sqrt((c.lat - lat) ** 2 + (c.lon - lon) ** 2);
    if (d < minDist) { minDist = d; nearest = c; }
  }
  return nearest;
}
