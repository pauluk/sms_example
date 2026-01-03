"use client";
import React, { useState, useEffect } from "react";
import { Copy, ArrowRight, MessageSquare, Sparkles, ExternalLink, Loader2, Bot, Ban } from "lucide-react";

export default function SmsCompressorPage() {
    const [inputText, setInputText] = useState("");
    const [generatedPrompt, setGeneratedPrompt] = useState("");
    const [targetLength, setTargetLength] = useState<160 | 370>(160);
    const [provider, setProvider] = useState<"risen" | "gemini">("risen");
    const [loading, setLoading] = useState(false);

    const [config, setConfig] = useState<{ enableManual: boolean; enableGemini: boolean }>({ enableManual: true, enableGemini: true });

    useEffect(() => {
        // Fetch system config to see which provider is active by default and what is enabled
        fetch("/api/admin/config")
            .then(res => res.json())
            .then(data => {
                const enableManual = data.enableManualCompressor !== false;
                const enableGemini = data.enableGeminiCompressor !== false;
                setConfig({ enableManual, enableGemini });

                if (data.smsCompressorProvider) {
                    // Respect default, but fallback if disabled
                    if (data.smsCompressorProvider === 'risen' && !enableManual && enableGemini) {
                        setProvider('gemini');
                    } else if (data.smsCompressorProvider === 'gemini' && !enableGemini && enableManual) {
                        setProvider('risen');
                    } else {
                        setProvider(data.smsCompressorProvider);
                    }
                }
            })
            .catch(err => console.error("Failed to fetch config", err));
    }, []);

    const handleGenerate = async () => {
        if (!inputText.trim()) return;

        if (provider === "gemini") {
            setLoading(true);
            try {
                const res = await fetch("/api/ai/compress", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: inputText, maxChars: targetLength })
                });

                if (!res.ok) throw new Error("Generation failed");

                const data = await res.json();
                setGeneratedPrompt(data.text);
            } catch (err) {
                alert("Failed to generate with AI. Please try again.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        } else {
            generateRisenPrompt();
        }
    };

    const generateRisenPrompt = () => {
        if (!inputText.trim()) return;

        const prompt = `
**ROLE**: You are an expert SMS copywriter and communications specialist.

**INPUT**: 
"${inputText}"

**STEPS**:
1. Analyze the core message and call-to-action.
2. Draft a new version that conveys the exact same specific meaning but condensed.
3. Ensure the tone remains professional but accessible (Plain English).
4. Reframe for a broad audience (Grade 6 reading level).
5. Remove unnecessary government jargon.
6. Strictly adhere to the character limit.
7. Optimize for SMS (Clear hook, immediate value).
8. Use UK English spelling.
9. Use dd/mm/yyyy date format.
10. Use GBP (£) for currency.

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

                {!config.enableManual && !config.enableGemini ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                        <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                            <Ban className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Tool Disabled</h2>
                        <p className="text-gray-500 mt-2">The SMS Compressor tool has been disabled by the administrator.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">1. Enter Your Content</h2>
                                    {config.enableManual && config.enableGemini && (
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => setProvider("risen")}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${provider === "risen" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                                            >
                                                Manual (RISEN)
                                            </button>
                                            <button
                                                onClick={() => setProvider("gemini")}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${provider === "gemini" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                                                title="Automated AI Compression"
                                            >
                                                AI Auto-Compress
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                                        onClick={handleGenerate}
                                        disabled={!inputText.trim() || loading}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {provider === 'gemini' ? (
                                            <>
                                                <Bot className="w-4 h-4" />
                                                Compress with AI
                                            </>
                                        ) : (
                                            <>
                                                Generate Prompt
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Output Section */}
                        <div className="space-y-6 relative">
                            {/* Splash Screen Overlay */}
                            {loading && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl border border-gray-200">
                                    <div className="bg-blue-50 p-4 rounded-full inline-block mb-4 animate-pulse">
                                        <Sparkles className="w-8 h-8 text-blue-600 animate-spin-slow" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">AI is thinking...</h3>
                                    <p className="text-gray-500 mt-2">Condensing your message intelligently.</p>
                                </div>
                            )}

                            <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full transition-opacity duration-300 ${generatedPrompt ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {provider === 'gemini' ? '2. AI Output' : '2. Copy RISEN Prompt'}
                                    </h2>
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
                                            className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:text-green-600 transition-all group"
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
                )}
            </div>
        </main>
    );
}
