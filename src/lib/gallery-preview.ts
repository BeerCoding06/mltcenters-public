/** Lightweight gallery previews for home page only (~150KB total). */
export type GalleryPreviewImage = {
  src: string;
  altEn: string;
  altTh: string;
};

export const galleryPreviewImages: GalleryPreviewImage[] = Array.from({ length: 8 }, (_, i) => ({
  src: `/gallery-preview/${i + 1}.webp`,
  altEn: `English language workshop at MLTCENTERS — students practicing speaking and learning English, photo ${i + 1}`,
  altTh: `ภาพเวิร์กช็อปเรียนภาษาอังกฤษ MLTCENTERS — นักเรียนฝึกพูดและเรียนรู้ภาษาอังกฤษ รูปที่ ${i + 1}`,
}));
