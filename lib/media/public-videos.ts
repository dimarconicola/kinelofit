export interface PublicVideoAsset {
  poster: string;
  fallbackMp4?: string;
  muxPlaybackId?: string;
}

const pexels = (fallbackMp4: string): PublicVideoAsset => ({
  poster: '/home-hero.jpg',
  fallbackMp4
});

export const publicVideos = {
  heroFlow: pexels('https://www.pexels.com/download/video/6019949/'),
  aerial: pexels('https://www.pexels.com/download/video/4324477/'),
  stretching: pexels('https://www.pexels.com/download/video/7801733/'),
  meditation: pexels('https://www.pexels.com/download/video/8391365/'),
  advanced: pexels('https://www.pexels.com/download/video/5770451/'),
  rollingMat: pexels('https://www.pexels.com/download/video/6952966/'),
  seaPanorama: pexels('https://www.pexels.com/download/video/6298146/')
} as const;
