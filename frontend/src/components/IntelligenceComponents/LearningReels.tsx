import React, { useState } from 'react';
import { Sparkles, Bookmark, ThumbsUp } from 'lucide-react';

// Mock data for MVP
const mockCards = [
  {
    type: 'book-chapter',
    title: 'Atomic Habits - Chapter 1',
    content: 'Small habits make a big difference. The aggregation of marginal gains leads to remarkable results over time.',
    image: 'https://covers.openlibrary.org/b/id/9259256-L.jpg',
  },
  {
    type: 'news',
    title: 'Why Sleep Matters',
    content: 'A new study shows that getting 7-8 hours of sleep is crucial for mental and physical health.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    type: 'key-point',
    title: 'Key Idea: Growth Mindset',
    content: 'Believing you can improve is the first step to achieving more. Embrace challenges and learn from feedback.',
    image: '',
  },
  {
    type: 'fun-fact',
    title: 'Did You Know?',
    content: 'Reading for just 6 minutes can reduce stress by 68%.',
    image: '',
  },
  {
    type: 'quiz',
    title: 'Quick Quiz',
    content: 'True or False: Habits are formed by repeating a behavior in a consistent context.',
    image: '',
    quiz: {
      options: ['True', 'False'],
      answer: 0,
    },
  },
];

const getCardBg = (type: string) => {
  switch (type) {
    case 'book-chapter': return 'from-orange-200 to-pink-200';
    case 'news': return 'from-blue-200 to-indigo-200';
    case 'key-point': return 'from-green-200 to-lime-200';
    case 'fun-fact': return 'from-yellow-100 to-orange-100';
    case 'quiz': return 'from-purple-200 to-pink-100';
    default: return 'from-gray-100 to-gray-200';
  }
};

const LearningReels = () => {
  const [current, setCurrent] = useState(0);
  const [xp, setXp] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [quizAnswered, setQuizAnswered] = useState<{ [idx: number]: number | null }>({});

  const card = mockCards[current];

  const handleLike = () => {
    if (!liked.includes(current)) {
      setLiked([...liked, current]);
      setXp(xp + 1);
    }
  };
  const handleSave = () => {
    if (!saved.includes(current)) {
      setSaved([...saved, current]);
      setXp(xp + 2);
    }
  };
  const handleQuiz = (optionIdx: number) => {
    if (quizAnswered[current] == null) {
      setQuizAnswered({ ...quizAnswered, [current]: optionIdx });
      setXp(xp + (optionIdx === card.quiz.answer ? 3 : 0));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className={`rounded-2xl shadow-lg p-6 mb-4 bg-gradient-to-br ${getCardBg(card.type)} flex flex-col items-center transition-all duration-300`}>
        {card.image && (
          <img src={card.image} alt={card.title} className="w-32 h-40 object-cover rounded-lg mb-3 shadow" />
        )}
        <div className="text-xl font-bold mb-2 text-center">{card.title}</div>
        <div className="text-gray-700 text-center mb-3">{card.content}</div>
        {card.type === 'quiz' && card.quiz && (
          <div className="flex gap-2 mb-2">
            {card.quiz.options.map((opt: string, idx: number) => (
              <button
                key={opt}
                className={`px-3 py-1 rounded-full border ${quizAnswered[current] === idx ? (idx === card.quiz.answer ? 'bg-green-400 text-white' : 'bg-red-400 text-white') : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-100'}`}
                onClick={() => handleQuiz(idx)}
                disabled={quizAnswered[current] != null}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-4 mt-2">
          <button onClick={handleLike} className={`flex items-center gap-1 px-3 py-1 rounded-full ${liked.includes(current) ? 'bg-pink-500 text-white' : 'bg-white text-pink-500 border border-pink-300 hover:bg-pink-100'}`}> <ThumbsUp size={18} /> Like </button>
          <button onClick={handleSave} className={`flex items-center gap-1 px-3 py-1 rounded-full ${saved.includes(current) ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-300 hover:bg-blue-100'}`}> <Bookmark size={18} /> Save </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => setCurrent((c) => (c > 0 ? c - 1 : mockCards.length - 1))} className="text-gray-500 hover:text-indigo-600 font-bold">Prev</button>
        <div className="flex items-center gap-2"><Sparkles className="text-yellow-500" /> XP: <span className="font-bold">{xp}</span></div>
        <button onClick={() => setCurrent((c) => (c < mockCards.length - 1 ? c + 1 : 0))} className="text-gray-500 hover:text-indigo-600 font-bold">Next</button>
      </div>
      <div className="text-center text-xs text-gray-400">Card {current + 1} of {mockCards.length}</div>
    </div>
  );
};

export default LearningReels; 