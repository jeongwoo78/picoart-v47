// PicoArt v68 - ProcessingScreen (원클릭 순차 처리 지원)
// 단일 변환 + 전체 변환 (원클릭) 모두 지원
import React, { useEffect, useState } from 'react';
import { processStyleTransfer } from '../utils/styleTransferAPI';
import { educationContent } from '../data/educationContent';
import { oneclickPrimaryEducation } from '../data/oneclickEducation';

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
      const category = selectedStyle.category; // 'movements', 'masters', 'oriental'
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
              success: true
            });
            setCompletedCount(i + 1);
            setCompletedResults([...results]);
          } else {
            // 실패해도 계속 진행
            results.push({
              style: style,
              error: result.error,
              success: false
            });
            setCompletedCount(i + 1);
          }
        } catch (err) {
          // 개별 실패 시에도 계속 진행
          console.error(`Failed to process ${style.name}:`, err);
          results.push({
            style: style,
            error: err.message,
            success: false
          });
          setCompletedCount(i + 1);
        }

        // 다음 변환 전 짧은 딜레이
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

      // 결과 전달 (배열 형태)
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

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ========== 렌더링 ==========
  return (
    <div className="processing-screen">
      <div className="processing-content">
        <h2>{isFullTransform ? '✨ 전체 변환 중' : '🎨 변환 중'}</h2>

        {/* 원클릭: 점(●) 진행 UI */}
        {isFullTransform && totalCount > 0 && (
          <div className="dots-progress">
            <div className="dots-container">
              {Array.from({ length: totalCount }).map((_, idx) => (
                <span 
                  key={idx} 
                  className={`dot ${idx < completedCount ? 'completed' : ''} ${idx === completedCount ? 'current' : ''}`}
                />
              ))}
            </div>
            <p className="dots-label">{completedCount} / {totalCount} 완료</p>
          </div>
        )}

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

        {/* 원클릭: 1차 통합 교육 컨텐츠 */}
        {isFullTransform && showEducation && getFullTransformEducation() && (
          <div className="education-container oneclick">
            <div className="education-card">
              <h3>{getFullTransformEducation().title}</h3>
              <p>{getFullTransformEducation().content}</p>
            </div>
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
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
        }

        .processing-content h2 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 24px;
        }

        /* ===== 원클릭 점(●) 진행 UI ===== */
        .dots-progress {
          text-align: center;
          margin-bottom: 30px;
        }

        .dots-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #e0e0e0;
          transition: all 0.3s ease;
        }

        .dot.completed {
          background: #4CAF50;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
        }

        .dot.current {
          background: #667eea;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .dots-label {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        /* ===== 기존 단계 UI ===== */
        .progress-stages {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
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
        }

        .stage.complete .stage-number::after {
          content: '✓';
          position: absolute;
        }

        .stage.complete .stage-number {
          font-size: 0;
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
          margin: 40px 0;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .status-text {
          color: #666;
          font-size: 16px;
        }

        /* 교육 컨텐츠 카드 */
        .education-container {
          margin-top: 30px;
          animation: slideUp 0.5s ease;
        }

        .education-container.oneclick {
          max-height: 400px;
          overflow-y: auto;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .education-card {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
          padding: 1.5rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .education-card h3 {
          color: #667eea;
          font-size: 1.1rem;
          margin: 0 0 1rem 0;
          font-weight: 600;
        }

        .education-card p {
          color: #333;
          line-height: 1.8;
          font-size: 1rem;
          margin: 0 0 1.26em 0;
          white-space: pre-line;
        }
        
        .education-card p:last-child {
          margin-bottom: 0;
        }

        /* AI 선택 정보 */
        .ai-selection-info {
          margin-top: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          text-align: center;
        }

        .ai-info {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 640px) {
          .processing-content {
            padding: 30px 20px;
          }

          .stage-label {
            font-size: 11px;
          }

          .education-card {
            padding: 20px;
          }

          .education-card h3 {
            font-size: 18px;
          }

          .education-card p {
            font-size: 13px;
          }

          .dot {
            width: 12px;
            height: 12px;
          }

          .education-container.oneclick {
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
