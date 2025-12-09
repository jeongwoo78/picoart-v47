// PhotoStyleScreen.jsx - 사진 업로드 + 세부 스타일 선택 통합 화면
import React, { useRef, useState } from 'react';

const PhotoStyleScreen = ({ mainCategory, onBack, onSelect }) => {
  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // 카테고리별 데이터
  const categoryData = {
    movements: {
      name: '미술사조',
      icon: '🎨',
      fullTransform: {
        id: 'movements-all',
        name: '미술사조 전체 변환',
        desc: '당신의 사진 한 장이 2,500년 서양 미술을 관통합니다',
        count: 11,
        isFullTransform: true,
        category: 'movements'
      },
      styles: [
        { id: 'ancient', name: '그리스·로마', icon: '🏛️', period: 'BC 800 - AD 500' },
        { id: 'medieval', name: '중세 미술', icon: '⛪', period: '4-14세기' },
        { id: 'renaissance', name: '르네상스', icon: '🎭', period: '14-16세기' },
        { id: 'baroque', name: '바로크', icon: '👑', period: '17세기' },
        { id: 'rococo', name: '로코코', icon: '🌸', period: '18세기' },
        { id: 'neoclassicism_vs_romanticism_vs_realism', name: '신고전 vs 낭만 vs 사실', icon: '⚖️', period: '1770-1870' },
        { id: 'impressionism', name: '인상주의', icon: '🌅', period: '1860-1890' },
        { id: 'postImpressionism', name: '후기인상주의', icon: '🌻', period: '1880-1910' },
        { id: 'fauvism', name: '야수파', icon: '🎨', period: '1905-1908' },
        { id: 'expressionism', name: '표현주의', icon: '😱', period: '1905-1920' },
        { id: 'modernism', name: '모더니즘', icon: '🔮', period: '1907-1970' }
      ]
    },
    masters: {
      name: '거장 컬렉션',
      icon: '⭐',
      fullTransform: {
        id: 'masters-all',
        name: '거장 전체 변환',
        desc: '당신의 사진 한 장이 일곱 거장의 세계를 만납니다',
        count: 7,
        isFullTransform: true,
        category: 'masters'
      },
      styles: [
        { id: 'vangogh-master', name: '반 고흐', icon: '🌻', period: '1853-1890' },
        { id: 'klimt-master', name: '클림트', icon: '✨', period: '1862-1918' },
        { id: 'munch-master', name: '뭉크', icon: '😱', period: '1863-1944' },
        { id: 'matisse-master', name: '마티스', icon: '🎭', period: '1869-1954' },
        { id: 'picasso-master', name: '피카소', icon: '🎨', period: '1881-1973' },
        { id: 'frida-master', name: '프리다 칼로', icon: '🌺', period: '1907-1954' },
        { id: 'warhol-master', name: '앤디 워홀', icon: '🥫', period: '1928-1987' }
      ]
    },
    oriental: {
      name: '동양화',
      icon: '🎎',
      fullTransform: {
        id: 'oriental-all',
        name: '동양화 전체 변환',
        desc: '당신의 사진 한 장이 천 년의 동양 미학을 만납니다',
        count: 6,
        isFullTransform: true,
        category: 'oriental'
      },
      styles: [
        { id: 'korean', name: '한국 전통 회화', icon: '🎎', period: '수묵화·민화·풍속화' },
        { id: 'chinese', name: '중국 전통 회화', icon: '🐉', period: '수묵산수·공필화' },
        { id: 'japanese', name: '일본 전통 회화', icon: '🗾', period: '우키요에' }
      ]
    }
  };

  const currentCategory = categoryData[mainCategory];

  // 드래그 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // 스타일 선택
  const handleStyleSelect = (style) => {
    if (!photo) {
      alert('먼저 사진을 선택해주세요!');
      return;
    }
    onSelect(photo, { ...style, category: mainCategory });
  };

  // 전체 변환 선택
  const handleFullTransform = () => {
    if (!photo) {
      alert('먼저 사진을 선택해주세요!');
      return;
    }
    onSelect(photo, currentCategory.fullTransform);
  };

  return (
    <div className="photo-style-screen">
      {/* 헤더 */}
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>← 다시 선택</button>
        <div className="category-badge">
          <span>{currentCategory.icon}</span>
          <span>{currentCategory.name}</span>
        </div>
      </div>

      {/* 사진 업로드 영역 */}
      <div className="photo-section">
        <div
          className={`photo-area ${dragActive ? 'drag-active' : ''} ${photoPreview ? 'has-photo' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="미리보기" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <span className="photo-icon">📷</span>
              <p className="photo-text">사진을 여기에 드래그하거나 클릭하세요</p>
              <p className="photo-hint">JPG, PNG 파일 지원</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>
        {photoPreview && (
          <button className="change-photo-btn" onClick={handleClick}>
            📷 사진 변경하기
          </button>
        )}
      </div>

      {/* 스타일 선택 영역 */}
      <div className="style-section">
        <h3 className="style-title">스타일 선택</h3>

        {/* 전체 변환 버튼 */}
        <button 
          className={`full-transform-btn ${mainCategory}`}
          onClick={handleFullTransform}
        >
          <span className="ft-icon">✨</span>
          <div className="ft-content">
            <span className="ft-title">전체 변환</span>
            <span className="ft-desc">{currentCategory.fullTransform.desc}</span>
          </div>
        </button>

        {/* 개별 스타일 그리드 */}
        <div className="style-grid">
          {currentCategory.styles.map(style => (
            <button
              key={style.id}
              className="style-card"
              onClick={() => handleStyleSelect(style)}
            >
              <span className="style-icon">{style.icon}</span>
              <span className="style-name">{style.name}</span>
              <span className="style-period">{style.period}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .photo-style-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
        }

        .screen-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .back-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .category-badge {
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .photo-section {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        .photo-area {
          border: 3px dashed #cbd5e0;
          border-radius: 16px;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          overflow: hidden;
        }

        .photo-area:hover,
        .photo-area.drag-active {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .photo-area.has-photo {
          border: none;
          padding: 0;
        }

        .photo-placeholder {
          text-align: center;
          padding: 2rem;
        }

        .photo-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .photo-text {
          font-size: 1rem;
          color: #4a5568;
          margin: 0 0 0.5rem;
        }

        .photo-hint {
          font-size: 0.85rem;
          color: #a0aec0;
          margin: 0;
        }

        .photo-preview {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 12px;
        }

        .change-photo-btn {
          width: 100%;
          margin-top: 1rem;
          padding: 12px;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 10px;
          color: #667eea;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .change-photo-btn:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .style-section {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        .style-title {
          text-align: center;
          color: #2d3748;
          margin: 0 0 1rem;
          font-size: 1.2rem;
        }

        .full-transform-btn {
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s;
        }

        /* 미술사조 - 보라→파랑 (클래식) */
        .full-transform-btn.movements {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .full-transform-btn.movements:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        /* 거장 - 금색→주황 (프리미엄) */
        .full-transform-btn.masters {
          background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
          box-shadow: 0 4px 15px rgba(245, 175, 25, 0.3);
        }
        .full-transform-btn.masters:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(245, 175, 25, 0.4);
        }

        /* 동양화 - 빨강→분홍 (전통) */
        .full-transform-btn.oriental {
          background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
          box-shadow: 0 4px 15px rgba(238, 9, 121, 0.3);
        }
        .full-transform-btn.oriental:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(238, 9, 121, 0.4);
        }

        .ft-icon {
          font-size: 2rem;
        }

        .ft-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .ft-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .ft-desc {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.9);
          text-align: left;
        }

        .style-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .style-card {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem 0.75rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .style-card:hover {
          border-color: #667eea;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
        }

        .style-icon {
          font-size: 1.8rem;
        }

        .style-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #2d3748;
          text-align: center;
        }

        .style-period {
          font-size: 0.7rem;
          color: #718096;
          text-align: center;
        }

        @media (max-width: 768px) {
          .style-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .photo-preview {
            max-height: 250px;
          }

          .ft-desc {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .style-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }

          .style-card {
            padding: 0.75rem 0.5rem;
          }

          .style-icon {
            font-size: 1.5rem;
          }

          .style-name {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PhotoStyleScreen;
