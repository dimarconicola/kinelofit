interface MapLinkInput {
  address: string;
  geo?: { lat: number; lng: number };
  zoom?: number;
}

export const buildOpenStreetMapHref = ({ address, geo, zoom = 16 }: MapLinkInput) => {
  if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
    return `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lng}#map=${zoom}/${geo.lat}/${geo.lng}`;
  }

  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
};
