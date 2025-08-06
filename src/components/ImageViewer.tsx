import { useEffect, useState } from "react";

const ImageViewer = ({ imageUrl, altText }: { imageUrl: string; altText: string }) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return; // Only allow dragging when zoomed
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

  // Touch drag handlers for mobile
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
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const newPanX = touch.clientX - dragStart.x;
    const newPanY = touch.clientY - dragStart.y;
    
    setPanX(newPanX);
    setPanY(newPanY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset pan when zoom changes to 1
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
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
          title="Rotate 90°"
        >
          🔄
        </button>
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
          title="Zoom In"
        >
          🔍+
        </button>
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
          title="Zoom Out"
        >
          🔍-
        </button>
        <button
          onClick={handleReset}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
          title="Reset"
        >
          ↺
        </button>
        <button
          onClick={handleFullscreen}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
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
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{ 
              transform: imageTransform,
              cursor: cursorStyle
            }}
            draggable={false}
          />
        </div>
      </div>

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
              className="absolute top-2 right-2 text-white text-2xl hover:text-gray-300 z-10"
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
                src={imageUrl}
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