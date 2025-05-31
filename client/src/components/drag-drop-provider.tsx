import { createContext, useContext, useState, ReactNode } from 'react';

interface DragDropContextType {
  draggedItem: any;
  setDraggedItem: (item: any) => void;
  dropTarget: string | null;
  setDropTarget: (target: string | null) => void;
  isDragging: boolean;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  return (
    <DragDropContext.Provider
      value={{
        draggedItem,
        setDraggedItem,
        dropTarget,
        setDropTarget,
        isDragging: !!draggedItem,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}