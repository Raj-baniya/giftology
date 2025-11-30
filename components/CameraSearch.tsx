import React, { useRef, useState, useEffect } from 'react';
import { X, Zap, ZapOff, HelpCircle, Image as ImageIcon, Camera, ScanLine, ChevronLeft } from 'lucide-react';

interface CameraSearchProps {
    onClose: () => void;
    onSearch: (image: File) => void;
}

export const CameraSearch: React.FC<CameraSearchProps> = ({ onClose, onSearch }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [flashOn, setFlashOn] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Unable to access camera. Please upload a photo instead.');
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleFlash = async () => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        try {
            await track.applyConstraints({
                advanced: [{ torch: !flashOn } as any]
            });
            setFlashOn(!flashOn);
        } catch (err) {
            console.warn('Flash not supported', err);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                onSearch(file);
                onClose();
            }
        }, 'image/jpeg');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onSearch(e.target.files[0]);
            onClose();
        }
    };

    if (showHelp) {
        return (
            <div className="fixed inset-0 bg-black text-white z-50 overflow-y-auto p-4">
                <div className="flex items-center mb-6">
                    <button onClick={() => setShowHelp(false)} className="p-2">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold ml-2">BACK</h2>
                </div>

                <div className="space-y-6 px-2">
                    <section>
                        <h3 className="font-bold text-lg mb-2">What is "Search with camera"?</h3>
                        <p className="text-gray-300 text-sm">"Search with camera" enables you to search for products using your camera. You can find products such as books, toys, electronics, apparel, and more.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">How can I search for products?</h3>
                        <p className="text-gray-300 text-sm">Point your camera at the product and tap the search button. Alternatively, select a photo from your gallery.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">How do people use "Search with camera"?</h3>
                        <p className="text-gray-300 text-sm">Use it when you see an interesting product to buy on Giftology. You can also use it to re-order items by scanning the product itself.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">I didn't get results. What's wrong?</h3>
                        <p className="text-gray-300 text-sm">1. Ensure the entire product is in view.<br />2. Check lighting.<br />3. Move closer or zoom in.</p>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onClose} className="p-2 text-white">
                    <X className="w-6 h-6" />
                </button>
                <div className="text-white font-bold text-xl flex items-center gap-1">
                    lens <span className="text-primary">ai</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={toggleFlash} className="p-2 text-white">
                        {flashOn ? <Zap className="w-6 h-6 text-yellow-400" /> : <ZapOff className="w-6 h-6" />}
                    </button>
                    <button onClick={() => setShowHelp(true)} className="p-2 text-white">
                        <HelpCircle className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Camera View */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-white text-center p-4">
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white text-black px-4 py-2 rounded-full font-bold"
                        >
                            Upload Photo
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute bottom-32 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                        Take a photo to search products
                    </span>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-black p-8 pb-12 flex justify-between items-center">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    <ImageIcon className="w-6 h-6" />
                </button>

                <button
                    onClick={handleCapture}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"
                >
                    <div className="w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform" />
                    <Camera className="w-8 h-8 text-black absolute z-10" />
                </button>

                <button className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                    <ScanLine className="w-6 h-6" />
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />
        </div>
    );
};
