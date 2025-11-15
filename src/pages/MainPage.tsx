import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>KU INFO BATTLE 메인</h1>
      <button onClick={() => navigate("/lobby")}>공방 입장</button>
      <button onClick={() => navigate("/me")}>마이페이지</button>
    </div>
  );
}
