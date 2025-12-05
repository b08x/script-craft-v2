

import React, { useState } from 'react';
import Button from './common/Button';
import Card from './common/Card';
import { ArrowLeftIcon, ArrowRightIcon } from './icons/Icons';
import Loader from './common/Loader';
import { extractTopicsFromContext } from '../services/geminiService';

interface SourceUploaderProps {
  sourceText: string;
  setSourceText: (text: string) => void;
  setTopics: (topics: string[]) => void;
  onBack: () => void;
  onComplete: () => void;
}

const SourceUploader: React.FC<SourceUploaderProps> = ({ sourceText, setSourceText, setTopics, onBack, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (!sourceText.trim()) return;
    setIsProcessing(true);
    
    try {
        const topics = await extractTopicsFromContext(sourceText);
        setTopics(topics);
        onComplete();
    } catch (e) {
        console.error("Failed to extract topics", e);
        // Fallback or error state handling
        setTopics([]); 
        onComplete(); // Move next even if topics fail, or handle error better
    } finally {
        setIsProcessing(false);
    }
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
      
      {isProcessing && <Loader text="Analyzing content, detecting semantic topics, and identifying key themes..." />}

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