import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let iconsFixed = false;

export function getLeaflet() {
  fixLeafletIcons(L);
  return L;
}

export function fixLeafletIcons(leaflet = L) {
  if (iconsFixed) return leaflet;

  delete leaflet.Icon.Default.prototype._getIconUrl;
  leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });

  iconsFixed = true;
  return leaflet;
}

export async function loadLeaflet() {
  return getLeaflet();
}

export async function loadLeafletGeoman() {
  return getLeaflet();
}
