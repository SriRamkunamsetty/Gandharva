export const fileToBase64 = (file: Blob): Promise<{ base64: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, base64] = dataUrl.split(",");
      const mimeMatch = meta.match(/data:([^;]+);base64/);
      resolve({ base64, mimeType: mimeMatch?.[1] ?? file.type ?? "audio/wav" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const getAudioDuration = (file: Blob): Promise<number> =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const d = audio.duration;
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(d) ? d : 0);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
      audio.src = url;
    } catch {
      resolve(0);
    }
  });