
import React, { useState } from 'react';
import Button from './common/Button';
import Card from './common/Card';
import { ArrowLeftIcon, ArrowRightIcon } from './icons/Icons';
import Loader from './common/Loader';

interface SourceUploaderProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  setTopics: (topics: string[]) => void;
  onBack: () => void;
  onComplete: () => void;
}

const SourceUploader: React.FC<SourceUploaderProps> = ({ sourceText, setSourceText, setTopics, onBack, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = () => {
    if (!sourceText.trim()) return;
    setIsProcessing(true);
    // Simulate processing for topic extraction
    setTimeout(() => {
      const words = sourceText.split(/\s+/);
      const wordFrequencies = words.reduce((acc, word) => {
        const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
        if (cleanWord.length > 4) { // Filter out small words
          acc[cleanWord] = (acc[cleanWord] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const sortedTopics = Object.entries(wordFrequencies)
// FIX: Changed the sort implementation to be more explicit for TypeScript's type inference, ensuring the arithmetic operation is performed on numbers.
        .sort((a,b) => b[1]-a[1])
        .slice(0, 5)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
        
      setTopics(sortedTopics);
      setIsProcessing(false);
      onComplete();
    }, 1500);
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-text-primary">Step 2: Provide Source Material</h2>
      <p className="text-text-secondary">Paste your content below. This can be an article, research paper, or any text you want to transform into a dialogue.</p>
      
      <Card>
        <div className="space-y-4">
          <label htmlFor="source-text" className="block text-sm font-medium text-text-secondary">
            Reference Document
          </label>
          <textarea
            id="source-text"
            rows={15}
            className="block w-full rounded-md border-0 bg-base-100 py-2 px-3 text-text-primary shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-secondary sm:text-sm sm:leading-6"
            placeholder="Paste your content here..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <p className="text-xs text-text-secondary">Supported Formats: PDF, Word docs, text files, web articles (paste content directly).</p>
        </div>
      </Card>
      
      {isProcessing && <Loader text="Analyzing content and identifying key topics..." />}

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="secondary" leftIcon={<ArrowLeftIcon />}>
          Back to Personas
        </Button>
        <Button onClick={handleProcess} disabled={!sourceText.trim() || isProcessing} rightIcon={<ArrowRightIcon />}>
          Analyze & Continue
        </Button>
      </div>
    </div>
  );
};

export default SourceUploader;
