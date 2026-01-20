# Module Cartes (offline)

Ce module est indépendant. Il génère des tuiles vectorielles pour Antananarivo et les sert en local via Docker, puis les affiche dans une page web Leaflet.

## 1) Télécharger les données OSM

```bash
cd "/home/riana/Documents/S5/Mr Rojo/Projet-cloud/cartes"
chmod +x scripts/*.sh
./scripts/download-data.sh
```

## 1bis) Télécharger les polices pour les labels

```bash
./scripts/download-fonts.sh
```

## 2) Générer le fichier MBTiles

```bash
./scripts/generate-mbtiles.sh
```

Le découpage est fait via `bounding_box` dans `data/tilemaker/config.json`.

## 3) Lancer

```bash
cd "/home/riana/Documents/S5/Mr Rojo/Projet-cloud/cartes"
docker compose up -d
```

## URL pour React

Utilisez l’URL suivante pour un `TileLayer` Leaflet dans React :

`http://localhost:8080/styles/basic/{z}/{x}/{y}.png`

Exemple minimal (React + react-leaflet) :

```tsx
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView() {
	return (
		<MapContainer center={[-18.8792, 47.5079]} zoom={12} style={{ height: "100vh" }}>
			<TileLayer
				attribution="© OpenStreetMap contributors"
				url="http://localhost:8080/styles/basic/{z}/{x}/{y}.png"
			/>
		</MapContainer>
	);
}
```

## Notes

- Si l’image Docker `ghcr.io/systemed/tilemaker:latest` est indisponible, installez `tilemaker` localement et relancez `scripts/generate-mbtiles.sh`.
- Vous pouvez ajuster la zone d’Antananarivo dans `data/tilemaker/config.json` (bounding box).
