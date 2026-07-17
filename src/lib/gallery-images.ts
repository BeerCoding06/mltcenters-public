const galleryModules = import.meta.glob<string>(
  '@/assets/gallery-krumam/*.jpg',
  { eager: true, import: 'default' }
);

const sortKey = (path: string) => {
  const match = path.match(/_(\d+)\.jpg$/i);
  return match ? Number(match[1]) : 0;
};

export type GalleryImage = {
  src: string;
  altEn: string;
  altTh: string;
};

export const galleryImages: GalleryImage[] = Object.entries(galleryModules)
  .sort(([a], [b]) => sortKey(a) - sortKey(b))
  .map(([path, src], index) => ({
    src,
    altEn: `English language workshop at MLTCENTERS — students practicing speaking and learning English, photo ${index + 1}`,
    altTh: `ภาพเวิร์กช็อปเรียนภาษาอังกฤษ MLTCENTERS — นักเรียนฝึกพูดและเรียนรู้ภาษาอังกฤษ รูปที่ ${index + 1}`,
  }));

export function getGalleryImage(index: number): GalleryImage {
  return galleryImages[index % galleryImages.length];
}
