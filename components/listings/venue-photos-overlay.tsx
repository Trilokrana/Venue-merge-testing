"use client"

import Image from "next/image"
import * as React from "react"
import { RenderImageContext, RenderImageProps, RowsPhotoAlbum } from "react-photo-album"
import "react-photo-album/rows.css"
import Lightbox from "yet-another-react-lightbox"
import Counter from "yet-another-react-lightbox/plugins/counter"
import "yet-another-react-lightbox/plugins/counter.css"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function renderNextImage(
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height }: RenderImageContext
) {
  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        aspectRatio: `${width ?? 1920} / ${height ?? 1280}`,
      }}
    >
      <Image
        fill
        src={photo}
        alt={alt}
        title={title}
        sizes={sizes}
        placeholder={"blurDataURL" in photo ? "blur" : undefined}
        className="object-cover border aspect-square w-full h-full"
      />
    </div>
  )
}

type Img = { id: string; url: string }

type Props = {
  open: boolean
  onClose: () => void
  images: Img[]
  index: number
  setIndex: (index: number) => void
}

export function VenuePhotosOverlay({ open, onClose, images, index, setIndex }: Props) {
  const slides = React.useMemo(
    () => images.map((im) => ({ src: im.url, alt: "", width: 1920, height: 1280 })),
    [images]
  )

  // -1 means lightbox closed. Any non-negative value = lightbox open at that index.
  // const [index, setIndex] = React.useState(-1)
  const lightboxOpen = index >= 0

  // When the grid Dialog is closed externally, also reset the lightbox index
  // so reopening starts clean.
  React.useEffect(() => {
    if (!open) setIndex(-1)
  }, [open, setIndex])

  return (
    <>
      {/* Grid Dialog — hidden (not unmounted) while the lightbox is open,
          so reopening after close returns to the grid instantly. */}

      <Dialog
        modal={false}
        open={open && !lightboxOpen}
        onOpenChange={(next) => {
          if (!next && !lightboxOpen) onClose()
        }}
      >
        <DialogContent
          className="
            flex h-dvh w-screen flex-col overflow-hidden p-0 rounded-none
            max-w-screen sm:max-w-screen lg:max-w-screen
            gap-0
          "
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="text-lg font-semibold">
              All photos
              {images.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({images.length})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl p-4 pb-12 md:p-6">
              {images.length === 0 ? (
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                  No photos to display.
                </div>
              ) : (
                <RowsPhotoAlbum
                  photos={slides}
                  render={{ image: renderNextImage }}
                  defaultContainerWidth={1200}
                  sizes={{
                    size: "1168px",
                    sizes: [{ viewport: "(max-width: 1200px)", size: "calc(100vw - 32px)" }],
                  }}
                  onClick={(data) => setIndex(data.index)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox — only mounted while actively viewing. Sibling to Dialog. */}
      <Lightbox
        open={lightboxOpen}
        index={index < 0 ? 0 : index}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Counter, Zoom, Thumbnails]}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        on={{
          view: ({ index: i }) => setIndex(i), // keep local state in sync with nav
        }}
        controller={{
          closeOnBackdropClick: false,
          closeOnPullDown: false,
          closeOnPullUp: false,
          preventDefaultWheelX: true,
          preventDefaultWheelY: true,
        }}
        noScroll={{ disabled: true }}
        portal={{
          // root: document.body,
          container: {
            style: {
              zIndex: 2147483647,
              pointerEvents: "auto",
            },
          },
        }}
      />
    </>
  )
}
