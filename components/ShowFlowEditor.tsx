import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { generateIntroSuggestion } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Loader from './common/Loader';
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon } from './icons/Icons';

interface ShowFlowEditorProps {
    personas: Persona[];
    showIntro: string;
    setShowIntro: (intro: string) => void;
    onBack: () => void;
    onComplete: () => void;
}

const ShowFlowEditor: React.FC<ShowFlowEditorProps> = ({ personas, showIntro, setShowIntro, onBack, onComplete }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSuggestion = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const suggestion = await generateIntroSuggestion(personas);
            setShowIntro(suggestion);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (!showIntro) {
            handleGenerateSuggestion();
        }
    }, []); // Empty dependency array means this runs once on mount

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary">Step 2: Define Show Intro & Flow</h2>
            <p className="text-text-secondary">
                We've generated a suggested intro for your show based on your personas and their source materials.
                Feel free to edit it below to perfectly set the stage for the conversation.
            </p>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-text-primary">Show Introduction</h3>
                    <Button
                        variant="secondary"
                        onClick={handleGenerateSuggestion}
                        disabled={isGenerating}
                        leftIcon={<SparklesIcon />}
                    >
                        {isGenerating ? 'Generating...' : 'Regenerate Suggestion'}
                    </Button>
                </div>
                {isGenerating && <Loader text="Generating AI-powered intro suggestion..." />}
                {error && <Card className="border border-red-600 my-4"><p className="text-red-300">{error}</p></Card>}
                
                {!isGenerating && (
                    <textarea
                        rows={15}
                        className="block w-full rounded-md border-0 bg-bg-secondary py-2 px-3 text-text-primary shadow-sm ring-1 ring-inset ring-divider placeholder:text-text-secondary focus:ring-2 focus:ring-inset focus:ring-accent-primary sm:text-sm sm:leading-6"
                        placeholder="Enter your show introduction here..."
                        value={showIntro}
                        onChange={(e) => setShowIntro(e.target.value)}
                    />
                )}
            </Card>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="secondary" leftIcon={<ArrowLeftIcon />}>
                    Back to Personas
                </Button>
                <Button onClick={onComplete} disabled={!showIntro.trim()} rightIcon={<ArrowRightIcon />}>
                    Next: Generate Dialogue
                </Button>
            </div>
        </div>
    );
};

export default ShowFlowEditor;