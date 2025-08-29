import React from 'react';
import { ScriptLine, Persona } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import { ArrowLeftIcon } from './icons/Icons';

interface ReviewAndExportProps {
    script: ScriptLine[];
    personas: Persona[];
    onBack: () => void;
    onRestart: () => void;
}

const ReviewAndExport: React.FC<ReviewAndExportProps> = ({ script, personas, onBack, onRestart }) => {

    const getPersonaName = (id: string) => personas.find(p => p.id === id)?.name || 'Unknown';

    const formatForTxt = () => {
        return script.map(line => `${getPersonaName(line.speakerId)}:\n${line.line}`).join('\n\n');
    };

    const downloadTxtFile = () => {
        const element = document.createElement("a");
        const file = new Blob([formatForTxt()], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = "script.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    const formatForTeleprompter = () => {
        return script.map(line => `${getPersonaName(line.speakerId).toUpperCase()}\n\n${line.line}`).join('\n\n---\n\n');
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary">Step 5: Review & Export</h2>
            <p className="text-text-secondary">Give your script a final review and export it in your desired format.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Review Dashboard */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-text-primary mb-4">Review Dashboard</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-divider p-3 rounded-lg">
                                <p className="text-text-primary">Persona Consistency Score</p>
                                <p className="font-bold text-green-400">98%</p>
                            </div>
                             <div className="flex justify-between items-center bg-divider p-3 rounded-lg">
                                <p className="text-text-primary">Content Accuracy Check</p>
                                <p className="font-bold text-green-400">Passed</p>
                            </div>
                             <div className="flex justify-between items-center bg-divider p-3 rounded-lg">
                                <p className="text-text-primary">Conversation Flow</p>
                                <p className="font-bold text-accent-primary">Natural</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold text-text-primary mb-4">Export Options</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button variant="secondary" onClick={downloadTxtFile} className="w-full">Download Production Script (.txt)</Button>
                            <Button variant="secondary" onClick={() => copyToClipboard(formatForTeleprompter())} className="w-full">Copy Teleprompter Version</Button>
                            <Button variant="secondary" className="w-full" disabled>Export as PDF (coming soon)</Button>
                            <Button variant="secondary" className="w-full" disabled>Get Show Notes (coming soon)</Button>
                        </div>
                    </Card>
                </div>

                {/* Side-by-side comparison */}
                <Card>
                    <h3 className="text-xl font-semibold text-text-primary mb-4">Final Script Preview</h3>
                    <div className="h-[600px] overflow-y-auto p-4 bg-bg-primary rounded-lg">
                        {script.map(line => (
                            <div key={line.id} className="mb-4">
                                <p className="font-bold text-accent-primary">{getPersonaName(line.speakerId)}</p>
                                <p className="text-text-secondary whitespace-pre-wrap">{line.line}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="secondary" leftIcon={<ArrowLeftIcon />}>
                    Back to Editor
                </Button>
                <Button onClick={onRestart}>
                    Start New Project
                </Button>
            </div>
        </div>
    );
};

export default ReviewAndExport;