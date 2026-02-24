import React, { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { HTML5Backend, getEmptyImage } from "react-dnd-html5-backend";
import { DotsSixVertical } from "@phosphor-icons/react";

/* ------------------------------------------------------------------ */
/*  Context – single DndProvider per tree                              */
/* ------------------------------------------------------------------ */

const DndReady = createContext(false);

/** Registry so CustomDragLayer can find the DOM node of any dragged item */
const DragNodeRegistry = createContext<React.MutableRefObject<Map<string, HTMLDivElement>>>(
  { current: new Map() }
);

/**
 * Wrap a section of the page that contains one or more `DraggableFieldGrid`s.
 * Provides a single DndProvider so multiple grids can coexist without errors.
 */
export function FieldDndProvider({ children }: { children: React.ReactNode }) {
  const registryRef = useRef<Map<string, HTMLDivElement>>(new Map());
  return (
    <DndProvider backend={HTML5Backend}>
      <DndReady.Provider value={true}>
        <DragNodeRegistry.Provider value={registryRef}>
          {children}
          <CustomDragLayer />
        </DragNodeRegistry.Provider>
      </DndReady.Provider>
    </DndProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Drag Layer – renders dragged item with rounded corners      */
/* ------------------------------------------------------------------ */

function CustomDragLayer() {
  const registry = useContext(DragNodeRegistry);
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem() as { id: string; width: number; height: number } | null,
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !item || !currentOffset) return null;

  const node = registry.current.get(item.id);
  if (!node) return null;

  const w = item.width || node.offsetWidth;
  const h = item.height || node.offsetHeight;

  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 99999,
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: currentOffset.x - w / 2,
          top: currentOffset.y - 20,
          width: w,
          height: h,
          borderRadius: 8,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
          opacity: 0.95,
          transform: "scale(1.03) rotate(0.5deg)",
          border: "1.5px solid rgba(7,171,222,0.25)",
        }}
        dangerouslySetInnerHTML={{ __html: node.innerHTML }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DraggableItem – wraps each child                                   */
/* ------------------------------------------------------------------ */

interface DraggableItemProps {
  /** Scoped type so items stay within their grid */
  type: string;
  id: string;
  index: number;
  moveItem: (from: number, to: number) => void;
  children: React.ReactNode;
}

function DraggableItem({ type, id, index, moveItem, children }: DraggableItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const registry = useContext(DragNodeRegistry);

  // Register this node so CustomDragLayer can find it
  useEffect(() => {
    if (ref.current) {
      registry.current.set(id, ref.current);
    }
    return () => {
      registry.current.delete(id);
    };
  }, [id, registry]);

  const [{ isDragging }, drag, preview] = useDrag({
    type,
    item: () => ({
      id,
      index,
      width: ref.current?.offsetWidth ?? 0,
      height: ref.current?.offsetHeight ?? 0,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Hide the default browser drag preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: type,
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      // For grid layouts, use a simpler "center distance" approach:
      // swap as soon as the cursor is inside the target element's bounds
      // (no restrictive middle-Y gate that fails in multi-column grids)
      const hoverRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Only require the cursor to be within the element bounds
      const inBounds =
        clientOffset.x >= hoverRect.left &&
        clientOffset.x <= hoverRect.right &&
        clientOffset.y >= hoverRect.top &&
        clientOffset.y <= hoverRect.bottom;
      if (!inBounds) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Attach drag to the handle, drop to the whole item
  drag(handleRef);
  drop(ref);

  return (
    <div
      ref={ref}
      className={`group/drag flex items-stretch transition-all duration-150 rounded-[8px] ${
        isDragging ? "opacity-20 scale-[0.97] bg-[#f0f2f5]" : ""
      } ${isOver && canDrop ? "ring-2 ring-[#07abde]/40 bg-[#f8fbff]" : ""}`}
    >
      {/* Drag handle – outside the field, to the left */}
      <div
        ref={handleRef}
        className="flex-shrink-0 w-[18px] flex items-center justify-center opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded-l-[8px] hover:bg-[#f0f2f5]"
        title="Arrastar para reordenar"
      >
        <DotsSixVertical size={14} weight="bold" style={{ color: "#4E6987" }} />
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DraggableFieldGrid – the grid itself (no provider)                 */
/* ------------------------------------------------------------------ */

export interface DraggableFieldGridProps {
  /** Unique key for localStorage persistence & DnD scope */
  storageKey: string;
  /** Grid columns — default 2 */
  columns?: 1 | 2 | 3;
  /** Gap in px — default 12 */
  gap?: number;
  /** Extra class on the grid container */
  className?: string;
  children: React.ReactNode;
}

export function DraggableFieldGrid({
  storageKey,
  columns = 2,
  gap = 12,
  className = "",
  children,
}: DraggableFieldGridProps) {
  const hasDnd = useContext(DndReady);
  const standaloneRegistry = useRef<Map<string, HTMLDivElement>>(new Map());

  // Extract children with keys
  const childArray = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];

  // Build stable id list from keys
  const childIds = childArray.map((child, i) => {
    const k = child.key;
    return typeof k === "string" ? k.replace(/^\.\$/, "") : `field-${i}`;
  });

  const childIdsKey = childIds.join(",");

  // Load persisted order
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`dnd-field-order:${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const existing = new Set(childIds);
        const validSaved = parsed.filter((id) => existing.has(id));
        const missing = childIds.filter((id) => !validSaved.includes(id));
        return [...validSaved, ...missing];
      }
    } catch {}
    return childIds;
  });

  // Sync when children change
  useEffect(() => {
    setOrder((prev) => {
      const existing = new Set(childIds);
      const validPrev = prev.filter((id) => existing.has(id));
      const missing = childIds.filter((id) => !validPrev.includes(id));
      if (missing.length === 0 && validPrev.length === childIds.length) return prev;
      return [...validPrev, ...missing];
    });
  }, [childIdsKey]);

  // Build ordered children
  const idToChild = new Map(childIds.map((id, i) => [id, childArray[i]]));
  const validOrder = order.filter((id) => idToChild.has(id));
  const orderedChildren = validOrder.map((id) => idToChild.get(id)!);

  // Move handler
  const moveItem = useCallback(
    (from: number, to: number) => {
      setOrder((prev) => {
        const next = [...prev];
        const [removed] = next.splice(from, 1);
        next.splice(to, 0, removed);
        try {
          localStorage.setItem(`dnd-field-order:${storageKey}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey],
  );

  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2";

  // Scoped DnD type — items can only be dragged within this grid
  const dndType = `FIELD_GRID_${storageKey}`;

  const grid = (
    <div
      className={`grid ${colClass} ${className}`}
      style={{ gap }}
    >
      {orderedChildren.map((child, i) => {
        const id = validOrder[i];
        return (
          <DraggableItem key={id} type={dndType} id={id} index={i} moveItem={moveItem}>
            {child}
          </DraggableItem>
        );
      })}
    </div>
  );

  // If no parent FieldDndProvider, wrap with one automatically (standalone usage)
  if (!hasDnd) {
    return (
      <DndProvider backend={HTML5Backend}>
        <DndReady.Provider value={true}>
          <DragNodeRegistry.Provider value={standaloneRegistry}>
            {grid}
            <CustomDragLayer />
          </DragNodeRegistry.Provider>
        </DndReady.Provider>
      </DndProvider>
    );
  }

  return grid;
}