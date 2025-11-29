// PicoArt v22 - ProcessingScreen (이중 교육 시스템)
// 변환 중: 사조/거장/동양화 설명
import React, { useEffect, useState } from 'react';
import { processStyleTransfer } from '../utils/styleTransferAPI';
import { educationContent } from '../data/educationContent';

const ProcessingScreen = ({ photo, selectedStyle, onComplete }) => {
  const [stage, setStage] = useState(1);
  const [statusText, setStatusText] = useState('준비 중...');
  const [showEducation, setShowEducation] = useState(false);
  const [aiArtistInfo, setAiArtistInfo] = useState(null);

  useEffect(() => {
    processImage();
  }, []);

  const processImage = async () => {
    try {
      // Stage 1: 사진 업로드 확인
      setStage(1);
      setStatusText('사진 준비 중...');
      await sleep(800);

      // Stage 2: 교육 컨텐츠 표시 시작
      setStage(2);
      const eduContent = getEducationContent();
      if (eduContent) {
        setStatusText(`${eduContent.title} 스타일 분석 중...`);
        setShowEducation(true);
        await sleep(1000);
      }

      // Stage 3: AI 변환 (교육 컨텐츠 계속 표시)
      setStage(3);
      setStatusText('AI가 사진을 분석하고 있습니다...');
      // 교육 컨텐츠는 계속 표시됨 (setShowEducation(false) 제거)
      await sleep(500);
      
      setStatusText('AI가 최적의 화가를 선택하고 있습니다...');
      await sleep(500);

      // Process with progress callback (API key handled server-side)
      const result = await processStyleTransfer(
        photo,
        selectedStyle,
        null, // API key is now handled server-side
        (progressText) => setStatusText(progressText)
      );

      if (!result.success) {
        throw new Error(result.error || 'Style transfer failed');
      }

      // AI 선택 정보 저장
      if (result.aiSelectedArtist) {
        setAiArtistInfo({
          artist: result.aiSelectedArtist,
          method: result.selectionMethod,
          details: result.selectionDetails
        });
        setStatusText(`${result.aiSelectedArtist} 화풍으로 변환 완료!`);
        await sleep(1000);
      }

      // Stage 4: Complete
      setStage(4);
      setShowEducation(false); // 완료 시점에 교육 종료
      setStatusText('완성되었습니다!');
      await sleep(500);

      // AI 선택 정보와 함께 완료
      onComplete(selectedStyle, result.resultUrl, result);

    } catch (error) {
      console.error('Processing error:', error);
      
      // 모바일 친화적인 에러 메시지
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
      
      // 개발 환경에서만 상세 로그
      if (window.location.hostname === 'localhost') {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          type: error.name
        });
      }
    }
  };

  // 변환 중 교육 컨텐츠 가져오기
  const getEducationContent = () => {
    const category = selectedStyle.category;
    
    // 1. 사조 탭 → 사조 설명
    if (category !== 'masters' && category !== 'oriental') {
      return educationContent.movements[category];
    }
    
    // 2. 거장 탭 → 거장 소개 (educationContent에서 가져오기)
    if (category === 'masters') {
      const masterId = selectedStyle.id; // '-master' 그대로 사용!
      const masterInfo = educationContent.masters[masterId];
      
      if (masterInfo) {
        return {
          title: masterInfo.title,
          desc: masterInfo.desc
        };
      }
      
      // Fallback
      return {
        title: selectedStyle.name || '거장',
        desc: '선택하신 거장의 화풍으로 변환합니다.'
      };
    }
    
    // 3. 동양화 탭 → 동양화 전통 설명 (educationContent.oriental에서 가져오기)
    if (category === 'oriental') {
      const styleId = selectedStyle.id; // 'korean', 'chinese', 'japanese'
      const orientalInfo = educationContent.oriental[styleId];
      
      if (orientalInfo) {
        return {
          title: orientalInfo.title,
          desc: orientalInfo.desc
        };
      }
      
      // Fallback (혹시 못 찾을 경우)
      return {
        title: selectedStyle.name || '동양화',
        desc: '선택하신 동양화 스타일로 변환합니다.'
      };
    }

    return null;
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="processing-screen">
      <div className="processing-content">
        <h2>🎨 변환 중</h2>

        {/* Progress stages */}
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

        {/* Status text */}
        <div className="status-container">
          <div className="spinner"></div>
          <p className="status-text">{statusText}</p>
        </div>

        {/* Educational content */}
        {showEducation && getEducationContent() && (
          <div className="education-container">
            <div className="education-card">
              <h3>{getEducationContent().title}</h3>
              <p>{getEducationContent().desc}</p>
            </div>
          </div>
        )}

        {/* AI selection info (show at stage 3) */}
        {stage >= 3 && aiArtistInfo && (
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 25px;
          border-radius: 15px;
          color: white;
        }

        .education-card h3 {
          margin: 0 0 15px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .education-card p {
          margin: 0;
          line-height: 1.6;
          font-size: 14px;
          opacity: 0.95;
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
        }
      `}</style>
    </div>
  );
};

export default ProcessingScreen;
