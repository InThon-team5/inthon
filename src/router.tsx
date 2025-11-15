// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import MainPage from "./pages/MainPage";
import LobbyPage from "./pages/lobbypage";
import BattlePage from "./pages/BattlePage";
import MyPage from "./pages/MyPage";

export const router = createBrowserRouter([
  { path: "/", element: <MainPage /> },
  { path: "/lobby", element: <LobbyPage /> },
  { path: "/battle/:matchId", element: <BattlePage /> },
  { path: "/me", element: <MyPage /> },
]);
