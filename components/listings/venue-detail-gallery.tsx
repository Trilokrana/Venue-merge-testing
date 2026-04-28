"use client"

import { Building2, LayoutGrid } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VenuePhotosOverlay } from "./venue-photos-overlay"

type Img = { id: string; url: string }

type Props = {
  images: Img[]
  onShowAll: () => void
  onGalleryImageClick?: (index: number) => void
  className?: string
  openOverlay: boolean
  onCloseOverlay: () => void
  photoIndex: number
  setPhotoIndex: (index: number) => void
}

const defaultImageOverlay =
  "pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/15"

export function VenueDetailGallery({
  images,
  onShowAll,
  onGalleryImageClick,
  className,
  openOverlay,
  onCloseOverlay,
  photoIndex,
  setPhotoIndex,
}: Props) {
  const list = images ?? []
  const canOpenGallery = list.length > 1

  if (list.length === 0) {
    return (
      <>
        <div
          className={cn(
            "flex aspect-square sm:aspect-21/9 min-h-[200px] items-center justify-center rounded-xl border",
            className
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <Building2 className="size-12 opacity-50" />
            <span className="text-sm">No photos yet</span>
          </div>
        </div>

        <VenueDetailGalleryOverlay
          openOverlay={openOverlay}
          photoIndex={photoIndex}
          setPhotoIndex={setPhotoIndex}
          images={images}
          onCloseOverlay={onCloseOverlay}
        />
      </>
    )
  }

  if (list.length === 1) {
    return (
      <>
        <div
          className={cn(
            "group relative aspect-square sm:aspect-21/9 min-h-[220px] overflow-hidden rounded-xl md:min-h-[320px]",
            className
          )}
          onClick={() => onGalleryImageClick?.(0)}
        >
          <Image
            src={list[0].url}
            alt=""
            fill
            priority
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 1152px"
          />
          <div aria-hidden className={defaultImageOverlay} />
        </div>
        <VenueDetailGalleryOverlay
          openOverlay={openOverlay}
          onCloseOverlay={onCloseOverlay}
          photoIndex={photoIndex}
          setPhotoIndex={setPhotoIndex}
          images={images}
        />
      </>
    )
  }

  if (list.length === 2) {
    return (
      <>
        <div
          className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 md:h-[min(400px,50vh)]", className)}
          onClick={() => onGalleryImageClick?.(0)}
        >
          <div className="group relative min-h-[200px] overflow-hidden rounded-xl md:min-h-0">
            <Image
              src={list[0].url ?? null}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div aria-hidden className={defaultImageOverlay} />
          </div>
          <div
            className="group relative min-h-[200px] overflow-hidden rounded-xl md:min-h-0"
            onClick={() => onGalleryImageClick?.(1)}
          >
            <Image
              src={list[1].url}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div aria-hidden className={defaultImageOverlay} />
            {canOpenGallery ? <ShowAllPhotosButton onClick={onShowAll} extra={0} /> : null}
          </div>
        </div>
        <VenueDetailGalleryOverlay
          openOverlay={openOverlay}
          onCloseOverlay={onCloseOverlay}
          photoIndex={photoIndex}
          setPhotoIndex={setPhotoIndex}
          images={images}
        />
      </>
    )
  }

  if (list.length === 3) {
    return (
      <>
        <div className={cn("flex flex-col gap-4", className)}>
          <div className="hidden gap-4 md:grid md:h-[min(400px,50vh)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:grid-rows-2">
            <div
              className="group relative row-span-2 overflow-hidden rounded-xl"
              onClick={() => onGalleryImageClick?.(0)}
            >
              <Image
                src={list[0].url ?? null}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="66vw"
              />
              <div aria-hidden className={defaultImageOverlay} />
            </div>
            <div
              className="group relative min-h-0 overflow-hidden rounded-xl"
              onClick={() => onGalleryImageClick?.(1)}
            >
              <Image src={list[1].url} alt="" fill priority className="object-cover" sizes="33vw" />
              <div aria-hidden className={defaultImageOverlay} />
            </div>
            <div
              className="group relative min-h-0 overflow-hidden rounded-xl"
              onClick={() => onGalleryImageClick?.(2)}
            >
              <Image src={list[2].url} alt="" fill priority className="object-cover" sizes="33vw" />
              <div aria-hidden className={defaultImageOverlay} />
              {canOpenGallery ? <ShowAllPhotosButton onClick={onShowAll} extra={0} /> : null}
            </div>
          </div>
          <div className="md:hidden">
            <div
              className="group relative mb-2 aspect-4/3 overflow-hidden rounded-xl"
              onClick={() => onGalleryImageClick?.(0)}
            >
              <Image
                src={list[0].url ?? null}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              <div aria-hidden className={defaultImageOverlay} />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {list.slice(1).map((im) => (
                <div
                  key={im.id}
                  className="group relative h-24 w-36 shrink-0 overflow-hidden rounded-xl"
                  onClick={() => onGalleryImageClick?.(list.indexOf(im))}
                >
                  <Image src={im.url} alt="" fill className="object-cover" sizes="144px" />
                  <div aria-hidden className={defaultImageOverlay} />
                </div>
              ))}
              {canOpenGallery ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-24 shrink-0 rounded-xl border-neutral-300 bg-white px-3 text-xs font-semibold shadow-sm"
                  onClick={onShowAll}
                >
                  <LayoutGrid className="mr-1.5 size-4" />
                  All photos
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <VenueDetailGalleryOverlay
          openOverlay={openOverlay}
          onCloseOverlay={onCloseOverlay}
          photoIndex={photoIndex}
          setPhotoIndex={setPhotoIndex}
          images={images}
        />
      </>
    )
  }

  // 4+ images: large left + 3 stacked right (desktop)
  const main = list[0]
  const r1 = list[1]
  const r2 = list[2]
  const r3 = list[3] ?? list[list.length - 1]
  const extraAfterFour = Math.max(0, list.length - 4)

  return (
    <>
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="hidden gap-4 md:grid md:h-[min(420px,52vh)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:grid-rows-3">
          <div
            className="group relative row-span-3 overflow-hidden rounded-xl"
            onClick={() => onGalleryImageClick?.(0)}
          >
            <Image src={main.url} alt="" fill priority className="object-cover" sizes="66vw" />
            <div aria-hidden className={defaultImageOverlay} />
          </div>
          <div
            className="group relative min-h-0 overflow-hidden rounded-xl"
            onClick={() => onGalleryImageClick?.(1)}
          >
            <Image src={r1.url} alt="" fill priority className="object-cover" sizes="33vw" />
            <div aria-hidden className={defaultImageOverlay} />
          </div>
          <div
            className="group relative min-h-0 overflow-hidden rounded-xl"
            onClick={() => onGalleryImageClick?.(2)}
          >
            <Image src={r2.url} alt="" fill priority className="object-cover" sizes="33vw" />
            <div aria-hidden className={defaultImageOverlay} />
          </div>
          <div
            className="group relative min-h-0 overflow-hidden rounded-xl"
            onClick={() => onGalleryImageClick?.(3)}
          >
            <Image src={r3.url} alt="" fill priority className="object-cover" sizes="33vw" />
            <div aria-hidden className={defaultImageOverlay} />
            {canOpenGallery ? (
              <>
                {extraAfterFour > 0 ? (
                  <div className="absolute inset-0 bg-black/40" aria-hidden />
                ) : null}
                <ShowAllPhotosButton onClick={onShowAll} extra={extraAfterFour} />
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile: hero + horizontal strip */}
        <div className="md:hidden">
          <div
            className="group relative mb-2 aspect-4/3 overflow-hidden rounded-xl"
            onClick={() => onGalleryImageClick?.(0)}
          >
            <Image src={main.url} alt="" fill priority className="object-cover" sizes="100vw" />
            <div aria-hidden className={defaultImageOverlay} />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {list.slice(1).map((im) => (
              <div
                key={im.id}
                className="group relative h-24 w-36 shrink-0 overflow-hidden rounded-xl"
                onClick={() => onGalleryImageClick?.(list.indexOf(im))}
              >
                <Image src={im.url} alt="" fill className="object-cover" sizes="144px" />
                <div aria-hidden className={defaultImageOverlay} />
              </div>
            ))}
            {canOpenGallery ? (
              <Button
                type="button"
                variant="outline"
                className="h-24 shrink-0 rounded-xl px-3 text-xs font-semibold shadow-sm"
                onClick={onShowAll}
              >
                <LayoutGrid className="mr-1.5 size-4" />
                All photos
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <VenueDetailGalleryOverlay
        openOverlay={openOverlay}
        onCloseOverlay={onCloseOverlay}
        photoIndex={photoIndex}
        setPhotoIndex={setPhotoIndex}
        images={images}
      />
    </>
  )
}

function ShowAllPhotosButton({ onClick, extra }: { onClick: () => void; extra: number }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="absolute right-3 bottom-3 z-10 gap-4 border px-4 py-2 text-sm font-semibold shadow-md "
    >
      <LayoutGrid className="size-4" />
      Show all photos
      {extra > 0 ? <span className="text-muted-foreground">+{extra}</span> : null}
    </Button>
  )
}

function VenueDetailGalleryOverlay({
  openOverlay,
  onCloseOverlay,
  photoIndex,
  setPhotoIndex,
  images,
}: {
  openOverlay: boolean
  onCloseOverlay: () => void
  photoIndex: number
  setPhotoIndex: (index: number) => void
  images: Img[]
}) {
  return (
    <>
      <VenuePhotosOverlay
        open={openOverlay}
        onClose={onCloseOverlay}
        images={images}
        index={photoIndex}
        setIndex={setPhotoIndex}
      />
    </>
  )
}
