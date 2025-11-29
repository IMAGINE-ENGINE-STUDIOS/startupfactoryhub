const VideoBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      <iframe
        src="https://drive.google.com/file/d/1ZlWoxOIMb6qPOK3KHUx_zh2Rp3GOAb6_/preview?autoplay=1"
        title="Background Video"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '300vw',
          height: '300vh',
          minWidth: '100%',
          minHeight: '100%',
        }}
        allow="autoplay; encrypted-media"
        frameBorder="0"
      />
    </div>
  );
};

export default VideoBackground;
