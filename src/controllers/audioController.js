import ytmusicService from "../services/ytmusicService.js";

export const getAudioURLs = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: "Valid Video ID is required (11 characters)",
      });
    }

    console.log(`🎵 Getting audio URLs for: ${videoId}`);
    const audioData = await ytmusicService.getAudioURLs(videoId);

    if (!audioData.success) {
      return res.status(404).json({
        error: "Audio extraction failed",
        message: audioData.error,
        videoId: videoId,
      });
    }

    res.json({
      success: true,
      videoId: videoId,
      title: audioData.title,
      author: audioData.author,
      duration: audioData.duration,
      formats: audioData.formats || [],
      bestAudio: audioData.bestAudio,
      audioByQuality: audioData.audioByQuality,
      expiresAt: audioData.expiresAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Audio URL error:", error.message);
    res.status(500).json({
      error: "Failed to get audio URLs",
      message: error.message,
      videoId: req.params.videoId,
    });
  }
};

export const getAudioStream = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { quality = "high" } = req.query;

    if (!videoId) {
      return res.status(400).json({
        error: "Video ID is required",
      });
    }

    console.log(`🎧 Getting audio stream for: ${videoId} [${quality}]`);
    const stream = await ytmusicService.getAudioStream(videoId, quality);

    res.json({
      success: true,
      videoId: videoId,
      url: stream.url,
      quality: stream.quality,
      bitrate: stream.bitrate,
      mimeType: stream.mimeType,
      metadata: stream.metadata,
      expiresAt: stream.expiresAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Audio stream error:", error.message);
    res.status(500).json({
      error: "Failed to get audio stream",
      message: error.message,
    });
  }
};

export const getAudioWithProxy = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        error: "Video ID is required",
      });
    }

    console.log(`🎵 Getting audio with proxy for: ${videoId}`);
    const audioData = await ytmusicService.getAudioURLs(videoId);

    if (!audioData.success) {
      return res.status(404).json({
        error: "Audio extraction failed",
        message: audioData.error,
        videoId: videoId,
      });
    }

    // Enhance the response with proxy URLs
    const enhancedFormats = audioData.formats.map((format) => ({
      ...format,
      proxyUrl: `/api/youtube/stream?url=${encodeURIComponent(format.url)}`,
    }));

    const enhancedBestAudio = audioData.bestAudio
      ? {
          ...audioData.bestAudio,
          proxyUrl: `/api/youtube/stream?url=${encodeURIComponent(
            audioData.bestAudio.url
          )}`,
        }
      : null;

    res.json({
      success: true,
      videoId: videoId,
      title: audioData.title,
      author: audioData.author,
      duration: audioData.duration,
      formats: enhancedFormats,
      bestAudio: enhancedBestAudio,
      audioByQuality: audioData.audioByQuality,
      // Provide both direct and proxy URLs
      urls: {
        direct: audioData.bestAudio?.url,
        proxy: enhancedBestAudio?.proxyUrl,
        download: `/api/audio/${videoId}/download`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Audio with proxy error:", error.message);
    res.status(500).json({
      error: "Failed to get audio URLs",
      message: error.message,
      videoId: req.params.videoId,
    });
  }
};
