"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

function socketBaseUrl() {
  return API_BASE.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

function invalidateForEvent(queryClient: QueryClient, event: string) {
  if (event === "realtime.connected") {
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-summary"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    return;
  }
  if (event === "home.updated" || event === "catalog.updated") {
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "product-category-options"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["home-content"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "markets"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "market"] });
    queryClient.invalidateQueries({ queryKey: ["markets"] });
  }
  if (event === "notification.created" || event === "notification.updated") {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }
  if (event === "order.updated") {
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "recent-orders"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-summary"] });
  }
  if (event === "admin.dashboard.updated" || event === "admin.operations.updated") {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }
}

export function AdminRealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: Socket | undefined;
    let disposed = false;
    let authSignature = "";

    const connect = () => {
      const accessToken = getAccessToken();
      if (!accessToken || disposed) {
        socket?.disconnect();
        return;
      }
      if (!socket) {
        socket = io(socketBaseUrl(), {
          autoConnect: false,
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 500,
          reconnectionDelayMax: 10_000,
          auth: { accessToken },
        });
        socket.onAny((event) => invalidateForEvent(queryClient, event));
        socket.on("connect", () => {
          invalidateForEvent(queryClient, "realtime.connected");
        });
      } else {
        socket.auth = { accessToken };
      }
      const nextSignature = JSON.stringify({ accessToken });
      const credentialsChanged = authSignature !== nextSignature;
      authSignature = nextSignature;
      if (credentialsChanged && socket.connected) socket.disconnect();
      if (!socket.connected) socket.connect();
    };

    const onAuthChanged = () => connect();
    window.addEventListener("hook-auth-changed", onAuthChanged);
    connect();
    return () => {
      disposed = true;
      window.removeEventListener("hook-auth-changed", onAuthChanged);
      socket?.disconnect();
    };
  }, [queryClient]);

  return null;
}
