# Food Access & Neighborhood Conditions — Jackson County, MO

An interactive choropleth map exploring food access, demographic conditions, and neighborhood geography across Jackson County census tracts. Built as a static, client-side web application deployable on GitHub Pages with no backend or tile server required.

**[Live Map →](https://matthewong01.github.io/kc-food-access-map)**

**[Portfolio →](https://MatthewOng01.github.io/kc-food-access)**

**[Data Project Repository →](https://github.com/MatthewOng01/kc_food_access)**

---
## AI Disclosure 
I did not independently write the code behind this map. The qGIS plug-in qGIS2web exports a Leaflet file that largely built the published map. To fine tune the map, I utalized Claude adjust the Javascript and html code to change the color, button responsivness, the side panel, and the mobile UI. While I utalized AI to build and debug this map, the analytical framework, data sourcing, spatial processing pipeline, variable selection, and interpretive decisions are my own.


## Technical Stack

| Component | Technology |
|---|---|
| Map rendering | [Leaflet.js](https://leafletjs.com/) v1.9 |
| Basemap | CartoDB Light (via CDN) |
| Spatial data | GeoJSON / JS-wrapped GeoJSON |
| Scripting | Vanilla JavaScript (ES6) |
| Styling | CSS3 with responsive media queries |
| Hosting | GitHub Pages (static) |

---

## Architecture

The application is a single `index.html` file with no build step, no framework, and no server-side dependencies. All data is loaded either as JavaScript variable files (`.js`) bundled with the page or fetched at runtime as GeoJSON from the `/data` directory.

### Data Loading Strategy

Two loading patterns are used depending on file size and data type:

**JS variable files** — used for large polygon datasets (census tracts, KCATA routes/stops, grocery stores) that need to be available synchronously on page load:

```javascript
// Loaded via <script> tag in <head>
// e.g. data/kc_tracts_0.js exports: var json_kc_tracts_0 = { ... }
var tractLayer = L.geoJSON(json_kc_tracts_0, { style: tractStyle, onEachFeature: tractPopup });
```

**Fetch at runtime** — used for supplemental overlay layers (buffer rings, road geometries) that load asynchronously after the map initializes:

```javascript
fetch('data/troost.geojson')
    .then(r => r.json())
    .then(data => {
        L.geoJSON(data, { style: roadStyles.troost }).addTo(troostLayer);
    });
```

For layers requiring multiple GeoJSON files under a single toggle, `Promise.all` is used to ensure all segments load before any are added to the map:

```javascript
Promise.all([
    fetch('data/us71.geojson').then(r => r.json()),
    fetch('data/i49.geojson').then(r => r.json())
]).then(function(results) {
    L.geoJSON(results[0], { style: roadStyles.us71 }).addTo(us71Layer);
    L.geoJSON(results[1], { style: roadStyles.us71 }).addTo(us71Layer);
    us71Layer.addTo(map);
});
```

---

## Choropleth Implementation

The choropleth dynamically re-renders based on whichever radio button is selected in the sidebar. All variable configurations are stored in a single `choroplethConfig` object:

```javascript
var choroplethConfig = {
    income:   { label: 'Median Household Income', format: '$', decimals: 0 },
    PovertyRate: { label: 'Poverty Rate', format: '%', decimals: 1, multiply: 100 },
    LILATracts_1And10: { label: 'LILA Flag', binary: true },
    // ...
};
```

Min/max values are computed at runtime from the loaded GeoJSON feature properties rather than hardcoded, making the color scale data-driven:

```javascript
function getMinMax(property) {
    var values = tractLayer.getLayers()
        .map(l => l.feature.properties[property])
        .filter(v => v !== null && v !== undefined);
    return { min: Math.min(...values), max: Math.max(...values) };
}
```

Colors are assigned by mapping a feature's value to a position along a five-stop scale:

```javascript
var colorScale = ['#E8EBEE', '#B8C9DB', '#7FA6C9', '#4575A5', '#0B2E59'];

function getColor(value, min, max, binary) {
    if (binary) return value >= 1 ? '#0B2E59' : 'transparent';
    var ratio = (value - min) / (max - min);
    var idx = Math.floor(ratio * (colorScale.length - 1));
    return colorScale[idx];
}
```

Binary variables (e.g. LILA flag) bypass the gradient and render as a simple present/absent fill.

---

## Spatial Data Pipeline

All spatial data was processed in **QGIS** before being loaded into the map:

- Census tract boundaries sourced from **Census TIGER/Line** shapefiles
- Demographic attributes joined from **ACS 2019 5-Year Estimates**
- Food access attributes joined from the **USDA Food Access Research Atlas**
- SNAP-authorized grocery store locations from **USDA SNAP Retailer data**
- Grocery access buffers (0.5 and 1 mile) generated via QGIS buffer tool on store point layer
- Road geometries (Troost Ave, US-71/I-49, I-435, 63rd St, Emmanuel Cleaver Blvd) exported from **OpenStreetMap** via QuickOSM plugin
- All layers reprojected to **EPSG:4326** (WGS 84) prior to export
- Large polygon layers converted to **JS variable format** using QGIS2Web to allow synchronous loading without a tile server

---

## Responsive Design

The sidebar adapts between a fixed left panel on desktop and a bottom sheet on mobile using CSS media queries and a shared toggle function. On desktop, the map container resizes dynamically when the sidebar opens or closes:

```javascript
setTimeout(function() { map.invalidateSize(); }, 320);
```

The 320ms delay matches the CSS transition duration to prevent Leaflet rendering the map at the wrong container size mid-animation.

---

## Layer Control

All overlay toggles are wired directly to Leaflet `layerGroup` objects. Layers that start off by default are instantiated but not added to the map until the checkbox is checked:

```javascript
document.getElementById('cb_allroads').addEventListener('change', function() {
    this.checked ? allRoadsLayer.addTo(map) : map.removeLayer(allRoadsLayer);
});
```

---

## Data Sources

| Dataset | Source | Year |
|---|---|---|
| Census tract boundaries | Census TIGER/Line | 2019 |
| Demographic estimates | ACS 5-Year Estimates | 2019 |
| Food access indicators | USDA Food Access Research Atlas | 2019 |
| SNAP retailer locations | USDA SNAP Retailer Locator | 2023 (filtered to 2019) |
| Transit routes & stops | KCATA via OpenStreetMap | 2024 |
| Road geometries | OpenStreetMap / QuickOSM | 2024 |

---

## Repository Structure

```
kc-food-access/
├── index.html
├── data/
│   ├── kc_tracts_0.js
│   ├── KCATARoutes_3.js
│   ├── KCATAStops_2.js
│   ├── snap_grocery_stores_5.js
│   ├── buffer_half_mile.geojson
│   ├── buffer_one_mile.geojson
│   ├── troost.geojson
│   ├── us71.geojson
│   ├── i49.geojson
│   ├── 435.geojson
│   ├── 63.geojson
│   └── cleaver.geojson
├── css/
├── js/
└── README.md
```

---

**Matthew Ong · Real Estate & Economic Analysis**

[LinkedIn](https://linkedin.com/in/matthewong01) · [GitHub](https://github.com/matthewong01)
