// GalleryScreen.jsx - 갤러리 컴포넌트
// 로컬 저장 + 그리드 UI + 다운로드/삭제 기능
import React, { useState, useEffect } from 'react';

const GalleryScreen = ({ onBack, onSelectImage }) => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 갤러리 로드
  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = () => {
    try {
      const saved = localStorage.getItem('picoart_gallery');
      if (saved) {
        const items = JSON.parse(saved);
        // 최신순 정렬
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setGalleryItems(items);
      }
    } catch (error) {
      console.error('갤러리 로드 실패:', error);
    }
    setIsLoading(false);
  };

  // 이미지 삭제
  const handleDelete = (id) => {
    if (window.confirm('이 이미지를 삭제하시겠습니까?')) {
      const updated = galleryItems.filter(item => item.id !== id);
      setGalleryItems(updated);
      localStorage.setItem('picoart_gallery', JSON.stringify(updated));
      setSelectedItem(null);
    }
  };

  // 이미지 다운로드
  const handleDownload = async (item) => {
    try {
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `picoart_${item.styleName}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

  // 전체 삭제
  const handleClearAll = () => {
    if (window.confirm('모든 이미지를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      setGalleryItems([]);
      localStorage.removeItem('picoart_gallery');
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← 뒤로
        </button>
        <h2 style={styles.title}>🖼️ 나의 갤러리</h2>
        {galleryItems.length > 0 && (
          <button style={styles.clearButton} onClick={handleClearAll}>
            전체 삭제
          </button>
        )}
      </div>

      {/* 안내 메시지 */}
      <div style={styles.notice}>
        <p>💡 이미지는 기기에 저장됩니다. 앱 삭제 시 함께 삭제됩니다.</p>
      </div>

      {/* 갤러리 그리드 */}
      {galleryItems.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>🎨</p>
          <p style={styles.emptyText}>아직 변환된 이미지가 없습니다</p>
          <p style={styles.emptySubtext}>사진을 변환하면 여기에 자동 저장됩니다</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {galleryItems.map((item) => (
            <div
              key={item.id}
              style={styles.gridItem}
              onClick={() => setSelectedItem(item)}
            >
              <img
                src={item.imageUrl}
                alt={item.styleName}
                style={styles.thumbnail}
              />
              <div style={styles.itemLabel}>
                <span style={styles.styleName}>{item.styleName}</span>
                <span style={styles.date}>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 보기 모달 */}
      {selectedItem && (
        <div style={styles.modal} onClick={() => setSelectedItem(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              style={styles.closeButton}
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </button>
            
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.styleName}
              style={styles.modalImage}
            />
            
            <div style={styles.modalInfo}>
              <h3 style={styles.modalTitle}>{selectedItem.styleName}</h3>
              <p style={styles.modalDate}>{formatDate(selectedItem.createdAt)}</p>
              {selectedItem.categoryName && (
                <p style={styles.modalCategory}>{selectedItem.categoryName}</p>
              )}
            </div>
            
            <div style={styles.modalActions}>
              <button
                style={styles.downloadButton}
                onClick={() => handleDownload(selectedItem)}
              >
                📥 다운로드
              </button>
              <button
                style={styles.deleteButton}
                onClick={() => handleDelete(selectedItem.id)}
              >
                🗑️ 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 갤러리에 이미지 저장하는 유틸 함수 (외부에서 사용)
export const saveToGallery = (imageUrl, styleName, categoryName = '') => {
  try {
    const saved = localStorage.getItem('picoart_gallery');
    const items = saved ? JSON.parse(saved) : [];
    
    const newItem = {
      id: `gallery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl,
      styleName,
      categoryName,
      createdAt: new Date().toISOString()
    };
    
    items.unshift(newItem); // 최신순으로 앞에 추가
    
    // 최대 100개 제한 (선택사항)
    // if (items.length > 100) items.pop();
    
    localStorage.setItem('picoart_gallery', JSON.stringify(items));
    console.log('✅ 갤러리에 저장됨:', styleName);
    return true;
  } catch (error) {
    console.error('갤러리 저장 실패:', error);
    return false;
  }
};

// 스타일 정의
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: 'white',
    padding: '20px',
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  
  backButton: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  
  clearButton: {
    background: 'rgba(255,100,100,0.3)',
    border: 'none',
    color: '#ff6b6b',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  
  notice: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '0.85rem',
    opacity: 0.8,
  },
  
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    fontSize: '1.2rem',
  },
  
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    textAlign: 'center',
  },
  
  emptyIcon: {
    fontSize: '4rem',
    margin: 0,
  },
  
  emptyText: {
    fontSize: '1.2rem',
    margin: '20px 0 10px',
  },
  
  emptySubtext: {
    fontSize: '0.9rem',
    opacity: 0.7,
    margin: 0,
  },
  
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
  },
  
  gridItem: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  
  thumbnail: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    display: 'block',
  },
  
  itemLabel: {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  
  styleName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#a78bfa',
  },
  
  date: {
    fontSize: '0.75rem',
    opacity: 0.6,
  },
  
  // 모달 스타일
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  
  modalContent: {
    background: '#1a1a2e',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  },
  
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    zIndex: 10,
  },
  
  modalImage: {
    width: '100%',
    display: 'block',
    borderRadius: '16px 16px 0 0',
  },
  
  modalInfo: {
    padding: '20px',
    textAlign: 'center',
  },
  
  modalTitle: {
    margin: '0 0 8px',
    fontSize: '1.3rem',
    color: '#a78bfa',
  },
  
  modalDate: {
    margin: 0,
    fontSize: '0.9rem',
    opacity: 0.7,
  },
  
  modalCategory: {
    margin: '8px 0 0',
    fontSize: '0.85rem',
    color: '#67e8f9',
  },
  
  modalActions: {
    display: 'flex',
    gap: '10px',
    padding: '0 20px 20px',
  },
  
  downloadButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    padding: '14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  
  deleteButton: {
    flex: 1,
    background: 'rgba(255,100,100,0.2)',
    border: '1px solid rgba(255,100,100,0.5)',
    color: '#ff6b6b',
    padding: '14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  
  // PC 반응형 (5~6열)
  '@media (min-width: 768px)': {
    grid: {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
  },
  '@media (min-width: 1200px)': {
    grid: {
      gridTemplateColumns: 'repeat(6, 1fr)',
    },
  },
};

export default GalleryScreen;
