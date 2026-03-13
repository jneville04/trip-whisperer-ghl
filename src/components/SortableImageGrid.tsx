import { ReactNode } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, ImagePlus } from "lucide-react";

interface SortableImageGridProps {
  /** Primary image URL (shown first, labeled "Main") */
  primaryImage: string;
  /** Additional gallery image URLs */
  galleryImages: string[];
  /** Called when primary changes */
  onPrimaryChange: (url: string) => void;
  /** Called when gallery changes */
  onGalleryChange: (urls: string[]) => void;
  /** Called when files are uploaded */
  onUpload: (files: FileList) => void;
  /** Aspect ratio class for thumbnails */
  aspectClass?: string;
  /** Primary image aspect class (larger) */
  primaryAspectClass?: string;
  /** Show col-span-2/row-span-2 for primary */
  primaryLarge?: boolean;
}

function SortableImageItem({
  id,
  url,
  label,
  onRemove,
  aspectClass,
  isLarge,
}: {
  id: string;
  url: string;
  label?: string;
  onRemove: () => void;
  aspectClass: string;
  isLarge?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${aspectClass} rounded-lg overflow-hidden border border-border/40 group ${isLarge ? "col-span-2 row-span-2" : ""}`}
    >
      <img src={url} alt="" className="w-full h-full object-cover" />
      {label && (
        <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
          {label}
        </div>
      )}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="bg-foreground/70 text-background rounded-full p-0.5 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button
          onClick={onRemove}
          className="bg-foreground/70 text-background rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function SortableImageGrid({
  primaryImage,
  galleryImages,
  onPrimaryChange,
  onGalleryChange,
  onUpload,
  aspectClass = "aspect-square",
  primaryAspectClass = "aspect-[16/9]",
  primaryLarge = true,
}: SortableImageGridProps) {
  // Combine into a single ordered list for DnD
  const allImages = [
    ...(primaryImage ? [primaryImage] : []),
    ...galleryImages,
  ];
  const itemIds = allImages.map((_, i) => `img-${i}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.indexOf(active.id as string);
    const newIndex = itemIds.indexOf(over.id as string);
    const reordered = arrayMove(allImages, oldIndex, newIndex);

    // First image becomes primary, rest become gallery
    onPrimaryChange(reordered[0] || "");
    onGalleryChange(reordered.slice(1));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-2">
          {allImages.map((url, i) => (
            <SortableImageItem
              key={itemIds[i]}
              id={itemIds[i]}
              url={url}
              label={i === 0 ? "Main Photo" : undefined}
              aspectClass={i === 0 && primaryLarge ? primaryAspectClass : aspectClass}
              isLarge={i === 0 && primaryLarge}
              onRemove={() => {
                if (i === 0) {
                  // Remove primary: promote first gallery image
                  const newPrimary = galleryImages[0] || "";
                  onPrimaryChange(newPrimary);
                  onGalleryChange(galleryImages.slice(1));
                } else {
                  onGalleryChange(galleryImages.filter((_, j) => j !== i - 1));
                }
              }}
            />
          ))}
          {/* Upload button */}
          <label className={`${aspectClass} rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors`}>
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">Add photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </SortableContext>
    </DndContext>
  );
}
