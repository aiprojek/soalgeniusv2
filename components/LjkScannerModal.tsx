import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Exam, Settings } from '../types';
import { extractExamAnswerKey, scanLjkImage, gradeStudentAnswers, calculateClassAnalytics, generateGradesCsv, type AnswerKeyMap } from '../lib/ljkScanner';
import { type LjkScanResult } from '../lib/ljkGenerator';
import { saveLjkResults, getLjkResults, clearLjkResults } from '../lib/storage';
import { CloseIcon, PrinterIcon, DownloadIcon, ScanIcon, CheckIcon, TrashIcon, SearchIcon, SparklesIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';

interface LjkScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: Exam;
    settings: Settings;
}

export const LjkScannerModal: React.FC<LjkScannerModalProps> = ({
    isOpen,
    onClose,
    exam,
    settings
}) => {
    const { addToast } = useToast();
    const { showConfirm } = useModal();

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<'scan' | 'records' | 'analytics' | 'keys'>('scan');
    
    // Scanner input mode: 'camera' | 'upload'
    const [scanInputMode, setScanInputMode] = useState<'camera' | 'upload'>('upload');

    // Camera states
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Exam Answer Keys and Configuration
    const [answerKeys, setAnswerKeys] = useState<AnswerKeyMap>({});
    const [totalQuestions, setTotalQuestions] = useState<number>(30);
    const [optionCount, setOptionCount] = useState<4 | 5>(4);
    const [kkmScore, setKkmScore] = useState<number>(75);
    const [essayWeight, setEssayWeight] = useState<number>(0);

    // Stored Scan Results / Students
    const [scanResults, setScanResults] = useState<LjkScanResult[]>([]);
    const [currentReviewResult, setCurrentReviewResult] = useState<LjkScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Load initial answer keys & results from DB
    useEffect(() => {
        if (!isOpen || !exam) return;

        const keys = extractExamAnswerKey(exam);
        setAnswerKeys(keys);

        // Count multiple choice questions
        const detectedQCount = Object.keys(keys).length > 0 ? Math.max(...Object.keys(keys).map(Number)) : 30;
        setTotalQuestions(detectedQCount);

        const hasOptE = exam.sections?.some(s => s.questions.some(q => (q.choices?.length || 0) >= 5)) || false;
        setOptionCount(hasOptE ? 5 : 4);

        // Load saved grading results
        getLjkResults(exam.id).then(results => {
            setScanResults(results);
            if (results.length > 0 && !currentReviewResult) {
                setCurrentReviewResult(results[results.length - 1]);
            }
        });
    }, [isOpen, exam]);

    // Camera Stream Management
    useEffect(() => {
        if (isOpen && activeTab === 'scan' && scanInputMode === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, activeTab, scanInputMode, cameraFacing]);

    const startCamera = async () => {
        stopCamera();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: cameraFacing,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            setCameraStream(stream);
            setIsCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
        } catch (err) {
            console.warn('Camera access error:', err);
            setIsCameraActive(false);
            setScanInputMode('upload');
            addToast('Kamera tidak dapat diakses. Silakan gunakan mode unggah foto.', 'info');
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
    };

    // Capture Image from Video Frame
    const handleCaptureFromCamera = async () => {
        if (!videoRef.current) return;
        setIsProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 1280;
            canvas.height = videoRef.current.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');

            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            const result = await scanLjkImage(dataUrl, {
                totalQuestions,
                optionCount,
                answerKeys
            });

            // Set result to review
            setCurrentReviewResult(result);
            addToast(`LJK ${result.studentName} berhasil dipindai! Skor: ${result.totalScore}`, 'success');
        } catch (err) {
            console.error('Scan error:', err);
            addToast('Gagal memindai gambar LJK. Pastikan lembar terlihat jelas.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle File Upload (Single or Multiple Batch)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        addToast(`Memproses ${files.length} lembar LJK...`, 'info');

        try {
            const newResults: LjkScanResult[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const res = await scanLjkImage(file, {
                    totalQuestions,
                    optionCount,
                    answerKeys
                });
                res.studentName = `Peserta ${scanResults.length + newResults.length + 1}`;
                newResults.push(res);
            }

            const updatedList = [...scanResults, ...newResults];
            setScanResults(updatedList);
            await saveLjkResults(exam.id, updatedList);

            if (newResults.length > 0) {
                setCurrentReviewResult(newResults[newResults.length - 1]);
            }

            addToast(`Sukses memindai & menilai ${newResults.length} lembar LJK siswa!`, 'success');
        } catch (err) {
            console.error('Batch scan error:', err);
            addToast('Terjadi kesalahan saat memproses berkas LJK.', 'error');
        } finally {
            setIsProcessing(false);
            e.target.value = '';
        }
    };

    // Update Bubble Choice Manually in Review
    const handleBubbleToggle = (qNum: number, opt: string) => {
        if (!currentReviewResult) return;

        const currentAns = currentReviewResult.answers[qNum];
        const newAns = currentAns === opt ? '' : opt;
        const newAnswers = { ...currentReviewResult.answers, [qNum]: newAns };

        const regrade = gradeStudentAnswers(
            newAnswers,
            answerKeys,
            totalQuestions,
            currentReviewResult.manualEssayScore || 0,
            essayWeight
        );

        const updatedResult: LjkScanResult = {
            ...currentReviewResult,
            answers: newAnswers,
            correctCount: regrade.correctCount,
            incorrectCount: regrade.incorrectCount,
            blankCount: regrade.blankCount,
            totalScore: regrade.totalScore
        };

        setCurrentReviewResult(updatedResult);
    };

    // Save Current Reviewed Student
    const handleSaveCurrentResult = async () => {
        if (!currentReviewResult) return;

        const existingIdx = scanResults.findIndex(r => r.id === currentReviewResult.id);
        let updatedList: LjkScanResult[];

        if (existingIdx !== -1) {
            updatedList = [...scanResults];
            updatedList[existingIdx] = currentReviewResult;
        } else {
            updatedList = [...scanResults, currentReviewResult];
        }

        setScanResults(updatedList);
        await saveLjkResults(exam.id, updatedList);
        addToast(`Hasil ${currentReviewResult.studentName} berhasil disimpan.`, 'success');
    };

    // Delete Single Result
    const handleDeleteResult = (id: string) => {
        showConfirm({
            title: 'Hapus Hasil LJK Siswa',
            content: 'Apakah Anda yakin ingin menghapus data lembar jawaban siswa ini?',
            confirmLabel: 'Hapus',
            confirmVariant: 'danger',
            onConfirm: async () => {
                const filtered = scanResults.filter(r => r.id !== id);
                setScanResults(filtered);
                await saveLjkResults(exam.id, filtered);
                if (currentReviewResult?.id === id) {
                    setCurrentReviewResult(filtered[0] || null);
                }
                addToast('Hasil siswa dihapus.', 'info');
            }
        });
    };

    // Reset All Results
    const handleResetAllResults = () => {
        showConfirm({
            title: 'Kosongkan Semua Data Rekap',
            content: 'Semua rekaman hasil koreksi siswa untuk ujian ini akan dihapus permanen. Lanjutkan?',
            confirmLabel: 'Kosongkan Semua',
            confirmVariant: 'danger',
            onConfirm: async () => {
                await clearLjkResults(exam.id);
                setScanResults([]);
                setCurrentReviewResult(null);
                addToast('Semua data koreksi telah dikosongkan.', 'info');
            }
        });
    };

    // Export CSV Excel
    const handleExportCsv = () => {
        if (scanResults.length === 0) {
            addToast('Belum ada data nilai siswa untuk diekspor.', 'warning');
            return;
        }
        const csvContent = generateGradesCsv(
            exam.title,
            exam.subject,
            scanResults,
            totalQuestions,
            answerKeys
        );
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanTitle = (exam.title || 'Ujian').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `Rekap_Nilai_LJK_${cleanTitle}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Berkas Rekap Nilai CSV berhasil diunduh.', 'success');
    };

    // Print Class Summary
    const handlePrintSummary = () => {
        window.print();
    };

    // Analytics computation
    const analytics = useMemo(() => {
        return calculateClassAnalytics(scanResults, answerKeys, totalQuestions, kkmScore);
    }, [scanResults, answerKeys, totalQuestions, kkmScore]);

    // Filtered records
    const filteredRecords = useMemo(() => {
        if (!searchQuery.trim()) return scanResults;
        const q = searchQuery.toLowerCase();
        return scanResults.filter(
            r => r.studentName.toLowerCase().includes(q) || r.studentNis.toLowerCase().includes(q)
        );
    }, [scanResults, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-fade-in print:p-0">
            <div className="flex h-[94vh] w-full max-w-6xl flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl overflow-hidden print:border-0 print:shadow-none print:h-auto">
                {/* Modal Header */}
                <div className="flex flex-col gap-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3.5 py-2.5 sm:px-6 sm:py-3 print:hidden">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                <ScanIcon className="text-lg sm:text-xl" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)] truncate">
                                        Pemeriksa & Scanner LJK Cerdas
                                    </h2>
                                    <span className="rounded-md bg-blue-100 dark:bg-blue-950/50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">
                                        {scanResults.length} Dinilai
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate">
                                    {exam.title || 'Ujian'} • {exam.subject || 'Mapel'} ({totalQuestions} Soal PG)
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                            title="Tutup Modal"
                            aria-label="Tutup Modal"
                        >
                            <CloseIcon className="text-lg" />
                        </button>
                    </div>

                    {/* Nav Tabs (Scrollable on mobile without wrapping/cramping) */}
                    <div className="w-full overflow-x-auto scrollbar-none flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('scan')}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                activeTab === 'scan'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <i className="bi bi-camera-fill text-xs"></i>
                            <span>Pindai / Koreksi</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('records')}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                activeTab === 'records'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <i className="bi bi-table text-xs"></i>
                            <span>Rekap Nilai ({scanResults.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('analytics')}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                activeTab === 'analytics'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <i className="bi bi-graph-up-arrow text-xs"></i>
                            <span>Analisis Butir</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('keys')}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                activeTab === 'keys'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <i className="bi bi-key-fill text-xs"></i>
                            <span>Kunci Jawaban</span>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[var(--bg-primary)]">
                    {/* TAB 1: SCAN & KOREKSI */}
                    {activeTab === 'scan' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                            {/* Left Column: Input Source (Camera / Upload) */}
                            <div className="lg:col-span-5 flex flex-col gap-3">
                                {/* Mode Selector */}
                                <div className="flex items-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-1 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setScanInputMode('upload')}
                                        className={`flex-1 py-2 px-2 sm:px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                                            scanInputMode === 'upload'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                    >
                                        <i className="bi bi-cloud-arrow-up-fill text-sm flex-shrink-0"></i>
                                        <span className="truncate">Unggah Foto<span className="hidden sm:inline"> / Berkas Scan</span></span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScanInputMode('camera')}
                                        className={`flex-1 py-2 px-2 sm:px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                                            scanInputMode === 'camera'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                    >
                                        <i className="bi bi-camera-video-fill text-sm flex-shrink-0"></i>
                                        <span className="truncate">Kamera Langsung<span className="hidden sm:inline"> (HP/Webcam)</span></span>
                                    </button>
                                </div>

                                {/* Upload View */}
                                {scanInputMode === 'upload' && (
                                    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 p-6 text-center hover:bg-[var(--bg-secondary)] transition-all relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            disabled={isProcessing}
                                        />
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
                                            <i className="bi bi-images text-2xl"></i>
                                        </div>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">
                                            Pilih atau Tarik Berkas Foto LJK di Sini
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs">
                                            Mendukung satu atau banyak foto siswa sekaligus (JPG, PNG, WebP).
                                        </p>
                                        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold shadow-xs">
                                            <i className="bi bi-folder2-open"></i>
                                            <span>Jelajahi Berkas...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Live Camera View */}
                                {scanInputMode === 'camera' && (
                                    <div className="flex-1 flex flex-col rounded-2xl border border-[var(--border-primary)] bg-black overflow-hidden relative min-h-[300px]">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Viewfinder Target Overlay */}
                                        <div className="absolute inset-4 border-2 border-white/40 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-2">
                                            <div className="flex justify-between">
                                                <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                                                <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                                            </div>
                                            <div className="text-center bg-black/60 backdrop-blur-xs py-1 px-3 rounded-full text-white text-[11px] self-center">
                                                Arahkan kamera pas ke seluruh lembar LJK
                                            </div>
                                            <div className="flex justify-between">
                                                <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                                                <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>
                                            </div>
                                        </div>

                                        {/* Camera Controls */}
                                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => setCameraFacing(f => (f === 'environment' ? 'user' : 'environment'))}
                                                className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all"
                                                title="Ganti Kamera Depan/Belakang"
                                            >
                                                <i className="bi bi-arrow-repeat text-lg"></i>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleCaptureFromCamera}
                                                disabled={isProcessing}
                                                className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 shadow-lg active:scale-95 transition-all text-xs"
                                            >
                                                <i className="bi bi-camera-fill text-sm"></i>
                                                <span>Jepret & Koreksi</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Live Interactive Review Sheet */}
                            <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-xs">
                                {currentReviewResult ? (
                                    <div className="flex flex-col h-full">
                                        {/* Review Header & Score Ribbon */}
                                        <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        type="text"
                                                        value={currentReviewResult.studentName}
                                                        onChange={(e) => setCurrentReviewResult({ ...currentReviewResult, studentName: e.target.value })}
                                                        placeholder="Nama Siswa..."
                                                        className="font-bold text-sm text-[var(--text-primary)] bg-transparent border-b border-transparent hover:border-[var(--border-primary)] focus:border-blue-500 outline-none w-full px-1"
                                                    />
                                                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mt-0.5 px-1">
                                                        <span>NISN:</span>
                                                        <input
                                                            type="text"
                                                            value={currentReviewResult.studentNis}
                                                            onChange={(e) => setCurrentReviewResult({ ...currentReviewResult, studentNis: e.target.value })}
                                                            placeholder="NISN..."
                                                            className="bg-transparent border-b border-dashed border-[var(--border-primary)] focus:border-blue-500 outline-none w-24"
                                                        />
                                                        <span>•</span>
                                                        <span>Paket:</span>
                                                        <select
                                                            value={currentReviewResult.packetCode}
                                                            onChange={(e) => setCurrentReviewResult({ ...currentReviewResult, packetCode: e.target.value })}
                                                            className="bg-transparent font-bold border border-[var(--border-primary)] rounded px-1 text-[11px]"
                                                        >
                                                            <option value="A">Paket A</option>
                                                            <option value="B">Paket B</option>
                                                            <option value="C">Paket C</option>
                                                            <option value="D">Paket D</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score Badges */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                                                    <i className="bi bi-check-circle-fill"></i>
                                                    <span>{currentReviewResult.correctCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs">
                                                    <i className="bi bi-x-circle-fill"></i>
                                                    <span>{currentReviewResult.incorrectCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-sm shadow-xs">
                                                    <span>{currentReviewResult.totalScore}</span>
                                                    <span className="text-[10px] opacity-80">/100</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Interactive Answer Grid */}
                                        <div className="flex-1 p-3 overflow-y-auto max-h-[420px]">
                                            <div className="flex items-center justify-between mb-2 text-[11px] text-[var(--text-secondary)]">
                                                <span className="font-semibold text-[var(--text-primary)]">
                                                    Deteksi Butir Jawaban (Klik bulatan untuk verifikasi/koreksi):
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Benar
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="h-2 w-2 rounded-full bg-red-500"></span> Salah
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="h-2 w-2 rounded-full bg-slate-300"></span> Kosong
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Questions Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => {
                                                    const studentAns = (currentReviewResult.answers[qNum] || '').toUpperCase();
                                                    const keyAns = (answerKeys[qNum] || '').toUpperCase();
                                                    const isCorrect = studentAns && studentAns === keyAns;
                                                    const isWrong = studentAns && studentAns !== keyAns;
                                                    const isBlank = !studentAns;

                                                    const opts = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

                                                    return (
                                                        <div
                                                            key={qNum}
                                                            className={`p-1.5 rounded-xl border flex flex-col gap-1 transition-all ${
                                                                isCorrect
                                                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/50'
                                                                    : isWrong
                                                                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                                                                    : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="font-bold font-mono text-[var(--text-primary)]">
                                                                    {qNum < 10 ? '0' + qNum : qNum}.
                                                                </span>
                                                                <span className="text-[10px] font-mono font-semibold opacity-70">
                                                                    Kunci: {keyAns || '-'}
                                                                </span>
                                                            </div>

                                                            {/* Bubbles */}
                                                            <div className="flex items-center justify-between gap-1 pt-0.5">
                                                                {opts.map((opt) => {
                                                                    const isChosen = studentAns === opt;
                                                                    const isCorrectKey = keyAns === opt;

                                                                    let bubbleStyle = 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-secondary)]';
                                                                    if (isChosen) {
                                                                        if (isCorrect) {
                                                                            bubbleStyle = 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-2xs';
                                                                        } else {
                                                                            bubbleStyle = 'bg-red-600 text-white border-red-600 font-extrabold shadow-2xs';
                                                                        }
                                                                    } else if (isWrong && isCorrectKey) {
                                                                        bubbleStyle = 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30';
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            onClick={() => handleBubbleToggle(qNum, opt)}
                                                                            className={`h-6 w-6 rounded-full border text-[10px] flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${bubbleStyle}`}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Review Footer Action */}
                                        <div className="flex items-center justify-between border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteResult(currentReviewResult.id)}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-3 py-1.5 text-xs font-bold hover:bg-red-100 transition-all"
                                            >
                                                <TrashIcon className="text-xs" />
                                                <span>Hapus Lembar</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleSaveCurrentResult}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs transition-all"
                                            >
                                                <CheckIcon className="text-xs" />
                                                <span>Simpan Nilai Siswa</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)]">
                                        <i className="bi bi-file-earmark-check text-4xl text-slate-400 mb-2"></i>
                                        <p className="font-bold text-sm text-[var(--text-primary)]">
                                            Belum Ada Lembar yang Dipilih
                                        </p>
                                        <p className="text-xs max-w-sm mt-1">
                                            Pindai menggunakan kamera atau unggah foto LJK untuk melihat analisis bulatan dan penilaian instan.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: REKAP NILAI SISWA */}
                    {activeTab === 'records' && (
                        <div className="space-y-4">
                            {/* Analytics KPI Ribbon */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3.5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xs">
                                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Total Siswa</span>
                                    <p className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{analytics.studentCount} Orang</p>
                                </div>
                                <div className="p-3.5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xs">
                                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Rata-Rata Kelas</span>
                                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{analytics.averageScore}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xs">
                                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Tertinggi / Terendah</span>
                                    <p className="text-lg font-extrabold text-[var(--text-primary)] mt-1">
                                        <span className="text-emerald-600">{analytics.highestScore}</span> / <span className="text-red-500">{analytics.lowestScore}</span>
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">Tuntas KKM</span>
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <span>KKM:</span>
                                            <input
                                                type="number"
                                                value={kkmScore}
                                                onChange={(e) => setKkmScore(parseInt(e.target.value, 10) || 75)}
                                                className="w-10 rounded border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-1 font-bold text-center"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xl font-extrabold text-emerald-600 mt-1">
                                        {analytics.passPercentage}% <span className="text-xs text-[var(--text-secondary)] font-medium">({analytics.passedCount} Siswa)</span>
                                    </p>
                                </div>
                            </div>

                            {/* Action Bar & Search */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                                <div className="relative flex-1 min-w-[200px] max-w-md">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari nama siswa atau NISN..."
                                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleExportCsv}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold px-3 py-1.5 text-xs transition-all shadow-2xs"
                                    >
                                        <DownloadIcon className="text-xs text-emerald-600" />
                                        <span>Unduh Excel (CSV)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handlePrintSummary}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold px-3 py-1.5 text-xs transition-all shadow-2xs"
                                    >
                                        <PrinterIcon className="text-xs text-blue-600" />
                                        <span>Cetak Rekap</span>
                                    </button>

                                    {scanResults.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleResetAllResults}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 font-semibold px-3 py-1.5 text-xs transition-all"
                                        >
                                            <TrashIcon className="text-xs" />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Table of Students */}
                            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-bold">
                                                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                                                <th className="py-2.5 px-3">Nama Siswa</th>
                                                <th className="py-2.5 px-3">NISN / No</th>
                                                <th className="py-2.5 px-3 text-center">Paket</th>
                                                <th className="py-2.5 px-3 text-center">Benar</th>
                                                <th className="py-2.5 px-3 text-center">Salah</th>
                                                <th className="py-2.5 px-3 text-center">Kosong</th>
                                                <th className="py-2.5 px-3 text-right">Nilai Akhir</th>
                                                <th className="py-2.5 px-3 text-center">Status</th>
                                                <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)]">
                                            {filteredRecords.length > 0 ? (
                                                [...filteredRecords]
                                                    .sort((a, b) => b.totalScore - a.totalScore)
                                                    .map((student, idx) => {
                                                        const isPassed = student.totalScore >= kkmScore;
                                                        return (
                                                            <tr key={student.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                                <td className="py-2 px-3 text-center font-mono font-bold text-[var(--text-muted)]">
                                                                    #{idx + 1}
                                                                </td>
                                                                <td className="py-2 px-3 font-semibold text-[var(--text-primary)]">
                                                                    {student.studentName}
                                                                </td>
                                                                <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">
                                                                    {student.studentNis}
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-bold font-mono">
                                                                    <span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                                                                        {student.packetCode}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-bold text-emerald-600">
                                                                    {student.correctCount}
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-bold text-red-500">
                                                                    {student.incorrectCount}
                                                                </td>
                                                                <td className="py-2 px-3 text-center font-bold text-[var(--text-muted)]">
                                                                    {student.blankCount}
                                                                </td>
                                                                <td className="py-2 px-3 text-right font-extrabold text-sm text-[var(--text-primary)]">
                                                                    {student.totalScore}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                            isPassed
                                                                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                                                                : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                                                                        }`}
                                                                    >
                                                                        {isPassed ? 'TUNTAS' : 'REMIDI'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setCurrentReviewResult(student);
                                                                                setActiveTab('scan');
                                                                            }}
                                                                            className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                                            title="Koreksi / Review Lembar"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteResult(student.id)}
                                                                            className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                            title="Hapus"
                                                                        >
                                                                            <TrashIcon className="text-xs" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                            ) : (
                                                <tr>
                                                    <td colSpan={10} className="py-8 text-center text-[var(--text-secondary)]">
                                                        Belum ada rekaman nilai siswa. Pindai lembar jawaban pada tab "Pindai / Koreksi".
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ANALISIS BUTIR SOAL */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 shadow-2xs">
                                <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">
                                    Analisis Daya Serap & Tingkat Kesukaran Soal
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-4">
                                    Mendeteksi butir soal yang paling sering dijawab benar atau salah oleh siswa untuk evaluasi pembelajaran.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {analytics.questionAnalysis.map((item) => (
                                        <div
                                            key={item.qNumber}
                                            className="p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex flex-col gap-2"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold font-mono text-[var(--text-primary)]">
                                                    Soal No. {item.qNumber}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.difficulty === 'Mudah'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                            : item.difficulty === 'Sedang'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                                                    }`}
                                                >
                                                    {item.difficulty}
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div>
                                                <div className="flex justify-between text-[11px] mb-1">
                                                    <span className="text-[var(--text-secondary)]">Daya Serap:</span>
                                                    <span className="font-bold text-[var(--text-primary)]">
                                                        {item.percentage}% ({item.correctCount}/{analytics.studentCount})
                                                    </span>
                                                </div>
                                                <div className="w-full bg-[var(--border-primary)] h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            item.percentage >= 70
                                                                ? 'bg-emerald-500'
                                                                : item.percentage >= 40
                                                                ? 'bg-blue-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="text-[10px] text-[var(--text-muted)] flex justify-between pt-1 border-t border-[var(--border-primary)]">
                                                <span>Kunci Jawaban: <strong>{item.correctAnswer}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: KUNCI JAWABAN & BOBOT */}
                    {activeTab === 'keys' && (
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 shadow-2xs space-y-3">
                                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                                    Kunci Jawaban Master Ujian
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Kunci jawaban diambil otomatis dari naskah soal. Anda juga dapat mengubah atau melengkapi kunci di bawah ini:
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
                                    {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => {
                                        const currentKey = answerKeys[qNum] || '';
                                        const opts = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

                                        return (
                                            <div
                                                key={qNum}
                                                className="p-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-between"
                                            >
                                                <span className="font-bold font-mono text-xs">
                                                    {qNum < 10 ? '0' + qNum : qNum}.
                                                </span>
                                                <select
                                                    value={currentKey}
                                                    onChange={(e) => setAnswerKeys({ ...answerKeys, [qNum]: e.target.value })}
                                                    className="rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400"
                                                >
                                                    <option value="">-</option>
                                                    {opts.map(o => (
                                                        <option key={o} value={o}>{o}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LjkScannerModal;
