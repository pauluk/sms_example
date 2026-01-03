"use client";
import React, { useState } from "react";
import { Copy, ArrowRight, MessageSquare, Sparkles, ExternalLink } from "lucide-react";

export default function SmsCompressorPage() {
    const [inputText, setInputText] = useState("");
    const [generatedPrompt, setGeneratedPrompt] = useState("");
    const [targetLength, setTargetLength] = useState<160 | 370>(160);

    const generatePrompt = () => {
        if (!inputText.trim()) return;

        const prompt = `
**ROLE**: You are an expert SMS copywriter and communications specialist.

**INPUT**: 
"${inputText}"

**STEPS**:
1. Analyze the core message and call-to-action in the input text.
2. Draft a new version that conveys the exact same specific meaning but condensed.
3. Ensure the tone remains professional, authoritative, and trustworthy (suitable for UK Government communications).
4. Strictly adhere to the character limit.

**END GOAL**: A single, clear SMS message.

**NARROWING**: 
- Maximum characters: ${targetLength}.
- No jargon or abbreviations.
- Must include any specific dates or phone numbers mentioned in the input.
- Do NOT include "Here is your SMS" chat. Just output the message.
        `.trim();

        setGeneratedPrompt(prompt);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPrompt);
        alert("Prompt copied to clipboard!");
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                        SMS Compressor
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Use the **RISEN** framework to generate an engineered prompt. Paste this prompt into ChatGPT, Claude, or Gemini to get the best compression results.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900">1. Enter Your Content</h2>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste your long draft message here..."
                                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                            />

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setTargetLength(160)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${targetLength === 160 ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        1 SMS (160)
                                    </button>
                                    <button
                                        onClick={() => setTargetLength(370)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${targetLength === 370 ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        2 SMS (370)
                                    </button>
                                </div>

                                <button
                                    onClick={generatePrompt}
                                    disabled={!inputText.trim()}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Generate Prompt
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-6">
                        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full transition-opacity duration-300 ${generatedPrompt ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">2. Copy RISEN Prompt</h2>
                                {generatedPrompt && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-sm flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Text
                                    </button>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm text-gray-700 h-64 overflow-y-auto whitespace-pre-wrap">
                                {generatedPrompt || "Waiting for input..."}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">3. Open AI Tool</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <a
                                        href="https://chatgpt.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-centerjustify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:text-green-600 transition-all group"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium">ChatGPT</span>
                                        <ExternalLink className="w-3 h-3 opacity-50" />
                                    </a>
                                    <a
                                        href="https://claude.ai/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-all group"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium">Claude</span>
                                        <ExternalLink className="w-3 h-3 opacity-50" />
                                    </a>
                                    <a
                                        href="https://gemini.google.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all group"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium">Gemini</span>
                                        <ExternalLink className="w-3 h-3 opacity-50" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
