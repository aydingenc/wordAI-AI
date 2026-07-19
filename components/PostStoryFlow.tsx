import React, { useState } from 'react';
import { QuizScreen, type QuizTargetWord } from '@/components/QuizScreen';
import { SessionSummaryScreen } from '@/components/SessionSummaryScreen';
import { PracticeMethodsScreen, type PracticeMethodId } from '@/components/PracticeMethodsScreen';
import { FlashcardsPractice } from '@/components/FlashcardsPractice';
import { WordMatchPractice } from '@/components/WordMatchPractice';
import { FillBlankPractice } from '@/components/FillBlankPractice';
import { MemoryGamePractice } from '@/components/MemoryGamePractice';
import { SpeedRoundPractice } from '@/components/SpeedRoundPractice';
import { useProgress } from '@/context/ProgressContext';

const MOCK_STREAK_DAYS = 3;

export interface PostStoryFlowProps {
  storyTitle: string;
  targetWords: QuizTargetWord[];
  onExit: () => void;
  onBackToStory: () => void;
  onDifferentTheme: () => void;
  onNewStorySameWords: (words: string[]) => void;
}

type Stage = 'quiz' | 'summary' | 'methods' | `game:${PracticeMethodId}`;

export function PostStoryFlow({ storyTitle, targetWords, onExit, onBackToStory, onDifferentTheme, onNewStorySameWords }: PostStoryFlowProps) {
  const { recentWords } = useProgress();
  const [stage, setStage] = useState<Stage>('quiz');
  const [summaryData, setSummaryData] = useState<{ xpEarned: number; quizScore: { correct: number; total: number }; learnedWords: string[] } | null>(null);

  const allWords = targetWords.map((tw) => tw.word);
  const startNewStorySameWords = () => onNewStorySameWords(allWords);

  if (stage === 'quiz') {
    return (
      <QuizScreen
        targetWords={targetWords}
        storyTitle={storyTitle}
        onBack={onBackToStory}
        onClose={onExit}
        onDifferentTheme={onDifferentTheme}
        onPracticeWords={() => setStage('methods')}
        onNewStorySameWords={startNewStorySameWords}
        onFinish={(result) => {
          setSummaryData({
            xpEarned: result.xpEarned,
            quizScore: { correct: result.correctCount, total: result.totalQuestions },
            learnedWords: result.learnedWords,
          });
          setStage('summary');
        }}
      />
    );
  }

  if (stage === 'summary' && summaryData) {
    return (
      <SessionSummaryScreen
        storyTitle={storyTitle}
        xpEarned={summaryData.xpEarned}
        newWordsCount={summaryData.learnedWords.length}
        totalWordsLifetime={recentWords.length}
        quizScore={summaryData.quizScore}
        streakDays={MOCK_STREAK_DAYS}
        learnedWords={summaryData.learnedWords}
        onClose={onExit}
        onDifferentTheme={onDifferentTheme}
        onPracticeWords={() => setStage('methods')}
        onNewStorySameWords={startNewStorySameWords}
      />
    );
  }

  if (stage === 'methods') {
    return (
      <PracticeMethodsScreen
        learnedWords={allWords}
        storyTitle={storyTitle}
        onClose={onExit}
        onSelectMethod={(methodId) => setStage(`game:${methodId}`)}
      />
    );
  }

  const backToMethods = () => setStage('methods');

  if (stage === 'game:flashcards') {
    return <FlashcardsPractice words={allWords} onBack={backToMethods} onClose={onExit} onComplete={backToMethods} />;
  }
  if (stage === 'game:match') {
    return <WordMatchPractice words={allWords} onBack={backToMethods} onClose={onExit} onComplete={backToMethods} />;
  }
  if (stage === 'game:fillblank') {
    return <FillBlankPractice words={allWords} onBack={backToMethods} onClose={onExit} onComplete={backToMethods} />;
  }
  if (stage === 'game:memory') {
    return <MemoryGamePractice words={allWords} onBack={backToMethods} onClose={onExit} onComplete={backToMethods} />;
  }
  if (stage === 'game:speed') {
    return <SpeedRoundPractice words={allWords} onClose={onExit} onComplete={backToMethods} />;
  }

  return null;
}
