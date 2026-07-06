"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { AlertTriangle, MapPin, Navigation, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

interface Coordinates {
  lat?: number;
  lng?: number;
}

interface Delivery {
  id: string;
  status: string;
  estimatedDeliveryAt?: string;
  estimatedDistanceKm?: number;
  driver?: { firstName?: string; lastName?: string; email?: string };
  order?: { orderCode?: string };
  pickupLocation?: { name?: string; address?: string; coordinates?: Coordinates };
  deliveryLocation?: { address?: string; coordinates?: Coordinates };
  trackingPath?: Array<{ lat: number; lng: number; timestamp?: string }>;
}

const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];

function validPoint(point?: Coordinates): point is { lat: number; lng: number } {
  return typeof point?.lat === "number" && typeof point?.lng === "number" && point.lat !== 0 && point.lng !== 0;
}

function titleCaseStatus(status: string) {
  if (status === "in_transit") return "ON ROUTE";
  if (status === "at_pickup" || status === "driver_acknowledged") return "PICKING UP";
  if (status === "item_packed" || status === "qr_tagged") return "QUALITY CHECK";
  return status.replace(/_/g, " ").toUpperCase();
}

function markerColor(status: string) {
  if (status === "in_transit") return "#2563eb";
  if (status === "at_pickup" || status === "driver_acknowledged") return "#d97706";
  if (status === "failed") return "#e11d48";
  if (status === "item_packed" || status === "qr_tagged") return "#c026d3";
  return "#10b981";
}

function driverName(delivery: Delivery) {
  return `${delivery.driver?.firstName || ""} ${delivery.driver?.lastName || ""}`.trim() || delivery.driver?.email || "Unassigned";
}

function etaLabel(value?: string) {
  if (!value) return "ETA pending";
  const minutes = Math.max(1, Math.round((new Date(value).getTime() - Date.now()) / 60000));
  return `ETA ${minutes} mins`;
}

export function MapboxOperationsMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const { data, isLoading, error } = useApiQuery<Delivery[]>(["admin", "active-dispatch", "map"], "/admin/dispatch/active");
  const deliveries = data || [];

  const mappedDeliveries = useMemo(() => deliveries.filter((delivery) => (
    validPoint(delivery.pickupLocation?.coordinates) || validPoint(delivery.deliveryLocation?.coordinates) || (delivery.trackingPath || []).some((point) => validPoint(point))
  )), [deliveries]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: LAGOS_CENTER,
      zoom: 11.5,
      pitch: 62,
      bearing: -18,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("load", () => {
      const layers = map.getStyle().layers || [];
      const labelLayerId = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;
      map.addLayer(
        {
          id: "hook-3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 10,
          paint: {
            "fill-extrusion-color": "#d7dce4",
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 10, 0, 15, ["get", "height"]],
            "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 10, 0, 15, ["get", "min_height"]],
            "fill-extrusion-opacity": 0.58,
          },
        },
        labelLayerId,
      );
      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const bounds = new mapboxgl.LngLatBounds();

    mappedDeliveries.forEach((delivery) => {
      const points = [
        { type: "Pickup", address: delivery.pickupLocation?.name || delivery.pickupLocation?.address, coordinates: delivery.pickupLocation?.coordinates },
        { type: "Delivery", address: delivery.deliveryLocation?.address, coordinates: delivery.deliveryLocation?.coordinates },
      ].filter((point) => validPoint(point.coordinates));

      points.forEach((point) => {
        const element = document.createElement("div");
        element.className = "grid size-8 place-items-center rounded-full border-2 border-white shadow-lg";
        element.style.background = markerColor(delivery.status);
        element.innerHTML = point.type === "Pickup"
          ? '<span style="width:8px;height:8px;border-radius:999px;background:white;display:block"></span>'
          : '<span style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid white;display:block"></span>';

        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(`
          <div style="font-family:Inter,system-ui,sans-serif;min-width:190px">
            <strong>${delivery.order?.orderCode || `DEL-${delivery.id.slice(0, 6).toUpperCase()}`}</strong>
            <p style="margin:6px 0 0;color:#475569">${point.type}: ${point.address || "Location pending"}</p>
            <p style="margin:6px 0 0;color:#64748b">${driverName(delivery)} · ${etaLabel(delivery.estimatedDeliveryAt)}</p>
          </div>
        `);

        const lngLat: [number, number] = [point.coordinates!.lng!, point.coordinates!.lat!];
        markersRef.current.push(new mapboxgl.Marker(element).setLngLat(lngLat).setPopup(popup).addTo(mapRef.current!));
        bounds.extend(lngLat);
      });
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 90, maxZoom: 14, duration: 900 });
    }
  }, [mappedDeliveries, mapReady]);

  if (!token) {
    return (
      <Card className="rounded-lg border-amber-200 bg-amber-50 shadow-none">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-amber-800">
          <AlertTriangle size={18} /> Mapbox token is missing. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to the admin env file.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden rounded-lg border-zinc-200 py-0 shadow-card">
        <CardContent className="relative h-[520px] p-0">
          <div ref={containerRef} className="absolute inset-0" />
          {(!mapReady || isLoading) && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-white/80">
              <HookLoader label="Loading operations map..." />
            </div>
          )}
          {error && (
            <div className="absolute left-4 right-4 top-4 z-10 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Operations data could not be loaded.
            </div>
          )}
          {!isLoading && mappedDeliveries.length === 0 && (
            <div className="absolute inset-x-4 bottom-4 z-10 rounded-lg border border-zinc-200 bg-white/95 p-4 text-sm text-zinc-600 shadow-sm">
              No active deliveries have map coordinates yet. New dispatch jobs with pickup or delivery coordinates will appear here.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-semibold text-zinc-900">Live Dispatch</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{mappedDeliveries.length} mapped of {deliveries.length} active deliveries</p>

          <div className="mt-4 space-y-3">
            {deliveries.map((delivery) => {
              const hasCoordinates = validPoint(delivery.pickupLocation?.coordinates) || validPoint(delivery.deliveryLocation?.coordinates);
              return (
                <div key={delivery.id} className={cn("rounded-lg border border-zinc-100 bg-zinc-50 p-3", !hasCoordinates && "opacity-70")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-zinc-950">{delivery.order?.orderCode || `DEL-${delivery.id.slice(0, 6).toUpperCase()}`}</span>
                    <StatusBadge status={titleCaseStatus(delivery.status)} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
                    <Truck size={13} /> {driverName(delivery)}
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {delivery.pickupLocation?.name || delivery.pickupLocation?.address || "Pickup pending"}</span>
                    <span className="flex items-center gap-1.5"><Navigation size={12} /> {delivery.deliveryLocation?.address || "Delivery pending"}</span>
                  </div>
                </div>
              );
            })}
            {!isLoading && deliveries.length === 0 && (
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
                No active deliveries right now.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
