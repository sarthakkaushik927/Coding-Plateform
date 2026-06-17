import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import testService from '../utils/apiService';

interface Question {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

const CreateTest: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([
    { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  const handleQuestionChange = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const handleCorrectIndexChange = (qIndex: number, val: number) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = val;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await testService.createTest({
        title,
        description,
        durationInMinutes: duration,
        questions
      });
      navigate('/admin');
    } catch (err) {
      console.error('Failed to create test', err);
      alert('Error creating test: Unauthorized or Server Error');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-cream-900 pb-32">
      <nav className="bg-white border-b border-cream-200 mb-16">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="w-8 h-8 border border-cream-950 flex items-center justify-center text-cream-950 font-serif font-bold text-lg">
              N
            </Link>
            <span className="text-lg font-serif font-bold text-cream-950 tracking-wide">NextGen Design</span>
          </div>
          <button 
            onClick={() => navigate('/admin')}
            className="text-xs uppercase tracking-widest font-bold text-cream-500 hover:text-cream-950 transition-colors"
          >
            Cancel Session
          </button>
        </div>
      </nav>

      <header className="max-w-4xl mx-auto px-6 mb-16">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream-400 mb-2">Architectural Studio</div>
        <h1 className="text-5xl font-serif text-cream-950">Draft New Assessment</h1>
        <p className="text-cream-600 mt-2 font-light italic">Define the technical parameters and evaluative criteria for your next session.</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 space-y-12">
        {/* Test Basics */}
        <section className="bg-white p-12 rounded-sm border border-cream-200 shadow-sm space-y-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-cream-400 border-b border-cream-50 pb-4">Global Parameters</div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cream-500 mb-3">Assessment Title</label>
              <input 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="input-premium text-lg font-serif"
                placeholder="e.g. Senior Architecture Evaluation"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cream-500 mb-3">Philosophical Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="input-premium h-32 leading-relaxed"
                placeholder="Briefly state the objectives of this assessment..."
              />
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cream-500 mb-3">Duration (Minutes)</label>
              <input 
                type="number" 
                required 
                value={duration} 
                onChange={e => setDuration(Number(e.target.value))}
                className="input-premium font-mono text-lg"
              />
            </div>
          </div>
        </section>

        {/* Questions */}
        <div className="space-y-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-serif text-cream-950">Evaluative Items</h2>
            <span className="text-[10px] font-bold uppercase text-cream-400 tracking-widest">{questions.length} Items Defined</span>
          </div>
          
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-12 rounded-sm border border-cream-200 shadow-sm space-y-8 relative group">
              <div className="absolute top-6 right-8 text-cream-100 font-serif font-bold text-6xl select-none group-hover:text-cream-50 transition-colors">
                {String(qIndex + 1).padStart(2, '0')}
              </div>
              
              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cream-500 mb-3">Inquiry Text</label>
                <input 
                  required 
                  value={q.questionText} 
                  onChange={e => handleQuestionChange(qIndex, e.target.value)}
                  className="input-premium text-lg border-none bg-cream-50/50 focus:bg-white"
                  placeholder="Enter the question here..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className={`flex items-center gap-4 p-4 rounded-sm border transition-all ${
                    q.correctOptionIndex === oIndex ? 'bg-cream-50 border-cream-900' : 'bg-white border-cream-100'
                  }`}>
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`}
                      checked={q.correctOptionIndex === oIndex}
                      onChange={() => handleCorrectIndexChange(qIndex, oIndex)}
                      className="w-4 h-4 accent-cream-950 cursor-pointer"
                    />
                    <input 
                      required 
                      value={opt} 
                      onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Choice ${String.fromCharCode(65 + oIndex)}`}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-light"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            type="button"
            onClick={handleAddQuestion}
            className="flex-1 py-4 border border-dashed border-cream-300 rounded-sm text-[10px] uppercase tracking-widest font-bold text-cream-500 hover:text-cream-950 hover:border-cream-950 transition-all bg-white"
          >
            + Append New Inquiry
          </button>
          <button 
            type="submit"
            className="flex-1 py-4 bg-cream-900 text-cream-50 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-cream-950 shadow-lg shadow-cream-100 transition-all"
          >
            Finalize & Distribute
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTest;
