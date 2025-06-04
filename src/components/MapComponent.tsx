import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  MapPin,
  Share,
  Droplets,
  Users,
  Shield,
  Car,
  User,
  Navigation,
  MapPinIcon,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import WaterFloodMarker from "./WaterFloodMarker";
import WeatherChart from "./WeatherChart";
import { createRoot } from "react-dom/client";
import useRealTimeData from "@/hooks/useRealTimeData";
import useNotifications from "@/hooks/useNotifications";
import useGeolocation from "@/hooks/useGeolocation";
import useOfflineMode from "@/hooks/useOfflineMode";
import LocationSearchBar from "@/components/LocationSearchBar";

const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [routeMode, setRouteMode] = useState<"car" | "walking" | null>(null);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // Novos hooks integrados
  const {
    data: realTimeData,
    isLoading: isDataLoading,
    addAlert,
  } = useRealTimeData();
  const {
    permission: notificationPermission,
    requestPermission,
    sendFloodAlert,
    canSendNotifications,
    unreadCount,
  } = useNotifications();
  const {
    position: userPosition,
    getCurrentPosition: getUserLocation,
    startWatching: startLocationWatching,
    isInDangerZone,
    findNearestSafeZone,
  } = useGeolocation();
  const {
    isOnline,
    isOfflineMode,
    hasOfflineData,
    saveOfflineReport,
    downloadOfflineData,
    queuedActions,
    needsSync,
  } = useOfflineMode();

  // Chave padrão do Mapbox para todos os usuários
  const mapboxToken =
    "pk.eyJ1IjoiZXJpY2tjYXJkb3NvIiwiYSI6ImNtYmE1dGkyNTA3am4ybG9sMDQxZ2ptYmgifQ.MQMRf8oeujyQ6G-Y6hMW-A";

  // Mock data for pins with visual indicators
  const mockReports = [
    {
      id: 1,
      lat: -23.5505,
      lng: -46.6333,
      severity: "normal",
      description: "Situação normal",
      type: "normal",
    },
    {
      id: 2,
      lat: -23.5615,
      lng: -46.6565,
      severity: "warning",
      description: "Alagamento leve",
      type: "flood",
    },
    {
      id: 3,
      lat: -23.5485,
      lng: -46.6425,
      severity: "danger",
      description: "Enchente grave",
      type: "flood",
    },
    {
      id: 4,
      lat: -23.5575,
      lng: -46.6395,
      severity: "danger",
      description: "Deslizamento de terra",
      type: "disaster",
    },
    {
      id: 5,
      lat: -23.5445,
      lng: -46.6275,
      severity: "warning",
      description: "Risco de alagamento",
      type: "flood",
    },
    {
      id: 6,
      lat: -23.5525,
      lng: -46.6455,
      severity: "danger",
      description: "Área evacuada",
      type: "disaster",
    },
  ];

  // Locais seguros para evacuação
  const safeLocations = [
    {
      id: 1,
      lat: -23.532,
      lng: -46.642,
      name: "Centro de Evacuação Paulista",
      type: "evacuation_center",
    },
    {
      id: 2,
      lat: -23.565,
      lng: -46.62,
      name: "Abrigo Municipal Vila Olímpia",
      type: "shelter",
    },
    {
      id: 3,
      lat: -23.528,
      lng: -46.658,
      name: "Hospital das Clínicas",
      type: "hospital",
    },
    {
      id: 4,
      lat: -23.542,
      lng: -46.618,
      name: "Posto de Bombeiros Central",
      type: "fire_station",
    },
  ];

  // Mock data for charts and statistics
  const weatherData = [
    { day: "Seg", precipitation: 15 },
    { day: "Ter", precipitation: 32 },
    { day: "Qua", precipitation: 48 },
    { day: "Qui", precipitation: 35 },
    { day: "Sex", precipitation: 22 },
    { day: "Sáb", precipitation: 8 },
    { day: "Dom", precipitation: 12 },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "normal":
        return "#10b981";
      case "warning":
        return "#f59e0b";
      case "danger":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "normal":
        return "Sem risco";
      case "warning":
        return "Alerta";
      case "danger":
        return "Área alagada";
      default:
        return "Desconhecido";
    }
  };

  const getTypeIcon = (type: string, severity: string) => {
    if (type === "flood") {
      return severity === "danger" ? "💧💧💧" : "💧";
    } else if (type === "disaster") {
      return "⚠️";
    }
    return "✅";
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "flood":
        return "Área Alagada";
      case "disaster":
        return "Desastre Natural";
      default:
        return "Situação Normal";
    }
  };

  const getCurrentLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada pelo navegador"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setCurrentLocation(coords);
          resolve(coords);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  const findNearestSafeLocation = (userLocation: [number, number]) => {
    let nearest = safeLocations[0];
    let minDistance = Number.MAX_VALUE;

    for (const location of safeLocations) {
      // Verificar se o local não está em área de risco
      const isInDangerZone = mockReports.some((report) => {
        if (report.severity === "danger") {
          const distance = Math.sqrt(
            Math.pow(location.lng - report.lng, 2) +
              Math.pow(location.lat - report.lat, 2)
          );
          return distance < 0.01; // ~1km de distância
        }
        return false;
      });

      if (!isInDangerZone) {
        const distance = Math.sqrt(
          Math.pow(userLocation[0] - location.lng, 2) +
            Math.pow(userLocation[1] - location.lat, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = location;
        }
      }
    }

    return nearest;
  };

  const calculateEscapeRoute = async (
    start: [number, number],
    end: [number, number],
    profile: "driving" | "walking"
  ) => {
    if (!mapInstanceRef.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxToken}&exclude=ferry&alternatives=true&steps=true`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // Filtrar rota que evita áreas perigosas
        let safeRoute = data.routes[0];

        for (const route of data.routes) {
          const routeCoords = route.geometry.coordinates;
          let passesByDanger = false;

          for (const report of mockReports) {
            if (report.severity === "danger") {
              for (const coord of routeCoords) {
                const distance = Math.sqrt(
                  Math.pow(coord[0] - report.lng, 2) +
                    Math.pow(coord[1] - report.lat, 2)
                );
                if (distance < 0.005) {
                  // ~500m de distância
                  passesByDanger = true;
                  break;
                }
              }
              if (passesByDanger) break;
            }
          }

          if (!passesByDanger) {
            safeRoute = route;
            break;
          }
        }

        // Limpar rota anterior
        if (mapInstanceRef.current.getSource("route")) {
          mapInstanceRef.current.removeLayer("route");
          mapInstanceRef.current.removeSource("route");
        }

        // Adicionar rota ao mapa
        mapInstanceRef.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: safeRoute.geometry,
          },
        });

        mapInstanceRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": profile === "driving" ? "#2563eb" : "#059669",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });

        // Ajustar zoom para mostrar toda a rota
        const coordinates = safeRoute.geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        mapInstanceRef.current.fitBounds(bounds, {
          padding: 50,
        });

        console.log(`Rota de fuga calculada (${profile}):`, safeRoute);
      }
    } catch (error) {
      console.error("Erro ao calcular rota de fuga:", error);
    }
  };

  const startEscapeRoute = async (mode: "car" | "walking") => {
    setRouteMode(mode);
    setIsCalculatingRoute(true);

    try {
      // Obter localização atual
      const userLocation = await getCurrentLocation();

      // Encontrar o local seguro mais próximo
      const safeLocation = findNearestSafeLocation(userLocation);
      const destination: [number, number] = [
        safeLocation.lng,
        safeLocation.lat,
      ];

      if (!mapInstanceRef.current) return;

      // Adicionar marcador da localização atual
      new mapboxgl.Marker({ color: "#10b981" })
        .setLngLat(userLocation)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            "<div><strong>📍 Sua localização</strong></div>"
          )
        )
        .addTo(mapInstanceRef.current);

      // Adicionar marcador do destino seguro
      new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat(destination)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<div><strong>🏥 ${safeLocation.name}</strong><br/>Local seguro</div>`
          )
        )
        .addTo(mapInstanceRef.current);

      // Calcular rota de fuga
      const profile = mode === "car" ? "driving" : "walking";
      await calculateEscapeRoute(userLocation, destination, profile);
    } catch (error) {
      console.error("Erro ao calcular rota de fuga:", error);
      alert(
        "Não foi possível obter sua localização. Verifique as permissões do navegador."
      );
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const clearRoute = () => {
    setRouteMode(null);
    setIsCalculatingRoute(false);

    if (mapInstanceRef.current && mapInstanceRef.current.getSource("route")) {
      mapInstanceRef.current.removeLayer("route");
      mapInstanceRef.current.removeSource("route");
    }

    // Remover marcadores existentes (seria melhor manter referências, mas para simplicidade)
    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach((marker) => {
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    });
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log("Inicializando mapa com token:", mapboxToken);

    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken;

    try {
      // Initialize the map
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-46.6333, -23.5505],
        zoom: 13,
        pitch: 45,
        bearing: 0,
      });

      mapInstanceRef.current = map;

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add 3D buildings layer
      map.on("style.load", () => {
        console.log("Estilo do mapa carregado");

        // Add 3D buildings
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
        )?.id;

        map.addLayer(
          {
            id: "add-3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.6,
            },
          },
          labelLayerId
        );

        // Add enhanced markers for reports with visual indicators
        mockReports.forEach((report) => {
          let markerElement: HTMLDivElement;

          if (report.type === "flood") {
            // Para áreas alagadas, usar o componente de água vetorial
            markerElement = document.createElement("div");
            markerElement.className = "water-flood-container";
            markerElement.style.position = "relative";
            markerElement.style.cursor = "pointer";

            // Criar root do React para renderizar o componente de água
            const root = createRoot(markerElement);
            root.render(
              React.createElement(WaterFloodMarker, {
                severity: report.severity as "warning" | "danger",
                size: report.severity === "danger" ? "large" : "medium",
              })
            );

            // Adicionar fonte de dados de área alagada para polígonos (para enchentes graves)
            if (report.severity === "danger") {
              // Criar polígono de área alagada ao redor do ponto
              const floodRadius = 0.005; // Aproximadamente 500m
              const floodCoordinates = [
                [report.lng - floodRadius, report.lat - floodRadius],
                [report.lng + floodRadius, report.lat - floodRadius],
                [report.lng + floodRadius, report.lat + floodRadius],
                [report.lng - floodRadius, report.lat + floodRadius],
                [report.lng - floodRadius, report.lat - floodRadius],
              ];

              // Adicionar fonte de dados para a área alagada
              map.addSource(`flood-area-${report.id}`, {
                type: "geojson",
                data: {
                  type: "Feature",
                  geometry: {
                    type: "Polygon",
                    coordinates: [floodCoordinates],
                  },
                  properties: {
                    severity: report.severity,
                  },
                },
              });

              // Adicionar camada de polígono com efeito de água
              map.addLayer({
                id: `flood-polygon-${report.id}`,
                type: "fill",
                source: `flood-area-${report.id}`,
                paint: {
                  "fill-color":
                    report.severity === "danger" ? "#1e40af" : "#3b82f6",
                  "fill-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    10,
                    0.4,
                    15,
                    0.6,
                    18,
                    0.7,
                  ],
                },
              });

              // Adicionar contorno animado
              map.addLayer({
                id: `flood-outline-${report.id}`,
                type: "line",
                source: `flood-area-${report.id}`,
                paint: {
                  "line-color": "#1e40af",
                  "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    10,
                    2,
                    15,
                    3,
                    18,
                    4,
                  ],
                  "line-opacity": 0.8,
                },
              });
            }
          } else {
            // Para outros tipos de reportes, usar marcadores tradicionais
            markerElement = document.createElement("div");
            markerElement.className = "custom-marker";
            markerElement.style.display = "flex";
            markerElement.style.flexDirection = "column";
            markerElement.style.alignItems = "center";
            markerElement.style.cursor = "pointer";
            markerElement.style.transform = "translate(-50%, -100%)";

            const iconElement = document.createElement("div");
            iconElement.style.fontSize = "24px";
            iconElement.style.marginBottom = "2px";
            iconElement.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
            iconElement.textContent = getTypeIcon(report.type, report.severity);

            const statusElement = document.createElement("div");
            statusElement.style.width = "20px";
            statusElement.style.height = "20px";
            statusElement.style.borderRadius = "50%";
            statusElement.style.backgroundColor = getSeverityColor(
              report.severity
            );
            statusElement.style.border = "3px solid white";
            statusElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

            markerElement.appendChild(iconElement);
            markerElement.appendChild(statusElement);
          }

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="text-align: center; min-width: 200px;">
              <div style="font-size: 24px; margin-bottom: 8px;">
                ${
                  report.type === "flood"
                    ? "🌊"
                    : getTypeIcon(report.type, report.severity)
                }
              </div>
              <h3 style="font-weight: 600; margin-bottom: 4px; color: ${getSeverityColor(
                report.severity
              )};">
                ${getTypeDescription(report.type)}
              </h3>
              <p style="font-weight: 500; margin-bottom: 4px;">${getSeverityText(
                report.severity
              )}</p>
              <p style="font-size: 14px; color: #6b7280; margin: 0;">${
                report.description
              }</p>
              ${
                report.type === "flood"
                  ? '<p style="font-size: 12px; color: #2563eb; margin-top: 8px;">🌊 Área com presença de água - evite ao calcular rotas</p>'
                  : ""
              }
              ${
                report.type === "disaster"
                  ? '<p style="font-size: 12px; color: #dc2626; margin-top: 8px;">🚨 Área de risco - mantenha distância</p>'
                  : ""
              }
            </div>
          `);

          new mapboxgl.Marker(markerElement)
            .setLngLat([report.lng, report.lat])
            .setPopup(popup)
            .addTo(map);
        });

        // Adicionar marcadores para locais seguros
        safeLocations.forEach((location) => {
          const safeMarkerElement = document.createElement("div");
          safeMarkerElement.className = "safe-location-marker";
          safeMarkerElement.style.display = "flex";
          safeMarkerElement.style.flexDirection = "column";
          safeMarkerElement.style.alignItems = "center";
          safeMarkerElement.style.cursor = "pointer";
          safeMarkerElement.style.transform = "translate(-50%, -100%)";

          const safeIconElement = document.createElement("div");
          safeIconElement.style.fontSize = "24px";
          safeIconElement.style.marginBottom = "2px";
          safeIconElement.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
          safeIconElement.textContent =
            location.type === "hospital"
              ? "🏥"
              : location.type === "fire_station"
              ? "🚒"
              : location.type === "shelter"
              ? "🏠"
              : "🏢";

          const safeStatusElement = document.createElement("div");
          safeStatusElement.style.width = "16px";
          safeStatusElement.style.height = "16px";
          safeStatusElement.style.borderRadius = "50%";
          safeStatusElement.style.backgroundColor = "#059669";
          safeStatusElement.style.border = "2px solid white";
          safeStatusElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

          safeMarkerElement.appendChild(safeIconElement);
          safeMarkerElement.appendChild(safeStatusElement);

          const safePopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="text-align: center; min-width: 180px;">
              <div style="font-size: 24px; margin-bottom: 8px;">${safeIconElement.textContent}</div>
              <h3 style="font-weight: 600; margin-bottom: 4px; color: #059669;">
                Local Seguro
              </h3>
              <p style="font-weight: 500; margin-bottom: 4px;">${location.name}</p>
              <p style="font-size: 12px; color: #059669; margin-top: 8px;">✅ Área protegida para evacuação</p>
            </div>
          `);

          new mapboxgl.Marker(safeMarkerElement)
            .setLngLat([location.lng, location.lat])
            .setPopup(safePopup)
            .addTo(map);
        });
      });

      map.on("error", (e) => {
        console.error("Erro no mapa:", e);
      });

      map.on("load", () => {
        console.log("Mapa carregado com sucesso");
      });
    } catch (error) {
      console.error("Erro ao inicializar mapa:", error);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Monitora alertas críticos para enviar notificações
  useEffect(() => {
    if (realTimeData?.alerts && canSendNotifications) {
      const criticalAlerts = realTimeData.alerts.filter(
        (alert) => alert.type === "critical"
      );

      criticalAlerts.forEach((alert) => {
        // Verifica se é um alerta novo (último minuto)
        const alertTime = new Date(alert.timestamp).getTime();
        const now = Date.now();

        if (now - alertTime < 60000) {
          // 1 minuto
          sendFloodAlert("high", alert.location, alert.title);
        }
      });
    }
  }, [realTimeData?.alerts, canSendNotifications, sendFloodAlert]);

  // Verifica se usuário está em zona de perigo
  useEffect(() => {
    if (userPosition && isInDangerZone() && canSendNotifications) {
      const nearestSafe = findNearestSafeZone();
      if (nearestSafe) {
        sendFloodAlert(
          "high",
          "Sua localização",
          `Você está em área de risco! Local seguro mais próximo: ${
            nearestSafe.zone.name
          } (${(nearestSafe.distance / 1000).toFixed(1)}km)`
        );
      }
    }
  }, [
    userPosition,
    isInDangerZone,
    findNearestSafeZone,
    canSendNotifications,
    sendFloodAlert,
  ]);

  // Função para mover o mapa para uma localização
  const moveToLocation = (coordinates: [number, number], address: string) => {
    if (!mapInstanceRef.current) return;

    setSelectedLocation(coordinates);
    setSelectedAddress(address);

    // Move o mapa para a localização
    mapInstanceRef.current.flyTo({
      center: coordinates,
      zoom: 15,
      speed: 1.2,
      curve: 1.42,
      easing(t) {
        return t;
      },
    });

    // Adiciona marcador temporário para a localização buscada
    const searchMarker = new mapboxgl.Marker({
      color: "#3b82f6",
      scale: 1.2,
    })
      .setLngLat(coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="text-align: center; min-width: 200px;">
            <div style="font-size: 20px; margin-bottom: 8px;">📍</div>
            <h3 style="font-weight: 600; margin-bottom: 4px; color: #3b82f6;">
              Local Encontrado
            </h3>
            <p style="font-weight: 500; margin-bottom: 8px; font-size: 14px;">${address}</p>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button onclick="window.handleSearchLocationAction('details')" 
                      style="flex: 1; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
                Ver Detalhes
              </button>
              <button onclick="window.handleSearchLocationAction('route')" 
                      style="flex: 1; padding: 6px 12px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
                Ir Para Cá
              </button>
            </div>
          </div>
        `)
      )
      .addTo(mapInstanceRef.current);

    // Define ações globais para os botões do popup
    (window as any).handleSearchLocationAction = (action: string) => {
      if (action === "details") {
        showLocationDetails(coordinates, address);
      } else if (action === "route") {
        calculateRouteToLocation(coordinates);
      }
    };

    // Remove marcador anterior se existir
    const existingMarkers = document.querySelectorAll(
      ".search-location-marker"
    );
    existingMarkers.forEach((marker) => marker.remove());

    // Adiciona classe para identificação
    searchMarker.getElement().classList.add("search-location-marker");
  };

  // Limpa localização selecionada
  const clearLocationSelection = () => {
    setSelectedLocation(null);
    setSelectedAddress("");

    // Remove marcadores de busca
    const searchMarkers = document.querySelectorAll(".search-location-marker");
    searchMarkers.forEach((marker) => marker.remove());
  };

  // Mostra detalhes da localização
  const showLocationDetails = (
    coordinates: [number, number],
    address: string
  ) => {
    // Aqui você pode implementar um modal ou painel com detalhes da localização
    // Por exemplo, mostrar relatórios de enchente próximos, dados meteorológicos, etc.
    alert(
      `Detalhes para: ${address}\nCoordenadas: ${coordinates[1].toFixed(
        6
      )}, ${coordinates[0].toFixed(6)}`
    );
  };

  // Calcula rota para localização específica
  const calculateRouteToLocation = async (destination: [number, number]) => {
    try {
      const userLocation = await getCurrentLocation();
      await calculateEscapeRoute(userLocation, destination, "driving");
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
      alert("Não foi possível calcular a rota. Verifique sua localização.");
    }
  };

  // Implementa funcionalidade de ver detalhes do bairro
  const handleViewNeighborhoodDetails = () => {
    if (!mapInstanceRef.current) return;

    const center = mapInstanceRef.current.getCenter();
    const zoom = mapInstanceRef.current.getZoom();

    // Busca informações do bairro atual
    const currentCoords: [number, number] = [center.lng, center.lat];

    // Calcula relatórios próximos
    const nearbyReports = mockReports.filter((report) => {
      const distance = Math.sqrt(
        Math.pow(currentCoords[0] - report.lng, 2) +
          Math.pow(currentCoords[1] - report.lat, 2)
      );
      return distance < 0.02; // ~2km de raio
    });

    // Calcula estatísticas da região
    const dangerReports = nearbyReports.filter((r) => r.severity === "danger");
    const warningReports = nearbyReports.filter(
      (r) => r.severity === "warning"
    );
    const normalReports = nearbyReports.filter((r) => r.severity === "normal");

    const riskLevel =
      dangerReports.length > 0
        ? "Alto"
        : warningReports.length > 0
        ? "Moderado"
        : "Baixo";

    const riskColor =
      dangerReports.length > 0
        ? "#ef4444"
        : warningReports.length > 0
        ? "#f59e0b"
        : "#10b981";

    // Cria popup com detalhes da região
    const detailsPopup = new mapboxgl.Popup({
      closeOnClick: false,
      closeButton: true,
    })
      .setLngLat(currentCoords)
      .setHTML(
        `
      <div style="min-width: 300px; padding: 16px;">
        <h3 style="font-weight: 700; margin-bottom: 12px; color: #1f2937; font-size: 18px;">
          📍 Detalhes da Região
        </h3>
        
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-weight: 600;">Nível de Risco:</span>
            <span style="color: ${riskColor}; font-weight: 700;">${riskLevel}</span>
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            Coordenadas: ${currentCoords[1].toFixed(
              4
            )}, ${currentCoords[0].toFixed(4)}
          </div>
        </div>

        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <h4 style="font-weight: 600; margin-bottom: 8px; color: #374151;">Estatísticas da Região</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
            <div>
              <span style="color: #10b981;">✅ Sem risco:</span>
              <span style="font-weight: 600; margin-left: 4px;">${
                normalReports.length
              }</span>
            </div>
            <div>
              <span style="color: #f59e0b;">⚠️ Alerta:</span>
              <span style="font-weight: 600; margin-left: 4px;">${
                warningReports.length
              }</span>
            </div>
            <div>
              <span style="color: #ef4444;">🚨 Crítico:</span>
              <span style="font-weight: 600; margin-left: 4px;">${
                dangerReports.length
              }</span>
            </div>
            <div>
              <span style="color: #6b7280;">📊 Total:</span>
              <span style="font-weight: 600; margin-left: 4px;">${
                nearbyReports.length
              }</span>
            </div>
          </div>
        </div>

        ${
          nearbyReports.length > 0
            ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-weight: 600; margin-bottom: 8px; color: #374151;">Relatórios Recentes</h4>
            <div style="max-height: 120px; overflow-y: auto;">
              ${nearbyReports
                .slice(0, 3)
                .map(
                  (report) => `
                <div style="padding: 8px; margin-bottom: 4px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <span>${getTypeIcon(report.type, report.severity)}</span>
                    <span style="font-weight: 500; font-size: 13px;">${
                      report.description
                    }</span>
                  </div>
                  <div style="font-size: 11px; color: #6b7280;">
                    ${getSeverityText(report.severity)} • ${getTypeDescription(
                    report.type
                  )}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button onclick="window.handleNeighborhoodAction('report')" 
                  style="flex: 1; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;">
            📱 Reportar Problema
          </button>
          <button onclick="window.handleNeighborhoodAction('alert')" 
                  style="flex: 1; padding: 8px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500;">
            🔔 Criar Alerta
          </button>
        </div>
      </div>
    `
      )
      .addTo(mapInstanceRef.current);

    // Define ações dos botões
    (window as any).handleNeighborhoodAction = (action: string) => {
      if (action === "report") {
        window.location.href = "/relatar";
      } else if (action === "alert") {
        // Aqui você pode implementar criação de alerta personalizado
        alert("Funcionalidade de criar alerta em desenvolvimento");
      }
      detailsPopup.remove();
    };
  };

  // Implementa funcionalidade de compartilhar mapa
  const handleShareMap = async () => {
    if (!mapInstanceRef.current) return;

    const center = mapInstanceRef.current.getCenter();
    const zoom = mapInstanceRef.current.getZoom();

    // Cria URL do mapa com a localização atual
    const mapUrl = `${window.location.origin}${
      window.location.pathname
    }?lat=${center.lat.toFixed(6)}&lng=${center.lng.toFixed(
      6
    )}&zoom=${zoom.toFixed(2)}`;

    // Tenta usar a API nativa de compartilhamento
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mapa de Alertas - alaganao",
          text: "Confira os alertas de enchente em tempo real nesta região",
          url: mapUrl,
        });
        return;
      } catch (error) {
        console.log("Compartilhamento cancelado ou não suportado");
      }
    }

    // Fallback: copia para área de transferência
    try {
      await navigator.clipboard.writeText(mapUrl);

      // Mostra notificação de sucesso
      const sharePopup = new mapboxgl.Popup({
        closeOnClick: true,
        closeButton: false,
      })
        .setLngLat(center)
        .setHTML(
          `
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
          <div style="font-weight: 600; color: #10b981; margin-bottom: 4px;">Link copiado!</div>
          <div style="font-size: 12px; color: #6b7280;">O link do mapa foi copiado para sua área de transferência</div>
        </div>
      `
        )
        .addTo(mapInstanceRef.current!);

      // Remove popup automaticamente após 3 segundos
      setTimeout(() => {
        sharePopup.remove();
      }, 3000);
    } catch (error) {
      // Se clipboard não funcionar, mostra o link em um popup
      const sharePopup = new mapboxgl.Popup({
        closeOnClick: false,
        closeButton: true,
      })
        .setLngLat(center)
        .setHTML(
          `
        <div style="min-width: 300px; padding: 16px;">
          <h3 style="font-weight: 700; margin-bottom: 12px; color: #1f2937;">
            🔗 Compartilhar Mapa
          </h3>
          <p style="margin-bottom: 12px; color: #6b7280; font-size: 14px;">
            Copie o link abaixo para compartilhar esta localização:
          </p>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
            <input type="text" value="${mapUrl}" readonly 
                   style="width: 100%; border: none; background: transparent; font-size: 12px; color: #374151;"
                   onclick="this.select()" />
          </div>
          <button onclick="navigator.clipboard.writeText('${mapUrl}').then(() => this.innerText = 'Copiado!')" 
                  style="width: 100%; padding: 8px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            📋 Copiar Link
          </button>
        </div>
      `
        )
        .addTo(mapInstanceRef.current!);
    }
  };

  // Carrega localização de parâmetros da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get("lat");
    const lng = urlParams.get("lng");
    const zoom = urlParams.get("zoom");

    if (lat && lng && mapInstanceRef.current) {
      const coordinates: [number, number] = [parseFloat(lng), parseFloat(lat)];
      const zoomLevel = zoom ? parseFloat(zoom) : 15;

      // Aguarda o mapa estar carregado
      if (mapInstanceRef.current.isStyleLoaded()) {
        mapInstanceRef.current.flyTo({
          center: coordinates,
          zoom: zoomLevel,
          speed: 1.2,
        });
      } else {
        mapInstanceRef.current.once("style.load", () => {
          mapInstanceRef.current!.flyTo({
            center: coordinates,
            zoom: zoomLevel,
            speed: 1.2,
          });
        });
      }

      // Adiciona marcador para localização compartilhada
      const sharedLocationMarker = new mapboxgl.Marker({
        color: "#8b5cf6",
        scale: 1.3,
      })
        .setLngLat(coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="text-align: center; min-width: 180px;">
              <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
              <h3 style="font-weight: 600; margin-bottom: 4px; color: #8b5cf6;">
                Localização Compartilhada
              </h3>
              <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                Coordenadas: ${parseFloat(lat).toFixed(4)}, ${parseFloat(
            lng
          ).toFixed(4)}
              </p>
              <button onclick="window.location.href='/relatar'" 
                      style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
                📱 Reportar Problema Aqui
              </button>
            </div>
          `)
        )
        .addTo(mapInstanceRef.current);
    }
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>

        {/* Floating elements */}
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-blue-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-cyan-300/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-blue-300/20 rounded-full animate-float delay-500"></div>
        <div className="absolute top-32 right-1/4 w-24 h-24 bg-purple-400/15 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-32 left-1/3 w-28 h-28 bg-indigo-400/15 rounded-full animate-float delay-300"></div>
        <div className="absolute top-1/3 left-1/6 w-12 h-12 bg-sky-300/20 rounded-full animate-bounce delay-1500"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Main Hero Content */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6 animate-fadeInUp">
                <div className="bg-red-500/20 p-3 rounded-full mr-4 animate-glow">
                  <Droplets className="w-8 h-8 text-red-300" />
                </div>
                <span className="bg-red-500/20 text-red-200 px-4 py-2 rounded-full text-sm font-medium border border-red-400/30 animate-shimmer">
                  🚨 Sistema de Alerta Ativo
                </span>
              </div>

              <h1 className="text-6xl font-bold mb-6 leading-tight animate-slideInLeft">
                Proteja sua
                <span className="gradient-text block">comunidade</span>
                contra enchentes
              </h1>

              <p className="text-xl mb-8 text-blue-100 leading-relaxed max-w-2xl animate-fadeInUp delay-200">
                O Alerta Comunitário conecta moradores para compartilhar
                informações em tempo real sobre alagamentos e riscos de
                enchentes. Juntos somos mais fortes contra desastres naturais.
              </p>

              {/* Real-time stats cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="hero-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 animate-scaleIn delay-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-cyan-300" />
                    <span className="text-sm text-blue-200">
                      Usuários Online
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {isDataLoading
                      ? "..."
                      : realTimeData?.statistics.usersOnline.toLocaleString() ||
                        "1.458"}
                  </p>
                  <p className="text-xs text-green-300">
                    {realTimeData?.statistics.onlineGrowth || "+12%"} hoje
                  </p>
                </div>

                <div className="hero-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 animate-scaleIn delay-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm text-blue-200">
                      Alertas Ativos
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-300">
                    {isDataLoading
                      ? "..."
                      : realTimeData?.statistics.activeAlerts || "27"}
                  </p>
                  <p className="text-xs text-yellow-200">
                    {realTimeData?.statistics.criticalAlerts || "3"} críticos
                  </p>
                </div>

                <div className="hero-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 animate-scaleIn delay-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-300" />
                    <span className="text-sm text-blue-200">Áreas Seguras</span>
                  </div>
                  <p className="text-2xl font-bold text-green-300">
                    {realTimeData?.statistics.safeAreas || "42"}
                  </p>
                  <p className="text-xs text-green-200">100% funcionais</p>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex flex-wrap gap-2 mb-6">
                {/* Status de conexão */}
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    isOnline
                      ? "bg-green-500/20 text-green-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {isOnline ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  {isOnline ? "Online" : "Offline"}
                  {isOfflineMode && " (Modo Offline)"}
                </div>

                {/* Status de notificações */}
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    canSendNotifications
                      ? "bg-blue-500/20 text-blue-200"
                      : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {canSendNotifications ? (
                    <Bell className="w-3 h-3" />
                  ) : (
                    <BellOff className="w-3 h-3" />
                  )}
                  Notificações {canSendNotifications ? "Ativas" : "Inativas"}
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white px-1 rounded-full text-xs">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Status de localização */}
                {userPosition && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-200">
                    <Navigation className="w-3 h-3" />
                    Localização Ativa
                  </div>
                )}

                {/* Indicador de sincronização pendente */}
                {needsSync && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-200">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {queuedActions.length} ações pendentes
                  </div>
                )}

                {/* Dados offline disponíveis */}
                {hasOfflineData && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-200">
                    <Droplets className="w-3 h-3" />
                    Dados offline
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fadeInUp delay-400">
                <Link to="/relatar">
                  <Button
                    size="lg"
                    className="hero-button bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Droplets className="w-5 h-5 mr-2" />
                    🚨 Relatar Enchente
                  </Button>
                </Link>

                {!canSendNotifications && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={requestPermission}
                    className="hero-button text-white border-white/30 hover:bg-white/10 backdrop-blur-sm hover:text-white transition-all duration-300"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    🔔 Ativar Alertas
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => startLocationWatching()}
                  className="hero-button text-white border-white/30 hover:bg-white/10 backdrop-blur-sm hover:text-white transition-all duration-300"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  📍 Monitorar Localização
                </Button>

                {!hasOfflineData && isOnline && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={downloadOfflineData}
                    className="hero-button text-white border-white/30 hover:bg-white/10 backdrop-blur-sm hover:text-white transition-all duration-300"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    📱 Dados Offline
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  className="hero-button text-white border-white/30 hover:bg-white/10 backdrop-blur-sm hover:text-white transition-all duration-300"
                >
                  <Share className="w-5 h-5 mr-2" />
                  📱 Compartilhar
                </Button>
              </div>

              {/* Weather alert banner */}
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 backdrop-blur-sm animate-slideInLeft delay-500">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-400/30 p-2 rounded-full animate-pulse">
                    <Droplets className="w-5 h-5 text-yellow-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-200 mb-1">
                      ⚠️ Alerta Meteorológico
                    </h4>
                    <p className="text-sm text-yellow-100">
                      Chuva forte prevista para as próximas 6 horas.
                      Probabilidade de alagamentos em áreas de risco.
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-yellow-200">
                      <span>💧 Precipitação: 45mm/h</span>
                      <span>🌪️ Ventos: 32km/h</span>
                      <span>⏰ Até: 18:30</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Alerts Panel */}
            <div className="lg:col-span-1">
              <div className="hero-card bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 sticky top-8 animate-slideInRight delay-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    Alertas em Tempo Real
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-300">Ao vivo</span>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {realTimeData?.alerts && realTimeData.alerts.length > 0 ? (
                    realTimeData.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${
                          alert.type === "critical"
                            ? "bg-red-500/20 border-red-400/30"
                            : alert.type === "moderate"
                            ? "bg-yellow-500/20 border-yellow-400/30"
                            : alert.type === "info"
                            ? "bg-blue-500/20 border-blue-400/30"
                            : "bg-green-500/20 border-green-400/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium text-white ${
                              alert.type === "critical"
                                ? "bg-red-500"
                                : alert.type === "moderate"
                                ? "bg-yellow-500"
                                : alert.type === "info"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          >
                            {alert.type === "critical"
                              ? "CRÍTICO"
                              : alert.type === "moderate"
                              ? "MODERADO"
                              : alert.type === "info"
                              ? "INFO"
                              : "RESOLVIDO"}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-blue-100 mb-2">
                              {new Date(alert.timestamp).toLocaleString(
                                "pt-BR"
                              )}{" "}
                              • {alert.location}
                            </p>
                            <div
                              className={`flex items-center gap-2 text-xs ${
                                alert.type === "critical"
                                  ? "text-red-200"
                                  : alert.type === "moderate"
                                  ? "text-yellow-200"
                                  : alert.type === "info"
                                  ? "text-blue-200"
                                  : "text-green-200"
                              }`}
                            >
                              <span>👥 {alert.reports} reportes</span>
                              <span>📍 {alert.distance}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback para dados estáticos se não houver dados dinâmicos
                    <>
                      <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            CRÍTICO
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">
                              Enchente na Av. Paulista
                            </p>
                            <p className="text-sm text-blue-100 mb-2">
                              Há 15 minutos • São Paulo - SP
                            </p>
                            <div className="flex items-center gap-2 text-xs text-red-200">
                              <span>👥 127 reportes</span>
                              <span>📍 2.3km de você</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                            MODERADO
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">Risco no Rio Tietê</p>
                            <p className="text-sm text-blue-100 mb-2">
                              Há 32 minutos • Marginal Tietê
                            </p>
                            <div className="flex items-center gap-2 text-xs text-yellow-200">
                              <span>👥 43 reportes</span>
                              <span>📍 5.7km de você</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            INFO
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">Chuva forte prevista</p>
                            <p className="text-sm text-blue-100 mb-2">
                              Há 1 hora • Região Sul
                            </p>
                            <div className="flex items-center gap-2 text-xs text-blue-200">
                              <span>👥 89 visualizações</span>
                              <span>📍 1.2km de você</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            RESOLVIDO
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">Situação normalizada</p>
                            <p className="text-sm text-blue-100 mb-2">
                              Há 2 horas • Vila Madalena
                            </p>
                            <div className="flex items-center gap-2 text-xs text-green-200">
                              <span>👥 156 confirmações</span>
                              <span>📍 3.1km de você</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/20">
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    Ver Todos os Alertas
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-24 text-gray-50"
            fill="currentColor"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,120L48,110C96,100,192,80,288,85.3C384,91,480,123,576,128C672,133,768,111,864,96C960,80,1056,72,1152,80L1200,88L1200,120L1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Mapa de Alertas 3D
          </h2>
          <p className="text-gray-600">
            Visualize as áreas com risco de enchente e desastres naturais em
            tempo real
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <LocationSearchBar
                onLocationSelect={moveToLocation}
                onLocationClear={clearLocationSelection}
                mapboxToken={mapboxToken}
                currentLocation={currentLocation}
                className="flex-1"
              />
              <div className="bg-white border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Legenda</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">✅</span>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Sem risco</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">💧</span>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">Alagamento</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">💧💧💧</span>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Enchente</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">⚠️</span>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Desastre</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">🏥</span>
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <span className="text-xs">Local Seguro</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Localização selecionada */}
            {selectedLocation && selectedAddress && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Localização selecionada:
                    </span>
                    <span className="text-sm text-blue-700">
                      {selectedAddress}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        showLocationDetails(selectedLocation, selectedAddress)
                      }
                      className="text-xs"
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => calculateRouteToLocation(selectedLocation)}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      Calcular Rota
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route Controls */}
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-sm mb-3">
              🚨 Rotas de Fuga Automáticas
            </h4>
            <div className="flex flex-wrap gap-2">
              {!isCalculatingRoute ? (
                <>
                  <Button
                    onClick={() => startEscapeRoute("car")}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                    disabled={isCalculatingRoute}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Fuga de Carro
                  </Button>
                  <Button
                    onClick={() => startEscapeRoute("walking")}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    disabled={isCalculatingRoute}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Fuga a Pé
                  </Button>
                  {routeMode && (
                    <Button onClick={clearRoute} size="sm" variant="outline">
                      Limpar Rota
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-sm text-gray-600">
                    Obtendo sua localização e calculando rota de fuga...
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 A rota será calculada automaticamente da sua localização atual
              para o local seguro mais próximo
            </p>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div ref={mapRef} className="w-full h-96" />

            {/* Map Action Buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleViewNeighborhoodDetails}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ver Detalhes do Bairro
              </Button>
              <Button
                variant="outline"
                className="bg-white"
                onClick={handleShareMap}
              >
                <Share className="w-4 h-4 mr-2" />
                Compartilhar Mapa
              </Button>
            </div>
          </div>
        </div>

        {/* Weather Section com dados reais da API */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dados Meteorológicos
          </h2>
          <p className="text-gray-600 mb-6">
            Informações em tempo real para prevenção de enchentes
          </p>
          <WeatherChart latitude={-23.5505} longitude={-46.6333} />
        </div>

        {/* Community Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Áreas Monitoradas</CardTitle>
              <p className="text-sm text-gray-600">
                Distribuição por nível de risco
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sem risco</span>
                  <span className="text-sm font-bold">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alerta</span>
                  <span className="text-sm font-bold">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "25%" }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Crítico</span>
                  <span className="text-sm font-bold">10%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: "10%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas da Comunidade</CardTitle>
              <p className="text-sm text-gray-600">Dados da última semana</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Droplets className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">127</p>
                    <p className="text-sm text-gray-600">Alertas reportados</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1.458</p>
                    <p className="text-sm text-gray-600">Usuários ativos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">42</p>
                    <p className="text-sm text-gray-600">
                      Comunidades protegidas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link to="/relatar">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow z-[1000] bg-red-500 hover:bg-red-600"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
};

export default MapComponent;
