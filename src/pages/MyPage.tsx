// MyPage.tsx

import './Mypage.css';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function MyPage() {
  const recentRecords = [
    { id: 1, title: '코딩 배틀 vs 홍길동', date: '2025-11-10', result: '승리' },
    { id: 2, title: '코딩 배틀 vs 김정보', date: '2025-11-09', result: '패배' },
    { id: 3, title: '주간 랭킹전', date: '2025-11-08', result: '3위' },
  ];

  return (
    <div className="mypage-wrapper-fluid bg-light min-vh-100" >
      <div className="mypage-banner" />

      <div className="container-fluid pb-5" style={{ marginTop: '-40px' }}>
        {/* 프로필 영역 */}
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex flex-wrap justify-content-between align-items-start">
            {/* 왼쪽: 아바타 + 닉네임 + 버튼들 */}
            <div className="d-flex align-items-center flex-wrap gap-3">
              {/* 아바타 + 레벨 뱃지 */}
              <div className="position-relative">
                <div
                  className="rounded-circle bg-secondary"
                  style={{ width: 160, height: 160 }}
                />
                <div
                  className="position-absolute bottom-0 start-50 translate-middle-x bg-warning text-dark rounded-pill px-2 py-1 small fw-bold"
                  style={{ transform: 'translate(-50%, 30%)' }}
                >
                  Lv. 5
                </div>
              </div>

              {/* 닉네임 + 칭호/커스터마이징 버튼 */}
              <div>
                <h3 className="mb-1">cnicky0705</h3>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className="badge bg-success">Gold V 908</span>
                  <span className="badge bg-info text-dark">정보대 랭킹 상위 3%</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-outline-secondary">
                    칭호 수정
                  </button>
                  <button className="btn btn-sm btn-outline-secondary">
                    커스터마이징
                  </button>
                </div>
              </div>
            </div>

            {/* 오른쪽: 프로필 편집 / 티어 정보 */}
            <div className="mt-3 mt-md-0 text-md-end">
              <button className="btn btn-primary btn-sm mb-2">
                프로필 편집
              </button>
              <div className="small text-muted">
                <div>현재 티어: Gold V</div>
                <div>Gold IV 승급까지 -42</div>
              </div>
            </div>
          </div>

          {/* 티어 경험치 게이지 바 */}
          <div className="card-footer bg-white">
            <div className="d-flex justify-content-between small mb-1">
              <span>Gold V 908</span>
              <span>Gold IV 까지 -42</span>
            </div>
            <div className="progress" style={{ height: 12 }}>
              <div
                className="progress-bar bg-warning"
                style={{ width: '80%' }}
              />
            </div>
          </div>
        </div>


        {/* 메인 콘텐츠: 왼쪽(프로필 상세) / 오른쪽(요약 카드) */}
        <div className="row g-4">
          {/* 왼쪽 영역 */}
          <div className="col-lg-8">
            {/* 사진 넣기 */}
            <div className="card mb-3">
              <div className="card-header fw-bold">프로필 사진</div>
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  className="rounded-circle bg-secondary flex-shrink-0"
                  style={{ width: 72, height: 72 }}
                />
                <div>
                  <p className="small text-muted mb-2">
                    프로필에 표시할 이미지를 업로드하세요.
                  </p>
                  {/* 나중에 input type="file"로 바꿔도 됨 */}
                  <button className="btn btn-sm btn-outline-secondary">
                    사진 선택
                  </button>
                </div>
              </div>
            </div>

            {/* 기술 스택 입력 */}
            <div className="card mb-3">
              <div className="card-header fw-bold">기술 스택</div>
              <div className="card-body">
                <p className="small text-muted">
                  사용 가능한 언어 / 프레임워크 / 도구를 적어주세요.
                  (예: C++, Python, React, Unity, Spring...)
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="예) C++, JavaScript(React), TypeScript, Unity, Unreal Engine..."
                />
              </div>
            </div>

            {/* 최근 전적 */}
            <div className="card mb-3">
              <div className="card-header fw-bold">최근 전적</div>
              <div className="card-body p-0">
                <table className="table mb-0 table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">날짜</th>
                      <th scope="col">내용</th>
                      <th scope="col">결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="small text-muted">{record.date}</td>
                        <td>{record.title}</td>
                        <td>
                          <span className="badge bg-success">{record.result}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 오른쪽 요약 영역 */}
          <div className="col-lg-4">
            {/* 레이팅 정보 */}
            <div className="card mb-3">
              <div className="card-header fw-bold">레이팅 정보</div>
              <div className="card-body small">
                <div className="mb-1">현재 레이팅: <strong>908</strong></div>
                <div className="mb-1">정보대 전체 상위: <strong>3%</strong></div>
                <div className="text-muted">
                  (정확한 퍼센트 계산 로직은 나중에 연결)
                </div>
              </div>
            </div>

            {/* 티어 카드 */}
            <div className="card mb-3">
              <div className="card-header fw-bold">티어</div>
              <div className="card-body small">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="rounded-circle bg-warning"
                    style={{ width: 32, height: 32 }}
                  />
                  <div>
                    <div className="fw-bold">Gold V</div>
                    <div className="text-muted">솔로 랭크 티어</div>
                  </div>
                </div>
                <div className="text-muted">
                  다음 티어까지 필요한 점수, 승급전 정보 등은 여기 표시.
                </div>
              </div>
            </div>

            {/* 커스터마이징 / 설정 섹션 */}
            <div className="card mb-3">
              <div className="card-header fw-bold">프로필 커스터마이징</div>
              <div className="card-body small d-flex flex-column gap-2">
                <button className="btn btn-sm btn-outline-secondary">
                  프로필 배경 변경
                </button>
                <button className="btn btn-sm btn-outline-secondary">
                  대표 칭호 설정
                </button>
                <button className="btn btn-sm btn-outline-secondary">
                  프로필 공개 범위 설정
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
