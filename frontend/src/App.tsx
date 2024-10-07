
//@ts-nocheck

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Interface for an overlay
interface Overlay {
  _id?: string;
  type: 'text' | 'image'; // Whether it's a text or image overlay
  content: string; // Either the text content or image URL
  position: { x: number; y: number }; // Position of the overlay
  size: { width: number; height: number }; // Size of the overlay
}

const LivestreamPage = () => {
  const videoRef = useRef(null);
  const [streamReady, setStreamReady] = useState(false);
  const [overlays, setOverlays] = useState<Overlay[]>([]); // Manage overlays
  const [newOverlay, setNewOverlay] = useState<{ type: 'text' | 'image'; content: string } | null>(null);
  const streamURL = 'http://localhost:5000/hls/output.m3u8';

  useEffect(() => {
    fetch('http://localhost:5000/start-stream')
      .then(response => response.json())
      .then(data => {
        const checkHLSAvailability = setInterval(() => {
          fetch(streamURL)
            .then(res => {
              if (res.status === 200) {
                setStreamReady(true);
                clearInterval(checkHLSAvailability);
              }
            })
            .catch(err => console.error('Error checking HLS availability:', err));
        }, 2000);
      })
      .catch(error => console.error('Error starting stream:', error));
  }, []);

  useEffect(() => {
    if (streamReady && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamURL);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamURL;
      }
    }
  }, [streamReady]);

  // Fetch existing overlays from the backend
  useEffect(() => {
    fetch('http://localhost:5000/api/overlays')
      .then(response => response.json())
      .then(data => setOverlays(data))
      .catch(error => console.error('Error fetching overlays:', error));
  }, []);

  // Add a new overlay (either image or text)
  const addOverlay = () => {
    if (!newOverlay) return;

    const defaultPosition = { x: 50, y: 50 };
    const defaultSize = { width: 200, height: 100 };
    const overlayData = {
      type: newOverlay.type,
      content: newOverlay.content,
      position: defaultPosition,
      size: defaultSize,
    };

    fetch('http://localhost:5000/api/overlays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(overlayData),
    })
      .then(response => response.json())
      .then(addedOverlay => {
        setOverlays([...overlays, addedOverlay]);
        setNewOverlay(null); // Reset the new overlay input
      })
      .catch(error => console.error('Error adding overlay:', error));
  };

  // Save overlay position and size updates
  const updateOverlay = (id: string, updatedOverlay: Partial<Overlay>) => {
    fetch(`http://localhost:5000/api/overlays/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedOverlay),
    })
      .then(response => response.json())
      .then(updated => {
        setOverlays(overlays.map(o => (o._id === id ? { ...o, ...updatedOverlay } : o)));
      })
      .catch(error => console.error('Error updating overlay:', error));
  };

  // Handle file input for image overlays
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setNewOverlay({ type: 'image', content: reader.result as string });
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <div className="livestream-page">
      <h1>Welcome to the Livestream</h1>
      {streamReady ? (
        <>
          <div style={{ position: 'relative', width: '100%', height: '500px' }}>
            <video ref={videoRef} controls autoPlay style={{ width: '100%', height: '100%' }} />

            {/* Display overlays */}
            {overlays.map(overlay => (
              <Draggable
                key={overlay._id}
                defaultPosition={{ x: overlay.position.x, y: overlay.position.y }}
                onStop={(e, data) => updateOverlay(overlay._id!, { position: { x: data.x, y: data.y } })}
              >
                <ResizableBox
                  width={overlay.size.width}
                  height={overlay.size.height}
                  onResizeStop={(e, data) => updateOverlay(overlay._id!, { size: { width: data.size.width, height: data.size.height } })}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: overlay.type === 'text' ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                    }}
                  >
                    {overlay.type === 'text' ? overlay.content : <img src={overlay.content} alt="overlay" style={{ width: '100%', height: '100%' }} />}
                  </div>
                </ResizableBox>
              </Draggable>
            ))}
          </div>
        </>
      ) : (
        <p>Loading stream...</p>
      )}

      {/* Buttons and inputs to add new overlays */}
      <div style={{ marginTop: '20px' }}>
        <input type="text" placeholder="Enter overlay text" onChange={e => setNewOverlay({ type: 'text', content: e.target.value })} />
        <button onClick={addOverlay}>Add Text Overlay</button>

        <input type="file" onChange={handleFileUpload} />
        <button onClick={addOverlay}>Add Image Overlay</button>
      </div>
    </div>
  );
};

export default LivestreamPage;




