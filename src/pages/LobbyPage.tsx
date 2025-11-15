import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './LobbyPage.css';

// --- 타입 및 데이터 정의 (이전과 동일) ---
type BattleType = '코테' | '미니';
type FilterType = '전체' | BattleType;
type RoomStatus = '대기 중' | '진행 중';
type Grade = '전체' | 'A+' | 'A0' | 'B+' | 'B0' | 'C+' | 'C0' | 'D+' | 'D0' | 'F';

const GRADES: Grade[] = ['전체', 'A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F'];

interface Room {
    id: number;
    type: BattleType;
    title: string;
    tier: Grade;
    currentPlayers: number;
    maxPlayers: number;
    status: RoomStatus;
    isPrivate: boolean;
}

const DUMMY_ROOMS_INITIAL: Room[] = [
    { id: 1, type: '미니', title: 'OS 기본 지식 스피드 퀴즈 (제한 없음)', tier: 'B0', currentPlayers: 1, maxPlayers: 2, status: '대기 중', isPrivate: false },
    { id: 2, type: '코테', title: '자료구조 A+ 받기 배틀', tier: 'A+', currentPlayers: 1, maxPlayers: 2, status: '대기 중', isPrivate: false },
    { id: 3, type: '코테', title: '1황 가리기 돌아와 (진행 중)', tier: 'A0', currentPlayers: 2, maxPlayers: 2, status: '진행 중', isPrivate: true },
    { id: 4, type: '코테', title: '정보대 최고수들의 대결', tier: 'B+', currentPlayers: 1, maxPlayers: 2, status: '대기 중', isPrivate: true },
    { id: 5, type: '미니', title: '최신 웹 트렌드 미니 퀴즈', tier: 'C0', currentPlayers: 0, maxPlayers: 2, status: '대기 중', isPrivate: false },
];

// --- PasswordModal 컴포넌트 (이전과 동일) ---
interface PasswordModalProps {
    roomTitle: string;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ roomTitle, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');

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
                <p className="room-title-display">방 제목: **{roomTitle}**</p>

                <label className="input-label">비밀번호 입력</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="input-field"
                    autoFocus
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
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


// --- RoomItem 컴포넌트 (이전과 동일) ---
const RoomItem: React.FC<{ room: Room; onEnter: (room: Room) => void }> = ({ room, onEnter }) => {
    const isCote = room.type === '코테';
    const isFull = room.currentPlayers === room.maxPlayers;
    const isPlaying = room.status === '진행 중';
    const canEnter = !isFull && !isPlaying;

    return (
        <div className={`room-item ${isPlaying ? 'playing' : ''}`}>
            <div className={`room-type-tag ${isCote ? 'cote' : 'mini'}`}>
                {room.type}
            </div>

            <div className="room-details">
                <div className="room-title">
                    {room.title}
                </div>
                <div className={`room-tier-info ${room.tier.toLowerCase().replace('+', '\\+')}`}>
                    {room.tier}
                </div>
            </div>

            <div className="room-status-actions">
                {room.isPrivate && <span className="room-lock">🔒 잠김</span>}
                <span className="room-privacy">
                    {room.isPrivate ? '비공개' : '공개'} ({room.status})
                </span>

                <span className={`room-players ${isFull ? 'full' : ''}`}>
                    ({room.currentPlayers}/{room.maxPlayers})
                </span>

                <button
                    className={`action-btn ${canEnter ? 'enter' : isPlaying ? 'in-progress' : 'disabled'}`}
                    disabled={!canEnter}
                    onClick={() => canEnter && onEnter(room)}
                >
                    {isPlaying ? '진행 중' : canEnter ? '입장' : '대기 중'}
                </button>
            </div>
        </div>
    );
};


// --- CreateRoomModal 컴포넌트 (이전과 동일) ---
interface CreateRoomModalProps {
    onClose: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose }) => {
    const [roomType, setRoomType] = useState<BattleType>('코테');
    const [isPrivate, setIsPrivate] = useState(false);

    return (
        <div className="modal-overlay">
            <div className="create-room-modal">
                <h2>새로운 대결 방 만들기 (1:1 전용)</h2>

                <div className="modal-content-area">
                    <label className="input-label">방 제목</label>
                    <input type="text" placeholder="예: 자료구조 A+ 평가 완벽" className="input-field" />

                    <label className="input-label">대결 종류</label>
                    <div className="type-selector">
                        <button
                            className={`type-btn ${roomType === '코테' ? 'active' : ''}`}
                            onClick={() => setRoomType('코테')}
                        >
                            💻 코딩 테스트
                        </button>
                        <button
                            className={`type-btn ${roomType === '미니' ? 'active' : ''}`}
                            onClick={() => setRoomType('미니')}
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
                            {isPrivate ? '비공개 방 (비밀번호 설정 기능)' : '공개 방'}
                        </span>
                    </div>
                    {isPrivate && (
                        <input
                            type="password"
                            placeholder="비밀번호 설정"
                            className="input-field"
                        />
                    )}

                    <label className="input-label">최대 인원</label>
                    <p className="max-players-info">**2명 (1:1 대결)**</p>
                </div>

                <div className="modal-actions">
                    <button className="create-btn">방 만들기</button>
                    <button className="cancel-btn" onClick={onClose}>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Lobby Page Component ---
const LobbyPage: React.FC = () => {
    const navigate = useNavigate();

    const [rooms, setRooms] = useState<Room[]>(DUMMY_ROOMS_INITIAL);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('전체');
    const [gradeFilter, setGradeFilter] = useState<Grade>('전체');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // ⭐ 다크 모드 상태
    const [darkMode, setDarkMode] = useState(false);

    // ⭐ 임시 로그인 정보
    const [userInfo] = useState({
        isLoggedIn: true,
        nickname: "정보대1황",
        tier: "A+",
    });

    const handleRefresh = () => {
        console.log("방 목록 새로고침 시도");
        setRooms([...DUMMY_ROOMS_INITIAL,
            { id: Date.now(), type: '미니', title: '⚡️방금 생성된 새 퀴즈 방', tier: 'C+', currentPlayers: 0, maxPlayers: 2, status: '대기 중', isPrivate: false }
        ]);
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === '전체' || room.type === filterType;
        const matchesGrade = gradeFilter === '전체' || room.tier === gradeFilter;

        return matchesSearch && matchesType && matchesGrade;
    });

    const handleExit = () => {
        navigate('/');
    };

    const handleMyPage = () => {
        navigate('/me');
    };

    const handleEnterRoom = (room: Room) => {
        if (room.isPrivate) {
            setSelectedRoom(room);
            setShowPasswordModal(true);
        } else {
            console.log(`공개 방 '${room.title}' 입장 시도`);
            alert(`공개 방 입장: ${room.title}`);
        }
    };

    const handlePasswordConfirm = (password: string) => {
        if (selectedRoom) {
            console.log(`[비밀번호 검증] 방: ${selectedRoom.title}, 입력된 비밀번호: ${password}`);
            // 실제 구현에서는 서버와 통신하여 비밀번호 검증
            if (password === '1234') { // 임시 검증
                alert(`비밀번호 확인 성공! 방 입장: ${selectedRoom.title}`);
            } else {
                alert(`비밀번호가 일치하지 않습니다.`);
            }
        }
        setShowPasswordModal(false);
        setSelectedRoom(null);
    };


    return (
        // ⭐ 다크 모드 클래스 동적 적용
        <div className={`lobby-container ${darkMode ? 'dark-mode' : ''}`}>
            {/* 🏆 헤더 (상단) */}
            <div className="lobby-header-final">
                <button className="exit-btn" onClick={handleExit}>
                    ← 나가기
                </button>
                <div className="header-spacer"></div>

                {/* ☀️/🌙 다크 모드 토글 버튼 */}
                <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? '☀️' : '🌙'}
                </button>

                {/* ⭐ 사용자 정보 표시 영역 */}
                {userInfo.isLoggedIn ? (
                    <div className={`user-info-display tier-${userInfo.tier.toLowerCase().replace('+', '\\+')}`}>
                        <span className="user-nickname">{userInfo.nickname}</span>
                        <span className="user-tier">({userInfo.tier})</span>
                    </div>
                ) : (
                    <div className="user-info-display not-logged-in">
                        로그인 필요
                    </div>
                )}

                <button className="mypage-btn" onClick={handleMyPage}>
                    👤 마이페이지
                </button>
            </div>

            {/* ⭐ 방 만들기 버튼을 검색/필터 영역 위에 배치 */}
            <div className="create-room-area">
                <button className="create-room-btn large-create-btn" onClick={() => setIsModalOpen(true)}>
                    + 방 만들기
                </button>
            </div>

            {/* 검색 및 필터링 영역 */}
            <div className="search-filter-area">
                <input
                    type="text"
                    placeholder="방 제목으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <div className="filter-group">
                    {/* 방 종류 필터 */}
                    <div className="filter-buttons type-filter">
                        {['전체', '코테', '미니'].map((type) => (
                            <button
                                key={type}
                                className={`filter-btn ${filterType === type ? 'active' : ''}`}
                                onClick={() => setFilterType(type as FilterType)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* 학점 티어 필터 */}
                    <div className="filter-buttons grade-filter">
                        {GRADES.map((grade) => (
                            <button
                                key={grade}
                                className={`grade-btn ${gradeFilter === grade ? 'active' : ''}`}
                                onClick={() => setGradeFilter(grade)}
                            >
                                {grade}
                            </button>
                        ))}
                    </div>

                    {/* 새로고침 버튼 */}
                    <button className="refresh-btn" onClick={handleRefresh}>
                        🔄 새로고침
                    </button>
                </div>
            </div>

            {/* 방 목록 (Room List) 영역 (이전과 동일) */}
            <div className="room-list-container">
                {filteredRooms.map(room => (
                    <RoomItem key={room.id} room={room} onEnter={handleEnterRoom} />
                ))}
                <p className="private-room-guide">
                    **비공개 방 테스트** (PW: 1234)
                </p>
            </div>

            {/* 모달 */}
            {isModalOpen && <CreateRoomModal onClose={() => setIsModalOpen(false)} />}
            {showPasswordModal && selectedRoom && (
                <PasswordModal
                    roomTitle={selectedRoom.title}
                    onClose={() => {setShowPasswordModal(false); setSelectedRoom(null);}}
                    onConfirm={handlePasswordConfirm}
                />
            )}
        </div>
    );
};

export default LobbyPage;