// src/pages/LobbyPage.tsx

import React, { useState } from 'react';
import './LobbyPage.css'; // 2단계에서 만들 CSS 파일

// TypeScript: '방' 데이터의 타입을 미리 정의합니다.
interface Room {
  id: number;
  title: string;
  host: {
    name: string;
    tier: string;
  };
  type: "MINI" | "CODE"; // 타입은 'MINI' 또는 'CODE'
  isPrivate: boolean;
  current: number;
  max: number;
  status: "Waiting" | "Full" | "Playing";
}

// 1. 가짜 데이터 (정의한 Room[] 타입)
const MOCK_ROOMS: Room[] = [
  { 
    id: 1, 
    title: "OS 단답형 스피드 퀴즈 (초보만)", 
    host: { name: "컴린이", tier: "Bronze" }, 
    type: "MINI", 
    isPrivate: true, 
    current: 1, 
    max: 2,
    status: "Waiting"
  },
  { 
    id: 2, 
    title: "자료구조 A+ 밥 내기 한판", 
    host: { name: "코딩신", tier: "Platinum" }, 
    type: "CODE", 
    isPrivate: false, 
    current: 1, 
    max: 2,
    status: "Waiting"
  },
  { 
    id: 3, 
    title: "1황 가리기 들어와라", 
    host: { name: "해커톤우승자", tier: "Diamond" }, 
    type: "CODE", 
    isPrivate: false, 
    current: 2, 
    max: 2,
    status: "Full" // 꽉 찬 방
  },
];

// 2. 컴포넌트 본체 (함수 이름을 LobbyPage로 수정)
export default function LobbyPage() {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"ALL" | "CODE" | "MINI">("ALL");
  
  // '방 만들기' 모달(팝업)을 띄울지 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 방 만들기 폼 내부 상태 (TypeScript 타입 지정)
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newRoomType, setNewRoomType] = useState<"CODE" | "MINI">("CODE"); // 기본값 코테
  const [isNewRoomPrivate, setIsNewRoomPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState("");

  const handleCreateRoom = () => {
    // 여기에 나중에 백엔드로 방 생성 요청을 보낼 코드가 들어갑니다.
    console.log("방 생성 시도:", {
      title: newRoomTitle,
      type: newRoomType,
      isPrivate: isNewRoomPrivate,
      password: newRoomPassword,
    });
    // 지금은 일단 모달(팝업)만 닫습니다.
    setIsModalOpen(false);
  };

  return (
    <div className="lobby-container">
      {/* --- 상단: 헤더, 검색, 필터, 방 만들기 --- */}
      <header className="lobby-header">
        <h1>대결할 사람 구하는 창 (공방)</h1>
        <button className="create-room-btn" onClick={() => setIsModalOpen(true)}>
          + 방 만들기
        </button>
      </header>

      <div className="lobby-controls">
        <input
          type="text"
          placeholder="방 제목으로 검색..."
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="filter-buttons">
          <button onClick={() => setFilter("ALL")} className={filter === 'ALL' ? 'active' : ''}>전체</button>
          <button onClick={() => setFilter("CODE")} className={filter === 'CODE' ? 'active' : ''}>코딩테스트</button>
          <button onClick={() => setFilter("MINI")} className={filter === 'MINI' ? 'active' : ''}>미니퀴즈</button>
        </div>
      </div>

      {/* --- 중단: 방 목록 --- */}
      <div className="room-list-container">
        {rooms
          .filter(room => {
            // 필터링 로직
            const matchesFilter = filter === 'ALL' || room.type === filter;
            const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
          })
          .map(room => (
            <div key={room.id} className="room-item">
              <div className="room-info">
                <span className={`room-type ${room.type === 'CODE' ? 'type-code' : 'type-mini'}`}>
                  {room.type === 'CODE' ? '코테' : '미니'}
                </span>
                <span className="room-title">
                  {room.isPrivate && <span className="lock-icon">🔒</span>}
                  {room.title}
                </span>
                <span className="room-host">
                  👑 {room.host.name} ({room.host.tier})
                </span>
              </div>
              <div className="room-actions">
                <span className="room-status">
                  {room.status === 'Full' ? '(꽉 참)' : `(${room.current}/${room.max})`}
                </span>
                <button 
                  className="join-btn" 
                  disabled={room.status !== 'Waiting'}
                >
                  {room.status === 'Waiting' ? '입장' : '참여불가'}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* --- '방 만들기' 모달 (팝업) --- */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>방 만들기</h2>
            
            <label>방 제목</label>
            <input 
              type="text" 
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
            />

            <label>대결 종류</label>
            <div className="type-select">
              <button 
                onClick={() => setNewRoomType("CODE")}
                className={newRoomType === 'CODE' ? 'active' : ''}
              >코딩테스트</button>
              <button 
                onClick={() => setNewRoomType("MINI")}
                className={newRoomType === 'MINI' ? 'active' : ''}
              >미니퀴즈</button>
            </div>
            
            <div className="private-check">
              <input 
                type="checkbox" 
                id="isPrivate" 
                checked={isNewRoomPrivate}
                onChange={(e) => setIsNewRoomPrivate(e.target.checked)}
              />
              <label htmlFor="isPrivate">비공개 방</label>
            </div>

            {/* 비공개 체크시에만 비밀번호 입력창 보임 */}
            {isNewRoomPrivate && (
              <>
                <label>비밀번호</label>
                <input 
                  type="password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                />
              </>
            )}

            <div className="modal-buttons">
              <button onClick={() => setIsModalOpen(false)}>취소</button>
              <button onClick={handleCreateRoom} className="confirm-btn">확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}