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
    altEn: `MLTCENTERS language workshop and study-travel activity photo ${index + 1}`,
    altTh: `ภาพกิจกรรมเรียนภาษาและทัศนศึกษา MLTCENTERS รูปที่ ${index + 1}`,
  }));

/** รูปตัวอย่างบนหน้าแรก (8 รูป กระจายจากทั้งอัลบั้ม) */
export const galleryPreviewImages: GalleryImage[] = (() => {
  const count = 8;
  if (galleryImages.length <= count) return galleryImages;
  const step = Math.floor(galleryImages.length / count);
  return Array.from({ length: count }, (_, i) => galleryImages[Math.min(i * step, galleryImages.length - 1)]);
})();

export function getGalleryImage(index: number): GalleryImage {
  return galleryImages[index % galleryImages.length];
}
