// FullResultScreen.jsx - 원클릭 전체 변환 결과 화면
// 스와이프 갤러리 + 2차 통합 교육자료
import React, { useState, useRef, useEffect } from 'react';
import { oneclickSecondaryEducation } from '../data/oneclickEducation';

// IndexedDB 저장 함수 (GalleryScreen에서 가져옴)
const DB_NAME = 'PicoArtGallery';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

const saveImageToDB = async (imageData) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(imageData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch (error) {
    console.error('IndexedDB 저장 실패:', error);
    return false;
  }
};

const FullResultScreen = ({ originalPhoto, results, selectedStyle, onReset, onGallery }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedToGallery, setSavedToGallery] = useState(new Set());
  const [showEducation, setShowEducation] = useState(true);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 성공한 결과만 필터링
  const successResults = results.filter(r => r.success);
  const currentResult = successResults[currentIndex];

  // 현재 결과의 2차 교육자료 가져오기
  const getEducationContent = () => {
    if (!currentResult) return null;
    
    const style = currentResult.style;
    const workKey = currentResult.selected_work;
    
    // 작품 키로 먼저 찾기
    if (workKey && oneclickSecondaryEducation[workKey]) {
      return oneclickSecondaryEducation[workKey];
    }
    
    // 스타일 ID로 찾기 (fallback)
    const styleId = style.id;
    
    // 미술사조의 경우 첫 번째 작품 키 패턴으로 찾기
    const possibleKeys = Object.keys(oneclickSecondaryEducation).filter(key => 
      key.startsWith(styleId) || key.includes(styleId)
    );
    
    if (possibleKeys.length > 0) {
      return oneclickSecondaryEducation[possibleKeys[0]];
    }
    
    return null;
  };

  // 터치/스와이프 핸들러
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < successResults.length - 1) {
        // 왼쪽으로 스와이프 → 다음
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // 오른쪽으로 스와이프 → 이전
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentIndex < successResults.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, successResults.length]);

  // 갤러리에 저장
  const handleSaveToGallery = async () => {
    if (!currentResult) return;
    
    const imageData = {
      id: `fullresult-${Date.now()}-${currentIndex}`,
      resultUrl: currentResult.resultUrl,
      styleName: currentResult.style.name,
      styleId: currentResult.style.id,
      category: currentResult.style.category,
      aiSelectedArtist: currentResult.aiSelectedArtist,
      createdAt: new Date().toISOString()
    };

    const success = await saveImageToDB(imageData);
    if (success) {
      setSavedToGallery(prev => new Set([...prev, currentIndex]));
    }
  };

  // 전체 갤러리에 저장
  const handleSaveAllToGallery = async () => {
    for (let i = 0; i < successResults.length; i++) {
      const result = successResults[i];
      const imageData = {
        id: `fullresult-${Date.now()}-${i}`,
        resultUrl: result.resultUrl,
        styleName: result.style.name,
        styleId: result.style.id,
        category: result.style.category,
        aiSelectedArtist: result.aiSelectedArtist,
        createdAt: new Date().toISOString()
      };
      await saveImageToDB(imageData);
    }
    setSavedToGallery(new Set(successResults.map((_, i) => i)));
    alert(`${successResults.length}개 이미지가 갤러리에 저장되었습니다!`);
  };

  // 다운로드
  const handleDownload = () => {
    if (!currentResult) return;
    
    const link = document.createElement('a');
    link.href = currentResult.resultUrl;
    link.download = `arttouch-${currentResult.style.name}-${Date.now()}.png`;
    link.click();
  };

  // 카테고리별 색상
  const getCategoryColor = () => {
    const category = selectedStyle?.category;
    switch (category) {
      case 'movements': return { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(102, 126, 234, 0.3)' };
      case 'masters': return { bg: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', shadow: 'rgba(245, 175, 25, 0.3)' };
      case 'oriental': return { bg: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', shadow: 'rgba(238, 9, 121, 0.3)' };
      default: return { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(102, 126, 234, 0.3)' };
    }
  };

  const categoryColor = getCategoryColor();
  const educationContent = getEducationContent();

  if (successResults.length === 0) {
    return (
      <div className="full-result-screen">
        <div className="error-container">
          <h2>😢 변환 실패</h2>
          <p>모든 변환이 실패했습니다. 다시 시도해주세요.</p>
          <button onClick={onReset}>처음으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-result-screen" style={{ background: categoryColor.bg }}>
      {/* 헤더 */}
      <div className="header">
        <button className="back-btn" onClick={onReset}>← 처음으로</button>
        <div className="counter">{currentIndex + 1} / {successResults.length}</div>
        <button className="gallery-btn" onClick={onGallery}>갤러리</button>
      </div>

      {/* 메인 컨텐츠 - 스와이프 영역 */}
      <div 
        className="swipe-container"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 결과 이미지 */}
        <div className="result-card">
          <div className="style-badge">{currentResult?.style?.name}</div>
          
          <div className="image-container">
            <img 
              src={currentResult?.resultUrl} 
              alt={currentResult?.style?.name}
              className="result-image"
            />
          </div>

          {/* AI 선택 정보 */}
          {currentResult?.aiSelectedArtist && (
            <div className="ai-info">
              🤖 AI 선택: {currentResult.aiSelectedArtist}
            </div>
          )}

          {/* 2차 교육자료 */}
          {showEducation && educationContent && (
            <div className="education-section">
              <h3>{educationContent.name || currentResult?.style?.name}</h3>
              <p>{educationContent.content}</p>
            </div>
          )}
        </div>

        {/* 좌우 네비게이션 화살표 */}
        {currentIndex > 0 && (
          <button className="nav-btn prev" onClick={() => setCurrentIndex(prev => prev - 1)}>
            ‹
          </button>
        )}
        {currentIndex < successResults.length - 1 && (
          <button className="nav-btn next" onClick={() => setCurrentIndex(prev => prev + 1)}>
            ›
          </button>
        )}
      </div>

      {/* 하단 점(●) 네비게이션 */}
      <div className="dots-nav">
        {successResults.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${idx === currentIndex ? 'active' : ''} ${savedToGallery.has(idx) ? 'saved' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="action-buttons">
        <button 
          className={`action-btn save ${savedToGallery.has(currentIndex) ? 'saved' : ''}`}
          onClick={handleSaveToGallery}
          disabled={savedToGallery.has(currentIndex)}
        >
          {savedToGallery.has(currentIndex) ? '✓ 저장됨' : '💾 저장'}
        </button>
        <button className="action-btn save-all" onClick={handleSaveAllToGallery}>
          📁 전체 저장
        </button>
        <button className="action-btn download" onClick={handleDownload}>
          ⬇️ 다운로드
        </button>
      </div>

      <style>{`
        .full-result-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .back-btn, .gallery-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .counter {
          color: white;
          font-weight: bold;
          font-size: 1rem;
        }

        .swipe-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 500px;
          width: 100%;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .style-badge {
          display: inline-block;
          background: ${categoryColor.bg};
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .image-container {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .result-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ai-info {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 1rem;
        }

        .education-section {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
          padding: 1.25rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .education-section h3 {
          color: #667eea;
          font-size: 1rem;
          margin: 0 0 0.75rem 0;
        }

        .education-section p {
          color: #333;
          font-size: 0.9rem;
          line-height: 1.7;
          margin: 0;
          white-space: pre-line;
        }

        /* 네비게이션 버튼 */
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.9);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .nav-btn.prev { left: 0.5rem; }
        .nav-btn.next { right: 0.5rem; }

        .nav-btn:hover {
          background: white;
          transform: translateY(-50%) scale(1.1);
        }

        /* 하단 점 네비게이션 */
        .dots-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 1rem 0;
          flex-wrap: wrap;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .dot.active {
          background: white;
          transform: scale(1.3);
        }

        .dot.saved {
          background: #4CAF50;
        }

        .dot.active.saved {
          background: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
        }

        /* 액션 버튼 */
        .action-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          padding-bottom: 1rem;
        }

        .action-btn {
          background: rgba(255,255,255,0.95);
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.9rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .action-btn.save.saved {
          background: #4CAF50;
          color: white;
        }

        .action-btn.save-all {
          background: #667eea;
          color: white;
        }

        /* 에러 컨테이너 */
        .error-container {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          max-width: 400px;
          margin: auto;
        }

        .error-container button {
          background: #667eea;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 1rem;
        }

        @media (max-width: 640px) {
          .result-card {
            padding: 1rem;
          }

          .nav-btn {
            width: 36px;
            height: 36px;
            font-size: 1.2rem;
          }

          .action-btn {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }

          .education-section {
            padding: 1rem;
          }

          .education-section p {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FullResultScreen;
