const VideoBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      <iframe
        src="https://www.youtube.com/embed/8U1CnEdcEh0?autoplay=1&mute=1&loop=1&playlist=8U1CnEdcEh0&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1"
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
