import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

interface SpectrogramProps {
  audioId: string | null;
  token: string | null;
}

const API_URL = "http://localhost:8000/api/v1";

const SpectrogramDisplay = ({ audioId, token }: SpectrogramProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!audioId || !token) {
      setImageUrl(null);
      setError(false);
      return;
    }

    // Attempt to fetch the generated spectrogram PNG from the backend
    const url = `${API_URL}/audio/spectrogram/${audioId}`;

    // Using fetch to pass the Auth Token header, then converting to Object URL
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Spectrogram not ready");
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });

    // Cleanup blob URL on unmount to prevent memory leaks
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioId, token]);

  if (!audioId) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px]">
        <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-muted-foreground text-sm font-display tracking-widest uppercase">Spectrogram</p>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center justify-center min-h-[160px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-muted-foreground text-xs animate-pulse">Generating Heatmap...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 min-h-[160px] flex flex-col">
      <h3 className="text-sm font-display text-foreground mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-400" />
        Spectrogram Analysis
      </h3>
      <div className="w-full flex-1 relative rounded-lg overflow-hidden bg-black/40">
        <img
          src={imageUrl}
          alt="Audio Spectrogram Heatmap"
          className="w-full h-full object-fill absolute inset-0"
        />
      </div>
    </div>
  );
};

export default SpectrogramDisplay;
