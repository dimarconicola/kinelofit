import { env } from '@/lib/env';

export interface MapTileConfig {
  engine: 'leaflet';
  tileUrl: string;
  attribution: string;
  subdomains?: string[];
}

const DEFAULT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const DEFAULT_SUBDOMAINS = ['a', 'b', 'c', 'd'];

const isValidTileUrl = (value: string) => value.includes('{z}') && value.includes('{x}') && value.includes('{y}');

export const getMapTileConfig = (): MapTileConfig => {
  const tileUrl = env.mapTileUrl?.trim() || DEFAULT_TILE_URL;
  const attribution = env.mapTileAttribution?.trim() || DEFAULT_ATTRIBUTION;
  const subdomains = env.mapTileSubdomains
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    engine: 'leaflet',
    tileUrl,
    attribution,
    subdomains: subdomains?.length ? subdomains : DEFAULT_SUBDOMAINS
  };
};

export const isMapTileConfigValid = () => isValidTileUrl(getMapTileConfig().tileUrl);
