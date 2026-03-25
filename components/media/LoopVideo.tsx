type LoopVideoProps = {
  src: string;
  label: string;
  poster?: string;
  className?: string;
  priority?: boolean;
};

export function LoopVideo({ src, label, poster, className, priority = false }: LoopVideoProps) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload={priority ? 'auto' : 'metadata'}
      poster={poster}
      aria-label={label}
      disablePictureInPicture
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

