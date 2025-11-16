// src/pages/LobbyPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LobbyPage.css";
import { useTheme } from "../ThemeProvider";
import {
  fetchBattleRooms,
  createBattleRoom,
  verifyRoomPassword,
  joinBattleRoom,
  type Room,
  type Grade,
  type BattleType,
} from "./services/battleRoomApi";
import { fetchProfile } from "./services/profileApi";

type FilterType = "전체" | BattleType;
type GradeFilter = "전체" | Grade;

const GRADE_FILTERS: GradeFilter[] = [
  "전체",
  "A+",
  "A0",
  "B+",
  "B0",
  "C+",
  "C0",
  "D+",
  "D0",
  "F",
];

// 비밀번호 모달
interface PasswordModalProps {
  roomTitle: string;
  onClose: () => void;
  onConfirm: (password: string) => void | Promise<void>;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  roomTitle,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (password.trim()) {
      onConfirm(password);
    } else {
      alert("비밀번호를 입력해 주세요.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="password-modal">
        <h2>🔒 비공개 방 입장</h2>
        <p className="room-title-display">방 제목: {roomTitle}</p>

        <label className="input-label">비밀번호 입력</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className="input-field"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
        />

        <div className="modal-actions">
          <button className="create-btn" onClick={handleSubmit}>
            입장
          </button>
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

// 방 생성 모달
interface CreateRoomForm {
  title: string;
  roomType: BattleType;
  isPrivate: boolean;
  privatePassword?: string;
  problems: number[];
}

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (form: CreateRoomForm) => void | Promise<void>;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [roomType, setRoomType] = useState<BattleType>("코테");
  const [isPrivate, setIsPrivate] = useState(false);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [problemsInput, setProblemsInput] = useState("");

  const handleCreateClick = () => {
    if (!title.trim()) {
      alert("방 제목을 입력해 주세요.");
      return;
    }

    if (isPrivate && !password.trim()) {
      alert("비공개 방 비밀번호를 입력해 주세요.");
      return;
    }

    const problems =
      problemsInput.trim().length === 0
        ? []
        : problemsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => Number(s))
            .filter((n) => !Number.isNaN(n));

    onCreate({
      title: title.trim(),
      roomType,
      isPrivate,
      privatePassword: isPrivate ? password : undefined,
      problems,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="create-room-modal">
        <h2>새로운 대결 방 만들기 (1:1 전용)</h2>

        <div className="modal-content-area">
          <label className="input-label">방 제목</label>
          <input
            type="text"
            placeholder="예: 자료구조 A+ 평가 완벽"
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="input-label">대결 종류</label>
          <div className="type-selector">
            <button
              className={`type-btn ${roomType === "코테" ? "active" : ""}`}
              onClick={() => setRoomType("코테")}
            >
              💻 코딩 테스트
            </button>
            <button
              className={`type-btn ${roomType === "미니" ? "active" : ""}`}
              onClick={() => setRoomType("미니")}
            >
              🎯 미니 퀴즈
            </button>
          </div>

          <label className="input-label">공개 설정</label>
          <div className="private-setting">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <span>
              {isPrivate
                ? "비공개 방 (비밀번호 설정)"
                : "공개 방 (누구나 입장 가능)"}
            </span>
          </div>

          {isPrivate && (
            <input
              type="password"
              placeholder="비밀번호 설정"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          <label className="input-label">
            문제 ID 목록 (선택, 예: 1,2,3)
          </label>
          <input
            type="text"
            placeholder="나중에 문제 선택 UI 붙이기 전까지는 ID를 콤마로 입력"
            className="input-field"
            value={problemsInput}
            onChange={(e) => setProblemsInput(e.target.value)}
          />

          <label className="input-label">최대 인원</label>
          <p className="max-players-info">2명 (1:1 대결 고정)</p>
        </div>

        <div className="modal-actions">
          <button className="create-btn" onClick={handleCreateClick}>
            방 만들기
          </button>
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

// 방 리스트 아이템
const RoomItem: React.FC<{
  room: Room;
  onEnter: (room: Room) => void;
}> = ({ room, onEnter }) => {
  const isCote = room.type === "코테";
  const isPlaying = room.status === "진행";
  const canEnter = !isPlaying;

  const tierClass = room.tier
    ? `tier-${room.tier.toLowerCase().replace("+", "plus")}`
    : "";

  return (
    <div className={`room-item ${isPlaying ? "playing" : ""}`}>
      <div className={`room-type-tag ${isCote ? "cote" : "mini"}`}>
        {room.type}
      </div>

      <div className="room-details">
        <div className="room-title">{room.title}</div>
        <div className={`room-tier-info ${tierClass}`}>
          {room.tier ?? "—"}
        </div>
      </div>

      <div className="room-status-actions">
        {room.isPrivate && <span className="room-lock">🔒 잠김</span>}
        <span className="room-privacy">
          {room.isPrivate ? "비공개" : "공개"} ({room.status})
        </span>

        <span className="room-players">
          ({room.currentPlayers}/{room.maxPlayers})
        </span>

        <button
          className={`action-btn ${
            canEnter ? "enter" : isPlaying ? "in-progress" : "disabled"
          }`}
          disabled={!canEnter}
          onClick={() => canEnter && onEnter(room)}
        >
          {isPlaying ? "진행 중" : "입장"}
        </button>
      </div>
    </div>
  );
};

// 메인 로비 페이지
const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("전체");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState<{
    nickname: string;
    tier: Grade | null;
  } | null>(null);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBattleRooms();
      setRooms(data);
    } catch (e) {
      console.error(e);
      setError("방 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem("loop_access");

        if (!token) {
          setUserInfo(null);
          await loadRooms();
          return;
        }

        const profile = await fetchProfile(token);
        setUserInfo({
          nickname: profile.nickname ?? "사용자",
          tier: (profile.tier as Grade) ?? null,
        });

        await loadRooms();
      } catch (err) {
        console.error(err);
        setUserInfo(null);
        await loadRooms();
      }
    };

    void loadInitialData();
  }, []);

  const handleRefresh = () => {
    void loadRooms();
  };

  const filteredRooms = rooms.filter((room) => {
    const roomSearch = room.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const roomType =
      filterType === "전체" ? true : room.type === filterType;
    const roomGrade =
      gradeFilter === "전체" ? true : room.tier === gradeFilter;
    return roomSearch && roomType && roomGrade;
  });

  const handleExit = () => {
    navigate("/");
  };

  const handleMyPage = () => {
    navigate("/me");
  };

  // 방 입장 (공개방)
  const handleEnterRoom = async (room: Room) => {
    if (room.isPrivate) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
      return;
    }

    try {
      await joinBattleRoom(room.id);
      
      navigate(`/battle/${room.id}`, {
        state: { roomId: room.id },
      });
    } catch (e) {
      console.error(e);
      alert("방 입장에 실패했습니다.");
    }
  };

  // 비공개 방 입장
  const handlePasswordConfirm = async (password: string) => {
    if (!selectedRoom) return;

    try {
      // 옵션1: verify → join 두 번
      await verifyRoomPassword(selectedRoom.id, password);
      await joinBattleRoom(selectedRoom.id, password);

      navigate(`/battle/${selectedRoom.id}`);
    } catch (e) {
      console.error(e);
      alert("비밀번호가 일치하지 않거나 방 입장에 실패했습니다.");
    } finally {
      setShowPasswordModal(false);
      setSelectedRoom(null);
    }
  };


  const handleCreateRoom = async (form: CreateRoomForm) => {
    try {
      const payload: {
        title: string;
        is_cote: boolean;
        is_private: boolean;
        private_password?: string;
        problems: number[];
      } = {
        title: form.title,
        is_cote: form.roomType === "코테",
        is_private: form.isPrivate,
        problems: form.problems,
      };

      // 비공개 방인 경우에만 private_password 포함
      if (form.isPrivate && form.privatePassword) {
        payload.private_password = form.privatePassword;
      }

      const newRoom = await createBattleRoom(payload);
      setRooms((prev) => [newRoom, ...prev]);
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("대결 방 생성에 실패했습니다.");
    }
  };

  return (
    <div className={`lobby-container ${theme === "dark" ? "dark-mode" : ""}`}>
      {/* 헤더 */}
      <div className="lobby-header-final">
        <button className="exit-btn" onClick={handleExit}>
          ← 나가기
        </button>
        <div className="header-spacer"></div>

        <button className="theme-toggle-btn-lobby" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

        {userInfo ? (
          <div
            className={`user-info-display ${
              userInfo.tier
                ? `tier-${userInfo.tier.toLowerCase().replace("+", "plus")}`
                : ""
            }`}
          >
            <span className="user-nickname">{userInfo.nickname}</span>
            {userInfo.tier && (
              <span className="user-tier">({userInfo.tier})</span>
            )}
          </div>
        ) : (
          <div className="user-info-display not-logged-in">로그인 필요</div>
        )}

        <button className="mypage-btn" onClick={handleMyPage}>
          👤 마이페이지
        </button>
      </div>

      {/* 방 만들기 */}
      <div className="create-room-area">
        <button
          className="create-room-btn large-create-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + 방 만들기
        </button>
      </div>

      {/* 검색/필터 */}
      <div className="search-filter-area">
        <input
          type="text"
          placeholder="방 제목으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="filter-group">
          <div className="filter-buttons type-filter">
            {(["전체", "코테", "미니"] as FilterType[]).map((type) => (
              <button
                key={type}
                className={`filter-btn ${
                  filterType === type ? "active" : ""
                }`}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="filter-buttons grade-filter">
            {GRADE_FILTERS.map((grade) => (
              <button
                key={grade}
                className={`grade-btn ${
                  gradeFilter === grade ? "active" : ""
                }`}
                onClick={() => setGradeFilter(grade)}
              >
                {grade}
              </button>
            ))}
          </div>

          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* 방 목록 */}
      <div className="room-list-container">
        {loading && <p className="room-list-message">방 목록 불러오는 중...</p>}
        {error && <p className="room-list-error">{error}</p>}
        {!loading && !error && filteredRooms.length === 0 && (
          <p className="room-list-message">조건에 맞는 방이 없습니다.</p>
        )}

        {filteredRooms.map((room) => (
          <RoomItem key={room.id} room={room} onEnter={handleEnterRoom} />
        ))}
      </div>

      {/* 모달들 */}
      {isModalOpen && (
        <CreateRoomModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateRoom}
        />
      )}
      {showPasswordModal && selectedRoom && (
        <PasswordModal
          roomTitle={selectedRoom.title}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedRoom(null);
          }}
          onConfirm={handlePasswordConfirm}
        />
      )}
    </div>
  );
};

export default LobbyPage;
