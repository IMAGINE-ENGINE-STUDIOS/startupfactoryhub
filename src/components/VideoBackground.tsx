const VideoBackground = () => {
  // Supabase storage URL for the video
  const videoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/videos/hero-background.mp4";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
};

export default VideoBackground;
