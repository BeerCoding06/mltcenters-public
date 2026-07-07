/** Lightweight gallery previews for home page only (~150KB total). */
export type GalleryPreviewImage = {
  src: string;
  altEn: string;
  altTh: string;
};

export const galleryPreviewImages: GalleryPreviewImage[] = Array.from({ length: 8 }, (_, i) => ({
  src: `/gallery-preview/${i + 1}.webp`,
  altEn: `MLTCENTERS language workshop and study-travel activity photo ${i + 1}`,
  altTh: `ภาพกิจกรรมเรียนภาษาและทัศนศึกษา MLTCENTERS รูปที่ ${i + 1}`,
}));
