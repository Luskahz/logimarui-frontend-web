"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { divIcon, latLngBounds, point } from "leaflet";
import { BarChart3, BoxSelect, Brush, Info, MapPinned, MousePointer2, Pentagon, RotateCcw, Spline, X, } from "lucide-react";
import { CircleMarker, GeoJSON, MapContainer, Marker, Polygon, Polyline, Rectangle, Popup, ScaleControl, TileLayer, Tooltip, useMap, useMapEvents, ZoomControl, } from "react-leaflet";
import { formatCurrency, formatNumber, formatVolume, formatWeight } from "@/features/critica-pedidos/utils/formatters";
const GEOJSON_BASE_PATH = "/geo";
const INITIAL_MAP_SCALE_METERS = 10_000;
const MUNICIPIO_SCALE_METERS = 4_000;
const POINT_LAYER_SCALE_METERS = 2_000;
const BAIRRO_OUTLINE_ONLY_SCALE_METERS = 1_000;
const RESET_DRILLDOWN_SCALE_METERS = 10_000;
const LEAFLET_SCALE_SAMPLE_WIDTH_PX = 100;
export const emptyMapSelection = {
    kind: "none",
    label: "Global",
    clienteIds: [],
};
const DRAW_PREVIEW_PATH = {
    color: "#00d4ff",
    dashArray: "6 6",
    fillColor: "#00d4ff",
    fillOpacity: 0.12,
    opacity: 0.92,
    weight: 1.6,
};
const SELECTED_POINT_PATH = {
    color: "#f5a900",
    fillColor: "#f5a900",
    fillOpacity: 0.22,
    opacity: 0.95,
    weight: 2,
};
const MUNICIPIOS_GEO = [
    {
        id: "caraguatatuba",
        label: "Caraguá",
        matchers: ["CARAGUATATUBA", "CARAGUA", "CARAGUÁ"],
        bairroFileName: "bairros-caraguatatuba.geojson",
        contornoFileName: "contorno-caraguatatuba.geojson",
    },
    {
        id: "ilhabela",
        label: "Ilhabela",
        matchers: ["ILHABELA", "ILHA BELA"],
        bairroFileName: "bairros-ilhabela.geojson",
        contornoFileName: "contorno-ilhabela.geojson",
    },
    {
        id: "natividade-da-serra",
        label: "Natividade da Serra",
        matchers: ["NATIVIDADE DA SERRA", "NATIVIDADE"],
        contornoFileName: "contorno-natividade-da-serra.geojson",
    },
    {
        id: "sao-sebastiao",
        label: "São Sebastião",
        matchers: ["SAO SEBASTIAO", "SÃO SEBASTIÃO", "SAOSEBASTIAO", "SAO-SEBASTIAO"],
        bairroFileName: "bairros-sao-sebastiao.geojson",
        contornoFileName: "contorno-sao-sebastiao.geojson",
    },
    {
        id: "ubatuba",
        label: "Ubatuba",
        matchers: ["UBATUBA"],
        bairroFileName: "bairros-ubatuba.geojson",
        contornoFileName: "contorno-ubatuba.geojson",
    },
];
const BLUE_SCALE_START = "#182f3a";
const BLUE_SCALE_END = "#2f83a3";
const BAIRRO_STROKE_COLOR = "#5f95a8";
const BAIRRO_SELECTED_COLOR = "#d7e6ea";
const MUNICIPIO_STROKE_COLOR = "#6f9daa";
const MUNICIPIO_SELECTED_COLOR = "#e5edf0";
const MUNICIPIO_COLOR_PALETTE = {
    caraguatatuba: {
        fill: "#2f83a3",
        stroke: "#6f9daa",
        bairroLow: "#1d3a45",
        bairroHigh: "#2f83a3",
    },
    "sao-sebastiao": {
        fill: "#a6914a",
        stroke: "#c2b06a",
        bairroLow: "#443c24",
        bairroHigh: "#a6914a",
    },
    "natividade-da-serra": {
        fill: "#7f8790",
        stroke: "#a0a8b0",
        bairroLow: "#343b42",
        bairroHigh: "#7f8790",
    },
    ilhabela: {
        fill: "#4d8b72",
        stroke: "#7fab96",
        bairroLow: "#263f35",
        bairroHigh: "#4d8b72",
    },
    ubatuba: {
        fill: "#a86464",
        stroke: "#c18787",
        bairroLow: "#493033",
        bairroHigh: "#a86464",
    },
};
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function hexToRgb(hex) {
    const value = hex.replace("#", "");
    return {
        r: Number.parseInt(value.slice(0, 2), 16),
        g: Number.parseInt(value.slice(2, 4), 16),
        b: Number.parseInt(value.slice(4, 6), 16),
    };
}
function rgbToHex({ r, g, b }) {
    const toHex = (value) => Math.round(value).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function interpolateHexColor(startColor, endColor, ratio) {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    const safeRatio = clamp(ratio, 0, 1);
    return rgbToHex({
        r: start.r + (end.r - start.r) * safeRatio,
        g: start.g + (end.g - start.g) * safeRatio,
        b: start.b + (end.b - start.b) * safeRatio,
    });
}
function getBlueScaleRatio(quantidadePdvs, maxQuantidadePdvs) {
    if (quantidadePdvs <= 0 || maxQuantidadePdvs <= 0)
        return 0;
    return clamp(quantidadePdvs / maxQuantidadePdvs, 0, 1);
}
function getBlueScaleColor(quantidadePdvs, maxQuantidadePdvs) {
    const ratio = getBlueScaleRatio(quantidadePdvs, maxQuantidadePdvs);
    return interpolateHexColor(BLUE_SCALE_START, BLUE_SCALE_END, ratio);
}
function getMunicipioPalette(municipioId) {
    return MUNICIPIO_COLOR_PALETTE[municipioId] ?? null;
}
function getMunicipioFillColor(municipioId) {
    return getMunicipioPalette(municipioId)?.fill ?? BLUE_SCALE_END;
}
function getMunicipioStrokeColor(municipioId) {
    return getMunicipioPalette(municipioId)?.stroke ?? MUNICIPIO_STROKE_COLOR;
}
function getMunicipioBairroStrokeColor(municipioId) {
    return getMunicipioPalette(municipioId)?.stroke ?? BAIRRO_STROKE_COLOR;
}
function getMunicipioBairroFillColor(municipioId, quantidadePdvs, maxQuantidadePdvs) {
    const palette = getMunicipioPalette(municipioId);
    if (!palette) {
        return getBlueScaleColor(quantidadePdvs, maxQuantidadePdvs);
    }
    const ratio = getBlueScaleRatio(quantidadePdvs, maxQuantidadePdvs);
    return interpolateHexColor(palette.bairroLow, palette.bairroHigh, ratio);
}
function normalizeText(value) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
}
function normalizeCidade(value) {
    return normalizeText(value).replace(/[-_]/g, " ");
}
function isFeatureCollection(data) {
    if (!data || typeof data !== "object")
        return false;
    const geojson = data;
    return geojson.type === "FeatureCollection" && Array.isArray(geojson.features);
}
function getGeojsonUrl(fileName) {
    return `${GEOJSON_BASE_PATH}/${fileName}`;
}
async function fetchGeojson(fileName, signal) {
    const response = await fetch(getGeojsonUrl(fileName), { signal });
    if (!response.ok) {
        throw new Error(`${fileName}: ${response.status}`);
    }
    const data = await response.json();
    if (!isFeatureCollection(data)) {
        throw new Error(`${fileName}: GeoJSON inválido`);
    }
    return data;
}
function useMunicipiosGeojson() {
    const [municipios, setMunicipios] = useState([]);
    const [loadingGeojson, setLoadingGeojson] = useState(true);
    const [erroGeojson, setErroGeojson] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        async function loadGeojsonFiles() {
            setLoadingGeojson(true);
            setErroGeojson(null);
            const results = await Promise.allSettled(MUNICIPIOS_GEO.map(async (municipio) => {
                const contornoGeojson = await fetchGeojson(municipio.contornoFileName, controller.signal);
                let bairroGeojson = null;
                if (municipio.bairroFileName) {
                    bairroGeojson = await fetchGeojson(municipio.bairroFileName, controller.signal);
                }
                return {
                    ...municipio,
                    bairroGeojson,
                    contornoGeojson,
                    bounds: getFeatureCollectionBounds(contornoGeojson),
                };
            }));
            if (!active)
                return;
            const loadedMunicipios = results
                .filter((result) => result.status === "fulfilled")
                .map((result) => result.value);
            const failedMunicipios = results
                .filter((result) => result.status === "rejected")
                .map((result) => result.reason)
                .map((reason) => (reason instanceof Error ? reason.message : String(reason)));
            setMunicipios(loadedMunicipios);
            setErroGeojson(failedMunicipios.length > 0 ? failedMunicipios.join(" · ") : null);
            setLoadingGeojson(false);
        }
        loadGeojsonFiles().catch((error) => {
            if (!active || controller.signal.aborted)
                return;
            setMunicipios([]);
            setErroGeojson(error instanceof Error ? error.message : "Erro ao carregar arquivos GeoJSON");
            setLoadingGeojson(false);
        });
        return () => {
            active = false;
            controller.abort();
        };
    }, []);
    return { municipios, loadingGeojson, erroGeojson };
}
function normalizeBairro(bairro) {
    const value = bairro?.trim();
    if (!value) {
        return "Sem bairro";
    }
    return value.toUpperCase();
}
function getBairroKey(bairro) {
    const normalized = normalizeText(bairro);
    return normalized || "SEM BAIRRO";
}
function getBairroScopeKey(municipioId, bairro) {
    return `${municipioId}:${getBairroKey(bairro)}`;
}
function getPropertyAsString(properties, keys) {
    if (!properties)
        return null;
    for (const key of keys) {
        const value = properties[key];
        if (typeof value === "string" && value.trim())
            return value;
        if (typeof value === "number" && Number.isFinite(value))
            return String(value);
    }
    const entries = Object.entries(properties);
    for (const key of keys) {
        const normalizedKey = normalizeText(key);
        const match = entries.find(([propertyKey]) => normalizeText(propertyKey) === normalizedKey);
        if (!match)
            continue;
        const value = match[1];
        if (typeof value === "string" && value.trim())
            return value;
        if (typeof value === "number" && Number.isFinite(value))
            return String(value);
    }
    return null;
}
function getFeatureBairro(feature) {
    return (getPropertyAsString(feature.properties, [
        "bairro",
        "nome_bairr",
        "nome_bairro",
        "nm_bairro",
        "nome",
        "Nome",
        "name",
        "bairro_nome",
        "no_bairro",
    ]) ?? "Sem bairro");
}
function isClienteDoMunicipio(cliente, municipio) {
    const cidade = normalizeCidade(cliente.cidade);
    return municipio.matchers.some((matcher) => {
        const normalizedMatcher = normalizeCidade(matcher);
        return cidade === normalizedMatcher || cidade.includes(normalizedMatcher);
    });
}
function isClienteDentroDoContorno(cliente, municipio) {
    return pointInFeatureCollection([cliente.longitude, cliente.latitude], municipio.contornoGeojson);
}
function isClienteAssociadoAoMunicipio(cliente, municipio) {
    return isClienteDoMunicipio(cliente, municipio) || isClienteDentroDoContorno(cliente, municipio);
}
function hasGeojsonForCliente(cliente, municipios) {
    return municipios.some((municipio) => isClienteAssociadoAoMunicipio(cliente, municipio));
}
function isValidCliente(cliente) {
    return (typeof cliente.latitude === "number" &&
        typeof cliente.longitude === "number" &&
        Number.isFinite(cliente.latitude) &&
        Number.isFinite(cliente.longitude) &&
        cliente.latitude >= -90 &&
        cliente.latitude <= 90 &&
        cliente.longitude >= -180 &&
        cliente.longitude <= 180);
}
function getValidClientes(clientes) {
    return clientes.filter(isValidCliente);
}
function getCenter(clientes) {
    if (clientes.length === 0) {
        return [-23.62, -45.41];
    }
    const lat = clientes.reduce((total, cliente) => total + cliente.latitude, 0) / clientes.length;
    const lng = clientes.reduce((total, cliente) => total + cliente.longitude, 0) / clientes.length;
    return [lat, lng];
}
function getMarkerRadius(cliente) {
    const peso = Math.max(0, cliente.pesoBrutoKg || 0);
    return Math.max(7, Math.min(15, 6 + Math.sqrt(peso) / 32));
}
function getClienteKey(cliente, index) {
    return `${cliente.clienteId}-${cliente.pedidoId ?? "sem-pedido"}-${index}`;
}
function getUniqueClienteIds(clientes) {
    return Array.from(new Set(clientes.map((cliente) => cliente.clienteId)));
}
function getSelectionPayload(kind, label, clientes) {
    const clienteIds = getUniqueClienteIds(clientes);
    if (clienteIds.length === 0)
        return emptyMapSelection;
    return {
        kind,
        label,
        clienteIds,
    };
}
function getClientesInsideRing(clientes, points) {
    if (points.length < 3)
        return [];
    const ring = points.map(([lat, lng]) => [lng, lat]);
    return clientes.filter((cliente) => pointInRing([cliente.longitude, cliente.latitude], ring));
}
function getClientesInsideBounds(clientes, bounds) {
    if (!bounds?.isValid())
        return [];
    return clientes.filter((cliente) => bounds.contains([cliente.latitude, cliente.longitude]));
}
function getPesoColor(pesoBrutoKg) {
    if (pesoBrutoKg > 50_000)
        return "#00d4ff";
    if (pesoBrutoKg > 20_000)
        return "#38bdf8";
    if (pesoBrutoKg > 5_000)
        return "#60a5fa";
    if (pesoBrutoKg > 1_000)
        return "#67e8f9";
    return "#a5f3fc";
}
function createPointIcon(cliente) {
    const color = getPesoColor(cliente.pesoBrutoKg || 0);
    const radius = getMarkerRadius(cliente);
    const size = radius * 2 + 14;
    const innerSize = Math.max(7, radius * 0.95);
    return divIcon({
        className: "logimarui-map-div-icon",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)],
        html: `
      <div style="
        width:${size}px;
        height:${size}px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:999px;
        background:radial-gradient(circle, ${color}38 0%, ${color}18 42%, ${color}00 72%);
        box-shadow:0 0 16px ${color}66, 0 0 30px ${color}22;
      ">
        <div style="
          width:${innerSize}px;
          height:${innerSize}px;
          border-radius:999px;
          background:${color};
          border:2px solid rgba(230,252,255,.95);
          box-shadow:inset 0 0 5px rgba(255,255,255,.72), 0 0 12px ${color};
        "></div>
      </div>
    `,
    });
}
function pointInRing(point, ring) {
    const [lng, lat] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];
        const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersects)
            inside = !inside;
    }
    return inside;
}
function pointInPolygon(point, polygon) {
    if (polygon.length === 0)
        return false;
    const outerRing = polygon[0];
    if (!pointInRing(point, outerRing))
        return false;
    const holes = polygon.slice(1);
    return !holes.some((hole) => pointInRing(point, hole));
}
function pointInGeometry(point, geometry) {
    if (geometry.type === "Polygon") {
        return pointInPolygon(point, geometry.coordinates);
    }
    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
    }
    return false;
}
function pointInFeatureCollection(point, geojson) {
    return geojson.features.some((feature) => pointInGeometry(point, feature.geometry));
}
function collectGeometryPoints(coordinates, points) {
    if (!Array.isArray(coordinates))
        return;
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
        const lng = coordinates[0];
        const lat = coordinates[1];
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            points.push([lat, lng]);
        }
        return;
    }
    coordinates.forEach((coordinate) => collectGeometryPoints(coordinate, points));
}
function collectGeometryPointsFromGeometry(geometry, points) {
    if (geometry.type === "GeometryCollection") {
        geometry.geometries.forEach((childGeometry) => collectGeometryPointsFromGeometry(childGeometry, points));
        return;
    }
    collectGeometryPoints(geometry.coordinates, points);
}
function getGeometryBounds(geometry) {
    const points = [];
    collectGeometryPointsFromGeometry(geometry, points);
    if (points.length === 0)
        return null;
    return latLngBounds(points);
}
function getFeatureCollectionBounds(geojson) {
    const boundsList = geojson.features.map((feature) => getGeometryBounds(feature.geometry)).filter(Boolean);
    if (boundsList.length === 0)
        return null;
    const bounds = latLngBounds(boundsList[0].getSouthWest(), boundsList[0].getNorthEast());
    boundsList.slice(1).forEach((item) => bounds.extend(item));
    return bounds;
}
function boundsIntersects(left, right) {
    if (!left || !right || !left.isValid() || !right.isValid())
        return false;
    return left.intersects(right);
}
function mergeBounds(boundsList) {
    const validBounds = boundsList.filter((bounds) => bounds.isValid());
    if (validBounds.length === 0)
        return null;
    const bounds = latLngBounds(validBounds[0].getSouthWest(), validBounds[0].getNorthEast());
    validBounds.slice(1).forEach((item) => bounds.extend(item));
    return bounds;
}
function getMunicipiosBounds(municipios) {
    return mergeBounds(municipios.map((municipio) => municipio.bounds).filter(Boolean));
}
function buildMunicipioResumo(municipio, clientes) {
    const clientesDoMunicipio = clientes.filter((cliente) => isClienteAssociadoAoMunicipio(cliente, municipio));
    return {
        id: municipio.id,
        municipio: municipio.label,
        quantidadePdvs: clientesDoMunicipio.length,
        pesoBrutoKg: clientesDoMunicipio.reduce((total, cliente) => total + (cliente.pesoBrutoKg || 0), 0),
        volumeHl: clientesDoMunicipio.reduce((total, cliente) => total + (cliente.volumeHl || 0), 0),
        caixas: clientesDoMunicipio.reduce((total, cliente) => total + (cliente.caixas || 0), 0),
        valor: clientesDoMunicipio.reduce((total, cliente) => total + (cliente.valor || 0), 0),
        color: getMunicipioFillColor(municipio.id),
        clientes: clientesDoMunicipio,
    };
}
function buildMunicipiosResumo(municipios, clientes) {
    return municipios.map((municipio) => buildMunicipioResumo(municipio, clientes));
}
function buildMunicipioBairrosResumo(municipio, clientes) {
    if (!municipio.bairroGeojson)
        return [];
    const clientesDoMunicipio = clientes.filter((cliente) => isClienteAssociadoAoMunicipio(cliente, municipio));
    return municipio.bairroGeojson.features
        .map((feature) => {
        const bairro = normalizeBairro(getFeatureBairro(feature));
        const bairroKey = getBairroScopeKey(municipio.id, bairro);
        const clientesDoBairro = clientesDoMunicipio.filter((cliente) => pointInGeometry([cliente.longitude, cliente.latitude], feature.geometry));
        return {
            id: bairroKey,
            municipioId: municipio.id,
            municipio: municipio.label,
            bairro,
            bairroKey,
            quantidadePdvs: clientesDoBairro.length,
            pesoBrutoKg: clientesDoBairro.reduce((total, cliente) => total + (cliente.pesoBrutoKg || 0), 0),
            volumeHl: clientesDoBairro.reduce((total, cliente) => total + (cliente.volumeHl || 0), 0),
            caixas: clientesDoBairro.reduce((total, cliente) => total + (cliente.caixas || 0), 0),
            valor: clientesDoBairro.reduce((total, cliente) => total + (cliente.valor || 0), 0),
            color: getMunicipioBairroFillColor(municipio.id, clientesDoBairro.length, 1),
            bounds: getGeometryBounds(feature.geometry),
            clientes: clientesDoBairro,
        };
    })
        .filter((bairro) => bairro.quantidadePdvs > 0);
}
function buildBairrosResumo(municipios, clientes) {
    const bairros = municipios.flatMap((municipio) => buildMunicipioBairrosResumo(municipio, clientes));
    const maxQuantidadePdvs = Math.max(1, ...bairros.map((bairro) => bairro.quantidadePdvs));
    return bairros.map((bairro) => ({
        ...bairro,
        color: getMunicipioBairroFillColor(bairro.municipioId, bairro.quantidadePdvs, maxQuantidadePdvs),
    }));
}
function buildBairrosGeoIndex(municipios) {
    return municipios.flatMap((municipio) => {
        if (!municipio.bairroGeojson)
            return [];
        return municipio.bairroGeojson.features.map((feature) => {
            const bairro = normalizeBairro(getFeatureBairro(feature));
            const bairroKey = getBairroScopeKey(municipio.id, bairro);
            return {
                id: bairroKey,
                municipioId: municipio.id,
                bairroKey,
                bairro,
                bounds: getGeometryBounds(feature.geometry),
            };
        });
    });
}
function getClientesNoViewport(clientes, bounds) {
    if (!bounds || !bounds.isValid())
        return clientes;
    return clientes.filter((cliente) => bounds.contains([cliente.latitude, cliente.longitude]));
}
function getZoomForScale(map, targetScaleMeters) {
    const currentScaleMeters = getViewportScaleMeters(map);
    if (!Number.isFinite(currentScaleMeters) || currentScaleMeters <= 0 || targetScaleMeters <= 0) {
        return map.getZoom();
    }
    return map.getZoom() + Math.log2(currentScaleMeters / targetScaleMeters);
}
function fitInitialMapBounds(map, bounds) {
    const padding = point(24, 24);
    const minZoom = map.getMinZoom();
    const maxZoom = map.getMaxZoom();
    map.fitBounds(bounds, {
        padding,
        animate: true,
    });
    window.setTimeout(() => {
        const fitZoom = map.getBoundsZoom(bounds, false, padding);
        const targetScaleZoom = getZoomForScale(map, INITIAL_MAP_SCALE_METERS);
        const initialZoom = clamp(Math.min(targetScaleZoom, fitZoom), minZoom, maxZoom);
        map.setView(bounds.getCenter(), initialZoom, {
            animate: true,
        });
    }, 0);
}
function MapAutoFit({ clientes, municipios }) {
    const map = useMap();
    useEffect(() => {
        const timer = window.setTimeout(() => {
            map.invalidateSize();
            const municipiosBounds = getMunicipiosBounds(municipios);
            if (municipiosBounds?.isValid()) {
                fitInitialMapBounds(map, municipiosBounds);
                return;
            }
            if (clientes.length === 0) {
                map.setView([-23.62, -45.41], 10);
                return;
            }
            if (clientes.length === 1) {
                map.setView([clientes[0].latitude, clientes[0].longitude], 12);
                return;
            }
            const bounds = latLngBounds(clientes.map((cliente) => [cliente.latitude, cliente.longitude]));
            fitInitialMapBounds(map, bounds);
        }, 80);
        return () => window.clearTimeout(timer);
    }, [clientes, map, municipios]);
    return null;
}
function getViewportScaleMeters(map) {
    const size = map.getSize();
    if (!size || size.x <= 0 || size.y <= 0)
        return Number.POSITIVE_INFINITY;
    const sampleWidth = Math.min(LEAFLET_SCALE_SAMPLE_WIDTH_PX, size.x);
    const centerY = size.y / 2;
    const leftPoint = map.containerPointToLatLng([0, centerY]);
    const rightPoint = map.containerPointToLatLng([sampleWidth, centerY]);
    return leftPoint.distanceTo(rightPoint);
}
function getMapViewportState(map) {
    return {
        bounds: map.getBounds(),
        scaleMeters: getViewportScaleMeters(map),
    };
}
function MapViewportTracker({ onViewportChange }) {
    const map = useMapEvents({
        moveend() {
            onViewportChange(getMapViewportState(map));
        },
        zoomend() {
            onViewportChange(getMapViewportState(map));
        },
        resize() {
            onViewportChange(getMapViewportState(map));
        },
    });
    useEffect(() => {
        onViewportChange(getMapViewportState(map));
    }, [map, onViewportChange]);
    return null;
}
function MapResizeWatcher() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        let frame = 0;
        function updateSize() {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
            frame = window.requestAnimationFrame(() => {
                map.invalidateSize();
                frame = 0;
            });
        }
        updateSize();
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateSize);
            return () => {
                window.removeEventListener("resize", updateSize);
                if (frame) {
                    window.cancelAnimationFrame(frame);
                }
            };
        }
        const observer = new ResizeObserver(updateSize);
        observer.observe(container);
        window.addEventListener("resize", updateSize);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateSize);
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [map]);
    return null;
}
function MunicipiosLayer({ municipios, municipioStats, selectedMunicipioId, maxQuantidadePdvs, onSelectMunicipio, }) {
    const map = useMap();
    const statsMap = new Map(municipioStats.map((municipio) => [municipio.id, municipio]));
    function getStyle(municipio) {
        const resumo = statsMap.get(municipio.id);
        const quantidadePdvs = resumo?.quantidadePdvs ?? 0;
        const color = getMunicipioFillColor(municipio.id);
        const strokeColor = getMunicipioStrokeColor(municipio.id);
        const hasPdv = quantidadePdvs > 0;
        const isSelected = selectedMunicipioId === municipio.id;
        const ratio = getBlueScaleRatio(quantidadePdvs, maxQuantidadePdvs);
        return {
            color: isSelected ? MUNICIPIO_SELECTED_COLOR : strokeColor,
            fillColor: color,
            fillOpacity: isSelected ? 0.72 : hasPdv ? 0.26 + ratio * 0.5 : 0.06,
            opacity: isSelected ? 1 : hasPdv ? 0.85 : 0.24,
            weight: isSelected ? 2.8 : hasPdv ? 1.4 : 0.75,
            dashArray: hasPdv ? undefined : "4 4",
        };
    }
    return (<>
      {municipios.map((municipio) => {
            const resumo = statsMap.get(municipio.id);
            function onEachFeature(_feature, layer) {
                layer.bindTooltip(`<strong>${municipio.label}</strong><br/>${resumo ? `${resumo.quantidadePdvs} PDVs · ${formatWeight(resumo.pesoBrutoKg)}` : "Sem PDV filtrado"}`, {
                    className: "logimarui-tooltip",
                    direction: "top",
                    sticky: true,
                });
                layer.on("click", () => {
                    onSelectMunicipio(municipio);
                    if (municipio.bounds?.isValid()) {
                        map.fitBounds(municipio.bounds, {
                            padding: [34, 34],
                            maxZoom: 12,
                            animate: true,
                        });
                    }
                });
            }
            return (<GeoJSON data={municipio.contornoGeojson} key={`${municipio.id}-municipio-${selectedMunicipioId ?? "all"}-${resumo?.quantidadePdvs ?? 0}`} onEachFeature={onEachFeature} style={() => getStyle(municipio)}/>);
        })}
    </>);
}
function BairrosLayer({ municipio, bairros, selectedBairroKey, maxQuantidadePdvs, renderMode, onSelectBairro, }) {
    const map = useMap();
    const bairroMap = new Map(bairros.map((bairro) => [bairro.bairroKey, bairro]));
    if (!municipio.bairroGeojson)
        return null;
    function getStyle(feature) {
        const bairro = feature ? getFeatureBairro(feature) : null;
        const bairroKey = getBairroScopeKey(municipio.id, bairro);
        const resumo = bairroMap.get(bairroKey);
        const quantidadePdvs = resumo?.quantidadePdvs ?? 0;
        const color = getMunicipioBairroFillColor(municipio.id, quantidadePdvs, maxQuantidadePdvs);
        const strokeColor = getMunicipioBairroStrokeColor(municipio.id);
        const hasPdv = quantidadePdvs > 0;
        const isSelected = selectedBairroKey === bairroKey;
        const hasSelection = selectedBairroKey !== null;
        const ratio = getBlueScaleRatio(quantidadePdvs, maxQuantidadePdvs);
        if (renderMode === "outline") {
            return {
                color: isSelected ? BAIRRO_SELECTED_COLOR : strokeColor,
                fillColor: strokeColor,
                fillOpacity: isSelected ? 0.08 : 0,
                opacity: isSelected ? 1 : hasSelection && !isSelected ? 0.34 : 0.72,
                weight: isSelected ? 2.6 : hasPdv ? 1.15 : 0.75,
                dashArray: hasPdv ? undefined : "4 4",
            };
        }
        return {
            color: isSelected ? BAIRRO_SELECTED_COLOR : strokeColor,
            fillColor: color,
            fillOpacity: isSelected ? 0.72 : hasSelection ? 0.08 : hasPdv ? 0.22 + ratio * 0.46 : 0.06,
            opacity: isSelected ? 1 : hasSelection && !isSelected ? 0.22 : hasPdv ? 0.76 : 0.2,
            weight: isSelected ? 2.6 : hasPdv ? 1.15 : 0.65,
            dashArray: hasPdv ? undefined : "4 4",
        };
    }
    function onEachFeature(feature, layer) {
        const bairro = normalizeBairro(getFeatureBairro(feature));
        const bairroKey = getBairroScopeKey(municipio.id, bairro);
        const resumo = bairroMap.get(bairroKey);
        layer.bindTooltip(`<strong>${bairro}</strong><br/><span>${municipio.label}</span><br/>${resumo ? `${resumo.quantidadePdvs} PDVs · ${formatWeight(resumo.pesoBrutoKg)}` : "Sem PDV filtrado"}`, {
            className: "logimarui-tooltip",
            direction: "top",
            sticky: true,
        });
        layer.on("click", () => {
            onSelectBairro(selectedBairroKey === bairroKey ? null : bairroKey);
            const layerWithBounds = layer;
            const bounds = layerWithBounds.getBounds?.();
            if (bounds?.isValid()) {
                map.fitBounds(bounds, {
                    padding: [34, 34],
                    maxZoom: 15,
                    animate: true,
                });
            }
        });
    }
    return (<GeoJSON data={municipio.bairroGeojson} key={`${municipio.id}-bairros-${selectedBairroKey ?? "all"}-${bairros.length}`} onEachFeature={onEachFeature} style={getStyle}/>);
}
function PointLayer({ clientes, selectionTool, onSelectCliente, }) {
    return (<>
      {clientes.map((cliente, index) => {
            const bairro = normalizeBairro(cliente.bairro);
            return (<Marker icon={createPointIcon(cliente)} eventHandlers={selectionTool === "point"
                    ? {
                        click: () => onSelectCliente(cliente),
                    }
                    : undefined} key={`pdv-${getClienteKey(cliente, index)}`} position={[cliente.latitude, cliente.longitude]}>
            <Tooltip className="logimarui-tooltip" direction="top" opacity={1}>
              <div className="min-w-52">
                <strong className="block text-[0.78rem] uppercase text-white">{cliente.nome}</strong>
                <span className="block text-[0.66rem] text-slate-300">
                  {cliente.cidade} / {bairro}
                </span>
              </div>
            </Tooltip>

            {selectionTool !== "point" && (<Popup className="logimarui-popup" closeButton>
                <div className="min-w-56">
                  <strong className="block text-[0.78rem] uppercase tracking-[0.03em] text-white">
                    PDV {cliente.clienteId} - {cliente.nome}
                  </strong>

                  <span className="mt-1 block text-[0.66rem] text-slate-300">
                    {cliente.cidade} / {bairro}
                  </span>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.68rem]">
                    <dt className="text-slate-400">Pedido</dt>
                    <dd className="text-right font-mono text-white">{cliente.pedidoId ?? "-"}</dd>

                    <dt className="text-slate-400">Bairro</dt>
                    <dd className="text-right font-mono text-white">{bairro}</dd>

                    <dt className="text-slate-400">Peso Bruto</dt>
                    <dd className="text-right font-mono text-white">{formatWeight(cliente.pesoBrutoKg)}</dd>

                    <dt className="text-slate-400">Volume</dt>
                    <dd className="text-right font-mono text-white">{formatVolume(cliente.volumeHl)}</dd>

                    <dt className="text-slate-400">Caixas</dt>
                    <dd className="text-right font-mono text-white">{formatNumber(cliente.caixas)}</dd>

                    <dt className="text-slate-400">Valor</dt>
                    <dd className="text-right font-mono text-white">{formatCurrency(cliente.valor)}</dd>
                  </dl>
                </div>
              </Popup>)}
          </Marker>);
        })}
    </>);
}
function SelectedPointLayer({ clientes, selectedClienteIds, }) {
    if (selectedClienteIds.size === 0)
        return null;
    return (<>
      {clientes
            .filter((cliente) => selectedClienteIds.has(cliente.clienteId))
            .map((cliente, index) => (<CircleMarker center={[cliente.latitude, cliente.longitude]} interactive={false} key={`selected-pdv-${getClienteKey(cliente, index)}`} pathOptions={SELECTED_POINT_PATH} radius={Math.max(11, getMarkerRadius(cliente) + 4)}/>))}
    </>);
}
function getLatLngTuple(latLng) {
    return [latLng.lat, latLng.lng];
}
function getSquareBounds(map, start, current) {
    const deltaX = current.x - start.x;
    const deltaY = current.y - start.y;
    const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const end = {
        x: start.x + Math.sign(deltaX || 1) * size,
        y: start.y + Math.sign(deltaY || 1) * size,
    };
    const startLatLng = map.containerPointToLatLng([start.x, start.y]);
    const endLatLng = map.containerPointToLatLng([end.x, end.y]);
    return latLngBounds([startLatLng, endLatLng]);
}
function SelectionDrawingLayer({ clientes, onApplySelection, selectionTool, }) {
    const map = useMap();
    const [dragStart, setDragStart] = useState(null);
    const [drawPreview, setDrawPreview] = useState(null);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const resetDraft = useCallback(() => {
        setDragStart(null);
        setDrawPreview(null);
        setPolygonPoints([]);
        map.dragging.enable();
    }, [map]);
    const applyClientesSelection = useCallback((kind, label, selectedClientes) => {
        onApplySelection(getSelectionPayload(kind, label, selectedClientes));
    }, [onApplySelection]);
    const finishDragSelection = useCallback((screenPoint) => {
        if (!dragStart)
            return;
        if (selectionTool === "box") {
            const bounds = getSquareBounds(map, dragStart, screenPoint);
            const selectedClientes = getClientesInsideBounds(clientes, bounds);
            applyClientesSelection("box", `Quadrado - ${formatNumber(selectedClientes.length)} PDVs`, selectedClientes);
            resetDraft();
            return;
        }
        if (selectionTool === "lasso" && drawPreview?.type === "lasso") {
            const selectedClientes = getClientesInsideRing(clientes, drawPreview.points);
            applyClientesSelection("lasso", `Laco - ${formatNumber(selectedClientes.length)} PDVs`, selectedClientes);
            resetDraft();
        }
    }, [applyClientesSelection, clientes, dragStart, drawPreview, map, resetDraft, selectionTool]);
    useEffect(() => {
        const timer = window.setTimeout(resetDraft, 0);
        return () => window.clearTimeout(timer);
    }, [resetDraft, selectionTool]);
    useEffect(() => {
        if (selectionTool === "polygon") {
            map.doubleClickZoom.disable();
            return () => {
                map.doubleClickZoom.enable();
            };
        }
        map.doubleClickZoom.enable();
        return undefined;
    }, [map, selectionTool]);
    useEffect(() => {
        if (!dragStart || (selectionTool !== "box" && selectionTool !== "lasso"))
            return undefined;
        function handleWindowMouseUp(event) {
            const containerPoint = map.mouseEventToContainerPoint(event);
            finishDragSelection({ x: containerPoint.x, y: containerPoint.y });
        }
        window.addEventListener("mouseup", handleWindowMouseUp);
        return () => {
            window.removeEventListener("mouseup", handleWindowMouseUp);
        };
    }, [dragStart, finishDragSelection, map, selectionTool]);
    useMapEvents({
        click(event) {
            if (selectionTool !== "polygon")
                return;
            setPolygonPoints((currentPoints) => {
                const nextPoints = [...currentPoints, getLatLngTuple(event.latlng)];
                setDrawPreview({ type: "polygon", points: nextPoints });
                return nextPoints;
            });
        },
        contextmenu() {
            if (selectionTool === "polygon") {
                resetDraft();
            }
        },
        dblclick(event) {
            if (selectionTool !== "polygon")
                return;
            const nextPoints = [...polygonPoints, getLatLngTuple(event.latlng)];
            const selectedClientes = getClientesInsideRing(clientes, nextPoints);
            applyClientesSelection("polygon", `Poligono - ${formatNumber(selectedClientes.length)} PDVs`, selectedClientes);
            resetDraft();
        },
        mousedown(event) {
            if (selectionTool !== "box" && selectionTool !== "lasso")
                return;
            map.dragging.disable();
            const startPoint = { x: event.containerPoint.x, y: event.containerPoint.y };
            setDragStart(startPoint);
            if (selectionTool === "lasso") {
                setDrawPreview({ type: "lasso", points: [getLatLngTuple(event.latlng)] });
            }
        },
        mousemove(event) {
            if (!dragStart)
                return;
            if (selectionTool === "box") {
                setDrawPreview({
                    type: "box",
                    bounds: getSquareBounds(map, dragStart, { x: event.containerPoint.x, y: event.containerPoint.y }),
                });
                return;
            }
            if (selectionTool === "lasso") {
                setDrawPreview((currentPreview) => {
                    const currentPoints = currentPreview?.type === "lasso" ? currentPreview.points : [];
                    const lastPoint = currentPoints[currentPoints.length - 1];
                    const nextPoint = getLatLngTuple(event.latlng);
                    if (lastPoint && Math.abs(lastPoint[0] - nextPoint[0]) + Math.abs(lastPoint[1] - nextPoint[1]) < 0.00018) {
                        return currentPreview;
                    }
                    return { type: "lasso", points: [...currentPoints, nextPoint] };
                });
            }
        },
    });
    if (!drawPreview)
        return null;
    if (drawPreview.type === "box") {
        return <Rectangle bounds={drawPreview.bounds} pathOptions={DRAW_PREVIEW_PATH}/>;
    }
    if (drawPreview.type === "polygon" && drawPreview.points.length < 3) {
        return <Polyline pathOptions={DRAW_PREVIEW_PATH} positions={drawPreview.points}/>;
    }
    return <Polygon pathOptions={DRAW_PREVIEW_PATH} positions={drawPreview.points}/>;
}
function MapToolRail({ activeTool, hasSelection, onClearSelection, onToolChange, topOffset, }) {
    const tools = [
        { icon: <MousePointer2 size={16}/>, label: "Navegar", tool: "pan" },
        { icon: <MapPinned size={16}/>, label: "Selecionar PDV", tool: "point" },
        { icon: <BoxSelect size={16}/>, label: "Quadrado 1:1", tool: "box" },
        { icon: <Spline size={16}/>, label: "Laco", tool: "lasso" },
        { icon: <Pentagon size={16}/>, label: "Poligono", tool: "polygon" },
        { icon: <Brush size={16}/>, label: "Cidade ou bairro", tool: "geo" },
    ];
    const topOffsetClass = getToolRailTopOffsetClass(topOffset);
    return (<div className={`pointer-events-auto absolute left-2 z-[720] overflow-hidden rounded-[5px] border border-white/10 bg-[#070d13]/95 shadow-[0_16px_36px_rgba(0,0,0,0.48)] backdrop-blur ${topOffsetClass}`}>
      <div className="grid w-10 gap-px bg-white/5 p-1">
        {tools.map((item) => {
            const active = activeTool === item.tool;
            return (<button aria-label={item.label} aria-pressed={active} className={`grid h-8 w-8 place-items-center rounded-[3px] transition ${active
                    ? "border border-cyan-300/45 bg-cyan-400/18 text-cyan-100"
                    : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"}`} key={item.tool} onClick={() => onToolChange(item.tool)} title={item.label} type="button">
              {item.icon}
            </button>);
        })}

        <div className="my-1 h-px bg-white/10"/>

        <button aria-label="Limpar selecao" className={`grid h-8 w-8 place-items-center rounded-[3px] border border-transparent transition ${hasSelection
            ? "text-amber-200 hover:border-amber-300/30 hover:bg-amber-400/12"
            : "text-slate-600"}`} disabled={!hasSelection} onClick={onClearSelection} title="Limpar selecao" type="button">
          <RotateCcw size={15}/>
        </button>
      </div>
    </div>);
}
function MapSelectionStatus({ activeTool, selection, topOffset, }) {
    const activeLabel = {
        pan: "Navegacao",
        point: "PDV",
        box: "Quadrado",
        lasso: "Laco",
        polygon: "Poligono",
        geo: "Cidade/bairro",
    }[activeTool];
    const topOffsetClass = getLegendTopOffsetClass(topOffset);
    const hasSelection = selection.clienteIds.length > 0;
    return (<div className={`pointer-events-auto absolute right-14 z-[640] flex min-h-8 max-w-[17rem] items-center gap-2 rounded-[3px] border border-cyan-400/16 bg-[#071119]/94 px-2.5 text-[0.6rem] shadow-[0_14px_35px_rgba(0,0,0,0.34)] backdrop-blur ${topOffsetClass}`}>
      <Info size={13} className={hasSelection ? "text-[var(--accent)]" : "text-[var(--cyan)]"}/>
      <span className="min-w-0 truncate font-bold uppercase tracking-[0.08em] text-slate-200">
        {hasSelection ? selection.label : "Global"}
      </span>
      <span className="shrink-0 border-l border-white/10 pl-2 font-mono text-cyan-200">{activeLabel}</span>
    </div>);
}
function formatMapScale(scaleMeters) {
    if (!Number.isFinite(scaleMeters))
        return "-";
    const formatter = new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: scaleMeters >= 1_000 ? 1 : 0,
    });
    if (scaleMeters >= 1_000) {
        return `${formatter.format(scaleMeters / 1_000)} km`;
    }
    return `${formatter.format(scaleMeters)} m`;
}
function getLegendTopOffsetClass(topOffset) {
    return topOffset === "kpi" ? "top-[21.25rem] md:top-[12rem] xl:top-[7.75rem]" : "top-3";
}
function getToolRailTopOffsetClass(topOffset) {
    return topOffset === "kpi" ? "top-[21.25rem] md:top-[12rem] xl:top-[7.75rem]" : "top-12";
}
function MapLegend({ mapMode, bairroRenderMode, municipioStats, bairroStats, selectedBairroKey, loadingGeojson, erroGeojson, totalMunicipios, visibleBairrosCount, showPointLayer, scaleMeters, onSelectBairro, onClose, topOffset, }) {
    const topMunicipios = municipioStats.slice(0, 10);
    const topBairros = bairroStats.slice(0, 10);
    const outrosBairros = Math.max(0, bairroStats.length - topBairros.length);
    const topOffsetClass = getLegendTopOffsetClass(topOffset);
    const title = mapMode === "municipio" ? "Cidades" : "Bairros";
    const subtitle = mapMode === "municipio"
        ? "Entregas por cidade"
        : bairroRenderMode === "outline"
            ? "Divisão por bairro"
            : "Entregas por bairro";
    return (<div className={`pointer-events-auto absolute left-14 z-[500] w-64 overflow-hidden rounded border border-cyan-400/15 bg-[#071119]/92 text-[0.64rem] text-slate-300 shadow-[0_16px_38px_rgba(0,0,0,0.45)] backdrop-blur ${topOffsetClass}`}>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a1822] px-2.5 py-1.5">
        <span className="font-bold uppercase tracking-[0.12em] text-white">{title}</span>
        <span className="flex items-center gap-2">
          <span className="text-cyan-300">{loadingGeojson ? "Carregando" : `${totalMunicipios} GeoJSON · ${formatMapScale(scaleMeters)}`}</span>
          <button aria-label="Ocultar painel de cidades e bairros" className="grid h-5 w-5 place-items-center rounded-[3px] border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-cyan-400/35 hover:text-white" onClick={onClose} type="button">
            <X size={11}/>
          </button>
        </span>
      </div>

      <div className="px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-semibold uppercase tracking-[0.08em] text-cyan-300">{subtitle}</span>
          <span className="font-mono text-[0.6rem] text-slate-400">
            {mapMode === "municipio" ? formatNumber(municipioStats.length) : formatNumber(bairroStats.length)}
          </span>
        </div>

        {mapMode === "municipio" ? (<div className="mb-2 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.58rem] leading-snug text-slate-300">
            Cores fixas por cidade. A intensidade ainda varia pela quantidade de PDVs.
          </div>) : bairroRenderMode === "heat" ? (<div className="mb-2 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.58rem] leading-snug text-slate-300">
            Bairros seguem a cor da cidade. A intensidade do preenchimento varia pela quantidade de PDVs.
          </div>) : (<div className="mb-2 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.58rem] leading-snug text-slate-300">
            Mapa de calor desativado neste nível. Mantendo apenas o contorno dos bairros na cor da cidade.
          </div>)}

        {mapMode === "bairro" && (<div className="mb-2 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.58rem] leading-snug text-slate-300">
            Bairros na tela: <strong className="text-cyan-100">{formatNumber(visibleBairrosCount)}</strong> · Pontos:{" "}
            <strong className={showPointLayer ? "text-cyan-100" : "text-slate-500"}>{showPointLayer ? "visíveis" : "ocultos"}</strong>
          </div>)}

        {selectedBairroKey !== null && (<button className="mb-2 w-full rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-cyan-200 hover:bg-cyan-400/15" onClick={() => onSelectBairro(null)} type="button">
            Limpar seleção de bairro
          </button>)}

        {erroGeojson && (<div className="mb-2 rounded border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[0.58rem] leading-snug text-amber-100">
            Alguns GeoJSON não carregaram: {erroGeojson}
          </div>)}

        {loadingGeojson && (<div className="mb-2 rounded border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[0.58rem] leading-snug text-cyan-100">
            Carregando contornos e bairros por município...
          </div>)}

        {mapMode === "municipio" ? (<div className="space-y-1.5">
            {topMunicipios.map((municipio) => (<div className="flex w-full items-center justify-between gap-3 rounded px-1 py-0.5" key={municipio.id}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/50" style={{
                    backgroundColor: municipio.color,
                    boxShadow: `0 0 12px ${municipio.color}`,
                }}/>
                  <span className="min-w-0">
                    <span className="block truncate">{municipio.municipio}</span>
                  </span>
                </span>

                <span className="shrink-0 font-mono text-cyan-100">{formatNumber(municipio.quantidadePdvs)}</span>
              </div>))}
          </div>) : (<>
            <div className="space-y-1.5">
              {topBairros.map((bairro) => {
                const selected = selectedBairroKey === bairro.bairroKey;
                return (<button className={`flex w-full items-center justify-between gap-3 rounded px-1 py-0.5 text-left transition ${selected ? "bg-cyan-400/12 text-white" : "hover:bg-white/[0.04]"}`} key={bairro.id} onClick={() => onSelectBairro(selected ? null : bairro.bairroKey)} type="button">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/50" style={{
                        backgroundColor: bairro.color,
                        boxShadow: `0 0 12px ${bairro.color}`,
                    }}/>
                      <span className="min-w-0">
                        <span className="block truncate">{bairro.bairro}</span>
                        <span className="block truncate text-[0.56rem] uppercase tracking-[0.08em] text-slate-500">
                          {bairro.municipio}
                        </span>
                      </span>
                    </span>

                    <span className="shrink-0 font-mono text-cyan-100">{formatNumber(bairro.quantidadePdvs)}</span>
                  </button>);
            })}
            </div>

            {outrosBairros > 0 && (<div className="mt-2 border-t border-white/10 pt-1.5 text-[0.6rem] text-slate-500">
                + {formatNumber(outrosBairros)} bairros fora do top 10
              </div>)}
          </>)}
      </div>
    </div>);
}
export function PdvLeaflet({ clientes, onSelectionChange, overlayHeaderOpen = false, selectedClienteIds, selection, }) {
    const [selectedMunicipioId, setSelectedMunicipioId] = useState(null);
    const [selectedBairroKey, setSelectedBairroKey] = useState(null);
    const [selectionTool, setSelectionTool] = useState("pan");
    const [showMapLegend, setShowMapLegend] = useState(true);
    const [viewport, setViewport] = useState({ bounds: null, scaleMeters: Number.POSITIVE_INFINITY });
    const { municipios, loadingGeojson, erroGeojson } = useMunicipiosGeojson();
    const validClientes = useMemo(() => getValidClientes(clientes), [clientes]);
    const selectedClienteIdSet = useMemo(() => new Set(selectedClienteIds), [selectedClienteIds]);
    const center = useMemo(() => getCenter(validClientes), [validClientes]);
    const municipioResumo = useMemo(() => buildMunicipiosResumo(municipios, validClientes), [municipios, validClientes]);
    const municipioStats = useMemo(() => [...municipioResumo].sort((a, b) => b.quantidadePdvs - a.quantidadePdvs), [municipioResumo]);
    const maxQuantidadePdvsMunicipio = useMemo(() => Math.max(1, ...municipioResumo.map((municipio) => municipio.quantidadePdvs)), [municipioResumo]);
    const bairros = useMemo(() => buildBairrosResumo(municipios, validClientes), [municipios, validClientes]);
    const bairroStats = useMemo(() => [...bairros].sort((a, b) => b.quantidadePdvs - a.quantidadePdvs), [bairros]);
    const maxQuantidadePdvsBairro = useMemo(() => Math.max(1, ...bairros.map((bairro) => bairro.quantidadePdvs)), [bairros]);
    const bairrosGeoIndex = useMemo(() => buildBairrosGeoIndex(municipios), [municipios]);
    const selectedBairro = useMemo(() => bairros.find((bairro) => bairro.bairroKey === selectedBairroKey) ?? null, [bairros, selectedBairroKey]);
    const isMunicipioScale = selectedMunicipioId === null && viewport.scaleMeters > MUNICIPIO_SCALE_METERS;
    const mapMode = isMunicipioScale ? "municipio" : "bairro";
    const bairroRenderMode = viewport.scaleMeters <= BAIRRO_OUTLINE_ONLY_SCALE_METERS ? "outline" : "heat";
    const legendTopOffset = overlayHeaderOpen ? "kpi" : "default";
    const bairrosVisiveisNaTela = useMemo(() => {
        if (mapMode === "municipio")
            return [];
        return bairrosGeoIndex.filter((bairro) => boundsIntersects(viewport.bounds, bairro.bounds));
    }, [bairrosGeoIndex, mapMode, viewport.bounds]);
    const shouldExposeSelectionPoints = selectionTool !== "pan" && selectionTool !== "geo";
    const showPointLayer = (mapMode === "bairro" && (selectedBairro !== null || viewport.scaleMeters <= POINT_LAYER_SCALE_METERS)) ||
        shouldExposeSelectionPoints ||
        selectedClienteIds.length > 0;
    const clientesNoViewport = useMemo(() => getClientesNoViewport(validClientes, viewport.bounds), [validClientes, viewport.bounds]);
    const clientesSemGeojson = useMemo(() => {
        if (loadingGeojson)
            return [];
        return validClientes.filter((cliente) => !hasGeojsonForCliente(cliente, municipios));
    }, [loadingGeojson, municipios, validClientes]);
    const clientesVisiveis = useMemo(() => {
        if (selectedBairro)
            return selectedBairro.clientes;
        if (showPointLayer)
            return clientesNoViewport;
        if (!loadingGeojson && municipios.length === 0)
            return validClientes;
        return clientesSemGeojson;
    }, [clientesNoViewport, clientesSemGeojson, loadingGeojson, municipios.length, selectedBairro, showPointLayer, validClientes]);
    const municipiosParaBairroLayer = useMemo(() => {
        if (mapMode !== "bairro")
            return [];
        if (!selectedMunicipioId)
            return municipios;
        return municipios.filter((municipio) => municipio.id === selectedMunicipioId);
    }, [mapMode, municipios, selectedMunicipioId]);
    const handleViewportChange = useCallback((nextViewport) => {
        setViewport(nextViewport);
    }, []);
    const handleApplySelection = useCallback((nextSelection) => {
        onSelectionChange(nextSelection);
    }, [onSelectionChange]);
    const handleClearSelection = useCallback(() => {
        setSelectedBairroKey(null);
        onSelectionChange(emptyMapSelection);
    }, [onSelectionChange]);
    const handleSelectCliente = useCallback((cliente) => {
        const nextClienteIds = new Set(selectedClienteIds);
        if (nextClienteIds.has(cliente.clienteId)) {
            nextClienteIds.delete(cliente.clienteId);
        }
        else {
            nextClienteIds.add(cliente.clienteId);
        }
        const nextSelectedClientes = validClientes.filter((item) => nextClienteIds.has(item.clienteId));
        onSelectionChange(getSelectionPayload("point", `Manual - ${formatNumber(nextSelectedClientes.length)} PDVs`, nextSelectedClientes));
    }, [onSelectionChange, selectedClienteIds, validClientes]);
    const handleSelectMunicipio = useCallback((municipio) => {
        setSelectedMunicipioId(municipio.id);
        setSelectedBairroKey(null);
        const resumo = municipioResumo.find((item) => item.id === municipio.id);
        onSelectionChange(getSelectionPayload("city", `Cidade - ${municipio.label}`, resumo?.clientes ?? []));
        // Evita o reset imediato do drilldown quando o clique ocorre ainda na escala ampla de cidades.
        // Sem isso, o primeiro clique só aproxima o mapa e o usuário precisa clicar de novo para ver bairros.
        setViewport((currentViewport) => ({
            ...currentViewport,
            scaleMeters: Math.min(currentViewport.scaleMeters, MUNICIPIO_SCALE_METERS),
        }));
    }, [municipioResumo, onSelectionChange]);
    const handleSelectBairro = useCallback((bairroKey) => {
        setSelectedBairroKey(bairroKey);
        if (!bairroKey) {
            onSelectionChange(emptyMapSelection);
            return;
        }
        const bairro = bairros.find((item) => item.bairroKey === bairroKey);
        onSelectionChange(getSelectionPayload("bairro", `Bairro - ${bairro?.bairro ?? "selecionado"}`, bairro?.clientes ?? []));
    }, [bairros, onSelectionChange]);
    useEffect(() => {
        const shouldResetDrilldown = viewport.scaleMeters >= RESET_DRILLDOWN_SCALE_METERS;
        const shouldResetBairro = !shouldResetDrilldown && mapMode === "municipio";
        if (!shouldResetDrilldown && !shouldResetBairro)
            return;
        const timer = window.setTimeout(() => {
            if (shouldResetDrilldown) {
                setSelectedMunicipioId(null);
                setSelectedBairroKey(null);
                return;
            }
            setSelectedBairroKey(null);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [mapMode, viewport.scaleMeters]);
    return (<div className="relative h-full w-full overflow-hidden bg-[#061018]">
      <MapContainer attributionControl center={center} className="logimarui-map h-full w-full bg-[#061018]" maxZoom={16} minZoom={6} preferCanvas scrollWheelZoom zoom={8} zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap' detectRetina url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"/>

        <ZoomControl position="topright"/>
        <ScaleControl imperial={false} position="bottomleft"/>

        <MapAutoFit clientes={validClientes} municipios={municipios}/>
        <MapViewportTracker onViewportChange={handleViewportChange}/>
        <MapResizeWatcher />
        <SelectionDrawingLayer clientes={validClientes} onApplySelection={handleApplySelection} selectionTool={selectionTool}/>

        {mapMode === "municipio" && (<MunicipiosLayer maxQuantidadePdvs={maxQuantidadePdvsMunicipio} municipioStats={municipioResumo} municipios={municipios} onSelectMunicipio={handleSelectMunicipio} selectedMunicipioId={selectedMunicipioId}/>)}

        {mapMode === "bairro" &&
            municipiosParaBairroLayer.map((municipio) => (<BairrosLayer bairros={bairros.filter((bairro) => bairro.municipioId === municipio.id)} key={municipio.id} maxQuantidadePdvs={maxQuantidadePdvsBairro} municipio={municipio} onSelectBairro={handleSelectBairro} renderMode={bairroRenderMode} selectedBairroKey={selectedBairroKey}/>))}

        {showPointLayer && (<PointLayer clientes={clientesVisiveis} onSelectCliente={handleSelectCliente} selectionTool={selectionTool}/>)}
        <SelectedPointLayer clientes={validClientes} selectedClienteIds={selectedClienteIdSet}/>
      </MapContainer>

      <MapToolRail activeTool={selectionTool} hasSelection={selectedClienteIds.length > 0} onClearSelection={handleClearSelection} onToolChange={setSelectionTool} topOffset={legendTopOffset}/>
      <MapSelectionStatus activeTool={selectionTool} selection={selection} topOffset={legendTopOffset}/>

      {showMapLegend ? (<MapLegend bairroRenderMode={bairroRenderMode} bairroStats={bairroStats} erroGeojson={erroGeojson} loadingGeojson={loadingGeojson} mapMode={mapMode} municipioStats={municipioStats} onClose={() => setShowMapLegend(false)} onSelectBairro={handleSelectBairro} scaleMeters={viewport.scaleMeters} selectedBairroKey={selectedBairroKey} showPointLayer={showPointLayer} topOffset={legendTopOffset} totalMunicipios={municipios.length} visibleBairrosCount={bairrosVisiveisNaTela.length}/>) : (<button aria-label="Mostrar painel de cidades e bairros" className={`pointer-events-auto absolute left-14 z-[500] inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-cyan-400/25 bg-[#071119]/95 px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-cyan-200 shadow-[0_14px_35px_rgba(0,0,0,0.36)] backdrop-blur transition hover:border-cyan-300 hover:bg-cyan-400/14 ${getLegendTopOffsetClass(legendTopOffset)}`} onClick={() => setShowMapLegend(true)} type="button">
          <BarChart3 size={13}/>
          Cidades
        </button>)}

      <style jsx global>{`
        .logimarui-map {
          font-family: inherit;
        }

        .logimarui-map .leaflet-control-zoom {
          overflow: hidden;
          border: 1px solid rgba(0, 212, 255, 0.18);
          border-radius: 3px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.36);
        }

        .logimarui-map .leaflet-control-zoom a {
          width: 28px;
          height: 28px;
          border: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(7, 17, 25, 0.96);
          color: #dffbff;
          font-size: 18px;
          line-height: 28px;
        }

        .logimarui-map .leaflet-control-zoom a:hover {
          background: rgba(0, 212, 255, 0.16);
          color: #ffffff;
        }

        .logimarui-map .leaflet-control-attribution {
          border-top-left-radius: 3px;
          background: rgba(5, 10, 15, 0.72);
          color: #8ca6b6;
          font-size: 10px;
        }

        .logimarui-map .leaflet-control-attribution a {
          color: #27d7ff;
        }

        .logimarui-map .leaflet-control-scale-line {
          border-color: rgba(220, 247, 255, 0.78);
          background: rgba(5, 10, 15, 0.72);
          color: #dce7ef;
          text-shadow: none;
        }

        .logimarui-map-div-icon {
          border: 0;
          background: transparent;
        }

        .logimarui-map .leaflet-tooltip.logimarui-tooltip {
          border: 1px solid rgba(0, 212, 255, 0.26);
          border-radius: 4px;
          background: rgba(7, 17, 25, 0.96);
          color: #dce7ef;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.48), 0 0 18px rgba(0, 212, 255, 0.12);
        }

        .logimarui-map .leaflet-tooltip-top::before {
          border-top-color: rgba(7, 17, 25, 0.96);
        }

        .logimarui-map .leaflet-popup-content-wrapper {
          border: 1px solid rgba(0, 212, 255, 0.24);
          border-radius: 4px;
          background: rgba(7, 17, 25, 0.98);
          color: #dce7ef;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.55), 0 0 22px rgba(0, 212, 255, 0.12);
        }

        .logimarui-map .leaflet-popup-content {
          margin: 12px;
        }

        .logimarui-map .leaflet-popup-tip {
          background: rgba(7, 17, 25, 0.98);
          box-shadow: none;
        }

        .logimarui-map .leaflet-popup-close-button {
          color: #8ca6b6;
        }

        .logimarui-map .leaflet-popup-close-button:hover {
          color: #ffffff;
        }
      `}</style>
    </div>);
}
