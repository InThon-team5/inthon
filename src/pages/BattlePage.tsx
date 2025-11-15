// BattlePage.tsx
import { useParams } from "react-router-dom";

export default function BattlePage() {
  const { matchId } = useParams();
  return (
    <div>
      <h2>배틀 페이지 #{matchId}</h2>
    </div>
  );
}
