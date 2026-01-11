import { useEffect, useState, useRef } from "react";

const ImageViewer = ({ imageUrl, altText }: { imageUrl: string; altText: string }) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [displayUrl, setDisplayUrl] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  
  // Use ref to track if conversion is in progress for this URL
  const conversionInProgress = useRef<string | null>(null);

  // Detect if the image is HEIC/HEIF format
  const isHEIC = imageUrl.toLowerCase().match(/\.(heic|heif)(\?|$|&)/);

  useEffect(() => {
    const loadImage = async () => {
      // For non-HEIC images, display directly
      if (!isHEIC) {
        setDisplayUrl(imageUrl);
        setIsConverting(false);
        setConversionError(null);
        return;
      }

      // If already converting this exact URL, skip
      if (conversionInProgress.current === imageUrl) {
        return;
      }

      // Mark this URL as being converted
      conversionInProgress.current = imageUrl;
      setIsConverting(true);
      setConversionError(null);
      setDisplayUrl("");

      try {
        console.log('Converting HEIC image...');
        
        const response = await fetch('/api/convert-heic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || `Server error: ${response.status}`);
        }

        // Get the converted image as blob
        const blob = await response.blob();
        const convertedUrl = URL.createObjectURL(blob);
        
        setDisplayUrl(convertedUrl);
        
        // Log cache status
        const cacheStatus = response.headers.get('X-Cache');
        console.log(`✓ HEIC converted (Cache: ${cacheStatus || 'UNKNOWN'})`);

      } catch (error) {
        console.error('HEIC conversion failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setConversionError(`Failed to convert HEIC image: ${errorMessage}`);
      } finally {
        setIsConverting(false);
        conversionInProgress.current = null;
      }
    };

    loadImage();

    // Cleanup blob URLs when imageUrl changes
    return () => {
      if (displayUrl && displayUrl.startsWith('blob:') && imageUrl !== displayUrl) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [imageUrl]); // Only depend on imageUrl, not isHEIC or displayUrl

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panX,
      y: e.clientY - panY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    
    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;
    
    setPanX(newPanX);
    setPanY(newPanY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - panX,
      y: touch.clientY - panY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newPanX = touch.clientX - dragStart.x;
    const newPanY = touch.clientY - dragStart.y;
    
    setPanX(newPanX);
    setPanY(newPanY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (zoom === 1) {
      setPanX(0);
      setPanY(0);
    }
  }, [zoom]);

  const imageTransform = `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${zoom})`;
  const cursorStyle = zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';

  return (
    <div className="relative">
      {/* Image Controls */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={handleRotate}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
          disabled={isConverting}
          title="Rotate 90°"
        >
          🔄
        </button>
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
          disabled={isConverting}
          title="Zoom In"
        >
          🔍+
        </button>
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
          disabled={isConverting}
          title="Zoom Out"
        >
          🔍-
        </button>
        <button
          onClick={handleReset}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
          disabled={isConverting}
          title="Reset"
        >
          ↺
        </button>
        <button
          onClick={handleFullscreen}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
          disabled={isConverting}
          title="Fullscreen"
        >
          ⛶
        </button>
        <button
          onClick={handleOpenInNewTab}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
          title="Open in New Tab"
        >
          ↗
        </button>
      </div>

      {/* Image Container */}
      <div className="border rounded overflow-hidden bg-gray-50">
        <div 
          className="relative w-full h-64 md:h-96 flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isConverting ? (
            <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
              <div className="animate-spin text-3xl">⏳</div>
              <div>Converting HEIC format...</div>
            </div>
          ) : conversionError ? (
            <div className="text-center p-6 max-w-md">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="text-sm text-red-600 mb-4 font-medium">
                {conversionError}
              </div>
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Open Original File
              </button>
            </div>
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt={altText}
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
              style={{ 
                transform: imageTransform,
                cursor: cursorStyle
              }}
              draggable={false}
            />
          ) : null}
        </div>
      </div>

      {/* Format indicator - only show for successfully converted HEIC */}
      {isHEIC && displayUrl && !conversionError && !isConverting && (
        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <span>✓</span>
          <span>HEIC format converted to JPEG</span>
        </div>
      )}

      {/* Zoom indicator */}
      {zoom !== 1 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {Math.round(zoom * 100)}%
        </div>
      )}

      {/* Pan hint */}
      {zoom > 1 && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Click and drag to pan
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-full max-h-full p-4">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-2 right-2 text-white text-2xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={displayUrl}
                alt={altText}
                className="max-w-full max-h-full object-contain select-none"
                style={{ 
                  transform: imageTransform,
                  cursor: cursorStyle
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;