// PicoArt v70 - ProcessingScreen (점 하단 + 결과 미리보기 + oneclickSecondaryEducation 매칭)
// 변환 중에도 완료된 결과를 스와이프로 확인 가능
import React, { useEffect, useState, useRef } from 'react';
import { processStyleTransfer } from '../utils/styleTransferAPI';
import { educationContent } from '../data/educationContent';
import { oneclickPrimaryEducation, oneclickSecondaryEducation } from '../data/oneclickEducation';

const ProcessingScreen = ({ photo, selectedStyle, onComplete }) => {
  const [stage, setStage] = useState(1);
  const [statusText, setStatusText] = useState('준비 중...');
  const [showEducation, setShowEducation] = useState(false);
  const [aiArtistInfo, setAiArtistInfo] = useState(null);
  
  // 원클릭 전용 상태
  const [isFullTransform, setIsFullTransform] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [completedResults, setCompletedResults] = useState([]);
  const [currentStyleName, setCurrentStyleName] = useState('');
  
  // 미리보기 상태: -1 = 1차 교육 화면, 0+ = 해당 결과 인덱스
  const [viewIndex, setViewIndex] = useState(-1);
  
  // 스와이프 관련
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 카테고리별 스타일 목록
  const fullTransformStyles = {
    movements: [
      { id: 'ancient', name: '그리스·로마', category: 'movements' },
      { id: 'medieval', name: '중세 미술', category: 'movements' },
      { id: 'renaissance', name: '르네상스', category: 'movements' },
      { id: 'baroque', name: '바로크', category: 'movements' },
      { id: 'rococo', name: '로코코', category: 'movements' },
      { id: 'neoclassicism_vs_romanticism_vs_realism', name: '신고전 vs 낭만 vs 사실', category: 'movements' },
      { id: 'impressionism', name: '인상주의', category: 'movements' },
      { id: 'postImpressionism', name: '후기인상주의', category: 'movements' },
      { id: 'fauvism', name: '야수파', category: 'movements' },
      { id: 'expressionism', name: '표현주의', category: 'movements' },
      { id: 'modernism', name: '모더니즘', category: 'movements' }
    ],
    masters: [
      { id: 'vangogh-master', name: '반 고흐', category: 'masters' },
      { id: 'klimt-master', name: '클림트', category: 'masters' },
      { id: 'munch-master', name: '뭉크', category: 'masters' },
      { id: 'matisse-master', name: '마티스', category: 'masters' },
      { id: 'picasso-master', name: '피카소', category: 'masters' },
      { id: 'frida-master', name: '프리다 칼로', category: 'masters' },
      { id: 'warhol-master', name: '앤디 워홀', category: 'masters' }
    ],
    oriental: [
      { id: 'korean', name: '한국 전통 회화', category: 'oriental' },
      { id: 'chinese', name: '중국 전통 회화', category: 'oriental' },
      { id: 'japanese', name: '일본 전통 회화', category: 'oriental' }
    ]
  };

  useEffect(() => {
    if (selectedStyle.isFullTransform) {
      setIsFullTransform(true);
      processFullTransform();
    } else {
      processImage();
    }
  }, []);

  // 스와이프 핸들러
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
      if (diff > 0) {
        // 왼쪽으로 스와이프 → 다음 (완료된 결과로 이동)
        if (viewIndex < completedCount - 1) {
          setViewIndex(prev => prev + 1);
        }
      } else {
        // 오른쪽으로 스와이프 → 이전 (1차 교육 또는 이전 결과)
        if (viewIndex > -1) {
          setViewIndex(prev => prev - 1);
        }
      }
    }
  };

  // 점 클릭으로 해당 결과 보기
  const handleDotClick = (idx) => {
    if (idx < completedCount) {
      setViewIndex(idx);
    }
  };

  // 1차 교육으로 돌아가기
  const handleBackToEducation = () => {
    setViewIndex(-1);
  };

  // ========== 단일 변환 (기존 로직) ==========
  const processImage = async () => {
    try {
      setStage(1);
      setStatusText('사진 준비 중...');
      await sleep(800);

      setStage(2);
      const eduContent = getEducationContent();
      if (eduContent) {
        setStatusText(`${eduContent.title} 스타일 분석 중...`);
        setShowEducation(true);
        await sleep(1000);
      }

      setStage(3);
      setStatusText('AI가 사진을 분석하고 있습니다...');
      await sleep(500);
      
      setStatusText('AI가 최적의 화가를 선택하고 있습니다...');
      await sleep(500);

      const result = await processStyleTransfer(
        photo,
        selectedStyle,
        null,
        (progressText) => setStatusText(progressText)
      );

      if (!result.success) {
        throw new Error(result.error || 'Style transfer failed');
      }

      if (result.aiSelectedArtist) {
        setAiArtistInfo({
          artist: result.aiSelectedArtist,
          method: result.selectionMethod,
          details: result.selectionDetails
        });
        setStatusText(`${result.aiSelectedArtist} 화풍으로 변환 완료!`);
        await sleep(1000);
      }

      setStage(4);
      setShowEducation(false);
      setStatusText('완성되었습니다!');
      await sleep(500);

      onComplete(selectedStyle, result.resultUrl, result);

    } catch (error) {
      console.error('Processing error:', error);
      handleError(error);
    }
  };

  // ========== 원클릭 전체 변환 ==========
  const processFullTransform = async () => {
    try {
      const category = selectedStyle.category;
      const styles = fullTransformStyles[category];
      
      if (!styles) {
        throw new Error('Invalid category for full transform');
      }

      setTotalCount(styles.length);
      setStage(2);
      setShowEducation(true);
      setStatusText(`${styles.length}개 스타일 변환을 시작합니다...`);
      await sleep(1500);

      const results = [];

      // 순차 처리
      for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        setCurrentStyleName(style.name);
        setStatusText(`[${i + 1}/${styles.length}] ${style.name} 변환 중...`);

        try {
          const result = await processStyleTransfer(
            photo,
            style,
            null,
            (progressText) => setStatusText(`[${i + 1}/${styles.length}] ${progressText}`)
          );

          if (result.success) {
            results.push({
              style: style,
              resultUrl: result.resultUrl,
              aiSelectedArtist: result.aiSelectedArtist,
              selected_work: result.selected_work,
              education_key: result.education_key,  // 교육자료 매칭용 키
              success: true
            });
            setCompletedCount(i + 1);
            setCompletedResults([...results]);
          } else {
            results.push({
              style: style,
              error: result.error,
              success: false
            });
            setCompletedCount(i + 1);
          }
        } catch (err) {
          console.error(`Failed to process ${style.name}:`, err);
          results.push({
            style: style,
            error: err.message,
            success: false
          });
          setCompletedCount(i + 1);
        }

        if (i < styles.length - 1) {
          await sleep(500);
        }
      }

      // 전체 완료
      setStage(4);
      setShowEducation(false);
      
      const successCount = results.filter(r => r.success).length;
      setStatusText(`완료! ${successCount}/${styles.length}개 변환 성공`);
      await sleep(1000);

      onComplete(selectedStyle, results, { 
        isFullTransform: true, 
        category,
        results 
      });

    } catch (error) {
      console.error('Full transform error:', error);
      handleError(error);
    }
  };

  // 에러 처리
  const handleError = (error) => {
    const errorMessage = error.message || '알 수 없는 오류가 발생했습니다';
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    const isAPIError = errorMessage.includes('API') || errorMessage.includes('401') || errorMessage.includes('403');
    
    if (isNetworkError) {
      setStatusText('네트워크 오류: 인터넷 연결을 확인해주세요');
    } else if (isAPIError) {
      setStatusText('API 연결 오류: 잠시 후 다시 시도해주세요');
    } else {
      setStatusText(`오류: ${errorMessage}`);
    }
  };

  // 단일 변환용 교육 컨텐츠
  const getEducationContent = () => {
    const category = selectedStyle.category;
    
    if (category !== 'masters' && category !== 'oriental') {
      return educationContent.movements[category];
    }
    
    if (category === 'masters') {
      const masterId = selectedStyle.id;
      const masterInfo = educationContent.masters[masterId];
      
      if (masterInfo) {
        return { title: masterInfo.title, desc: masterInfo.desc };
      }
      return { title: selectedStyle.name || '거장', desc: '선택하신 거장의 화풍으로 변환합니다.' };
    }
    
    if (category === 'oriental') {
      const styleId = selectedStyle.id;
      const orientalInfo = educationContent.oriental[styleId];
      
      if (orientalInfo) {
        return { title: orientalInfo.title, desc: orientalInfo.desc };
      }
      return { title: selectedStyle.name || '동양화', desc: '선택하신 동양화 스타일로 변환합니다.' };
    }

    return null;
  };

  // 원클릭용 1차 통합 교육 컨텐츠
  const getFullTransformEducation = () => {
    const category = selectedStyle.category;
    
    if (category === 'movements') {
      return oneclickPrimaryEducation.movements;
    } else if (category === 'masters') {
      return oneclickPrimaryEducation.masters;
    } else if (category === 'oriental') {
      return oneclickPrimaryEducation.eastern;
    }
    return null;
  };

  // ========== 2차 교육자료 매칭 (education_key 직접 사용) ==========
  const getPreviewEducation = (result) => {
    if (!result) return null;
    
    const educationKey = result.education_key;
    const artistName = result.aiSelectedArtist || '';
    const category = result.style.category;
    const styleId = result.style.id;
    
    console.log('');
    console.log('========================================');
    console.log('🎨 ONECLICK EDUCATION MATCHING (v70):');
    console.log('   - education_key:', educationKey);
    console.log('   - artistName:', artistName);
    console.log('   - category:', category);
    console.log('   - styleId:', styleId);
    console.log('========================================');
    
    // 1. education_key가 있으면 직접 사용
    if (educationKey && oneclickSecondaryEducation[educationKey]) {
      const edu = oneclickSecondaryEducation[educationKey];
      console.log('✅ Found education with key:', educationKey);
      return {
        name: edu.name || artistName,
        content: edu.content || edu.description
      };
    }
    
    // 2. education_key가 없으면 fallback: 화가명으로 매칭 시도
    if (artistName) {
      const matchedKey = findEducationKeyByArtist(artistName);
      if (matchedKey && oneclickSecondaryEducation[matchedKey]) {
        const edu = oneclickSecondaryEducation[matchedKey];
        console.log('✅ Found education with fallback key:', matchedKey);
        return {
          name: edu.name || artistName,
          content: edu.content || edu.description
        };
      }
    }
    
    // 3. 최종 fallback
    console.log('⚠️ No match found, using fallback');
    return getFallbackEducation(styleId, category);
  };

  // 화가명으로 education_key 찾기 (fallback용)
  const findEducationKeyByArtist = (artistName) => {
    const cleanName = artistName
      .replace(/\s*\([^)]*\)/g, '')
      .trim();
    
    const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const words = cleanName.split(/\s+/);
    
    const patterns = [
      cleanName.toLowerCase().replace(/\s+/g, ''),
      cleanName.toLowerCase().replace(/\s+/g, '-'),
      words.length > 1 ? words[words.length - 1].toLowerCase() : null,
      words[0].toLowerCase(),
      normalize(cleanName.toLowerCase().replace(/\s+/g, '')),
      normalize(words.length > 1 ? words[words.length - 1].toLowerCase() : words[0].toLowerCase())
    ].filter(Boolean);
    
    for (const pattern of patterns) {
      if (oneclickSecondaryEducation[pattern]) {
        return pattern;
      }
    }
    return null;
  };

  // Fallback: 1차 교육 또는 스타일명 사용
  const getFallbackEducation = (styleId, category) => {
    // oneclickSecondaryEducation에서 styleId로 직접 찾기
    if (oneclickSecondaryEducation[styleId]) {
      const edu = oneclickSecondaryEducation[styleId];
      return {
        name: edu.name || styleId,
        content: edu.content || edu.description
      };
    }
    
    // 카테고리별 fallback
    const fallbackTexts = {
      movements: '이 작품은 해당 미술 사조의 특징을 반영하여 변환되었습니다.',
      masters: '이 작품은 선택된 거장의 화풍으로 변환되었습니다.',
      oriental: '이 작품은 동양화의 전통 기법으로 변환되었습니다.'
    };
    
    return {
      name: styleId,
      content: fallbackTexts[category] || '변환이 완료되었습니다.'
    };
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 현재 미리보기 중인 결과
  const previewResult = viewIndex >= 0 ? completedResults[viewIndex] : null;
  const previewEducation = previewResult ? getPreviewEducation(previewResult) : null;

  // ========== 렌더링 ==========
  return (
    <div 
      className="processing-screen"
      onTouchStart={isFullTransform ? handleTouchStart : undefined}
      onTouchMove={isFullTransform ? handleTouchMove : undefined}
      onTouchEnd={isFullTransform ? handleTouchEnd : undefined}
    >
      <div className="processing-content">
        {/* 헤더 */}
        <div className="processing-header">
          <h2>{isFullTransform ? '✨ 전체 변환 중' : '🎨 변환 중'}</h2>
          {isFullTransform && viewIndex >= 0 && (
            <button className="back-to-edu-btn" onClick={handleBackToEducation}>
              ← 교육자료
            </button>
          )}
        </div>

        {/* 단일 변환: 기존 단계 UI */}
        {!isFullTransform && (
          <div className="progress-stages">
            <div className={`stage ${stage >= 1 ? 'active' : ''} ${stage > 1 ? 'complete' : ''}`}>
              <span className="stage-number">1</span>
              <span className="stage-label">준비</span>
            </div>
            <div className={`stage ${stage >= 2 ? 'active' : ''} ${stage > 2 ? 'complete' : ''}`}>
              <span className="stage-number">2</span>
              <span className="stage-label">스타일 설명</span>
            </div>
            <div className={`stage ${stage >= 3 ? 'active' : ''} ${stage > 3 ? 'complete' : ''}`}>
              <span className="stage-number">3</span>
              <span className="stage-label">AI 변환</span>
            </div>
            <div className={`stage ${stage >= 4 ? 'active' : ''}`}>
              <span className="stage-number">4</span>
              <span className="stage-label">완료</span>
            </div>
          </div>
        )}

        {/* Status text */}
        <div className="status-container">
          <div className="spinner"></div>
          <p className="status-text">{statusText}</p>
        </div>

        {/* ===== 원클릭: 메인 콘텐츠 영역 ===== */}
        {isFullTransform && (
          <div className="main-content-area">
            {/* 1차 교육 화면 (viewIndex === -1) */}
            {viewIndex === -1 && showEducation && getFullTransformEducation() && (
              <div className="education-container oneclick">
                <div className="education-card">
                  <h3>{getFullTransformEducation().title}</h3>
                  <p>{getFullTransformEducation().content}</p>
                </div>
                {completedCount > 0 && (
                  <p className="swipe-hint">👉 스와이프하거나 점을 눌러 완료된 결과 보기</p>
                )}
              </div>
            )}

            {/* 결과 미리보기 화면 (viewIndex >= 0) */}
            {viewIndex >= 0 && previewResult && (
              <div className="preview-container">
                <div className="preview-card">
                  <div className="preview-badge">{previewResult.style.name}</div>
                  <div className="preview-image-container">
                    <img 
                      src={previewResult.resultUrl} 
                      alt={previewResult.style.name}
                      className="preview-image"
                    />
                  </div>
                  {previewResult.aiSelectedArtist && (
                    <div className="preview-ai-info">
                      🤖 AI 선택: {previewResult.aiSelectedArtist}
                    </div>
                  )}
                  {previewEducation && (
                    <div className="preview-education">
                      <h4>{previewEducation.name || previewResult.style.name}</h4>
                      <p>{previewEducation.content}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 단일 변환: 기존 교육 컨텐츠 */}
        {!isFullTransform && showEducation && getEducationContent() && (
          <div className="education-container">
            <div className="education-card">
              <h3>{getEducationContent().title}</h3>
              <p>{getEducationContent().desc}</p>
            </div>
          </div>
        )}

        {/* AI selection info (단일 변환만) */}
        {!isFullTransform && stage >= 3 && aiArtistInfo && (
          <div className="ai-selection-info">
            <p className="ai-info">
              🤖 AI 선택: {aiArtistInfo.artist}
              {aiArtistInfo.method && ` (${aiArtistInfo.method})`}
            </p>
          </div>
        )}

        {/* ===== 원클릭: 하단 점(●) 네비게이션 ===== */}
        {isFullTransform && totalCount > 0 && (
          <div className="dots-nav-bottom">
            <div className="dots-container">
              {/* 1차 교육 점 */}
              <button
                className={`dot edu-dot ${viewIndex === -1 ? 'active' : ''}`}
                onClick={handleBackToEducation}
                title="교육자료"
              >
                📚
              </button>
              
              {/* 결과 점들 */}
              {Array.from({ length: totalCount }).map((_, idx) => (
                <button 
                  key={idx}
                  className={`dot ${idx < completedCount ? 'completed' : ''} ${idx === completedCount ? 'current' : ''} ${viewIndex === idx ? 'active' : ''}`}
                  onClick={() => handleDotClick(idx)}
                  disabled={idx >= completedCount}
                  title={fullTransformStyles[selectedStyle.category]?.[idx]?.name || ''}
                />
              ))}
            </div>
            <p className="dots-label">{completedCount} / {totalCount} 완료</p>
          </div>
        )}
      </div>

      <style>{`
        .processing-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .processing-content {
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .processing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .processing-header h2 {
          text-align: center;
          color: #333;
          font-size: 22px;
          margin: 0;
        }

        .back-to-edu-btn {
          background: #f0f0f0;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          color: #666;
        }

        .back-to-edu-btn:hover {
          background: #e0e0e0;
        }

        /* ===== 기존 단계 UI ===== */
        .progress-stages {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          position: relative;
        }

        .progress-stages::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background: #e0e0e0;
          z-index: 0;
        }

        .stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .stage-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f5f5f5;
          border: 2px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #999;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .stage.active .stage-number {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .stage.complete .stage-number {
          background: #4CAF50;
          border-color: #4CAF50;
          color: white;
          font-size: 0;
        }

        .stage.complete .stage-number::after {
          content: '✓';
          font-size: 16px;
        }

        .stage-label {
          font-size: 12px;
          color: #666;
          white-space: nowrap;
        }

        .status-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .status-text {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        /* ===== 메인 콘텐츠 영역 ===== */
        .main-content-area {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 15px;
        }

        /* 교육 컨텐츠 카드 */
        .education-container {
          animation: slideUp 0.3s ease;
        }

        .education-container.oneclick {
          max-height: 350px;
          overflow-y: auto;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .education-card {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
          padding: 1.25rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .education-card h3 {
          color: #667eea;
          font-size: 1rem;
          margin: 0 0 0.75rem 0;
          font-weight: 600;
        }

        .education-card p {
          color: #333;
          line-height: 1.7;
          font-size: 0.9rem;
          margin: 0;
          white-space: pre-line;
        }

        .swipe-hint {
          text-align: center;
          color: #667eea;
          font-size: 13px;
          margin-top: 12px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ===== 결과 미리보기 ===== */
        .preview-container {
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .preview-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #eee;
        }

        .preview-badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 12px;
        }

        .preview-image-container {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
          max-height: 200px;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-ai-info {
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
        }

        .preview-education {
          background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
          padding: 12px;
          border-radius: 10px;
          border-left: 3px solid #667eea;
          max-height: 120px;
          overflow-y: auto;
        }

        .preview-education h4 {
          color: #667eea;
          font-size: 13px;
          margin: 0 0 8px 0;
        }

        .preview-education p {
          color: #444;
          font-size: 12px;
          line-height: 1.6;
          margin: 0;
          white-space: pre-line;
        }

        /* ===== 하단 점 네비게이션 ===== */
        .dots-nav-bottom {
          border-top: 1px solid #eee;
          padding-top: 15px;
          text-align: center;
        }

        .dots-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e0e0e0;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dot.edu-dot {
          width: 28px;
          height: 28px;
          background: #f0f4ff;
          font-size: 14px;
        }

        .dot.edu-dot.active {
          background: #667eea;
          border-color: #667eea;
        }

        .dot.completed {
          background: #4CAF50;
          cursor: pointer;
        }

        .dot.completed:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
        }

        .dot.current {
          background: #667eea;
          animation: dotPulse 1s infinite;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .dot.active {
          border-color: #333;
          transform: scale(1.3);
        }

        .dot:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .dots-label {
          color: #888;
          font-size: 12px;
          margin: 0;
        }

        /* AI 선택 정보 */
        .ai-selection-info {
          margin-top: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 10px;
          text-align: center;
        }

        .ai-info {
          color: #666;
          font-size: 13px;
          margin: 0;
        }

        @media (max-width: 640px) {
          .processing-content {
            padding: 20px 15px;
          }

          .stage-label {
            font-size: 10px;
          }

          .education-card {
            padding: 15px;
          }

          .education-card h3 {
            font-size: 15px;
          }

          .education-card p {
            font-size: 13px;
          }

          .dot {
            width: 14px;
            height: 14px;
          }

          .dot.edu-dot {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }

          .preview-image-container {
            max-height: 160px;
          }

          .education-container.oneclick {
            max-height: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
