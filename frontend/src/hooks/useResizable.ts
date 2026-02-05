import { useState, useCallback, useRef, useEffect } from 'react';

interface ColumnWidths {
    [key: string]: number;
}

export function useResizable(initialWidths: ColumnWidths) {
    const [columnWidths, setColumnWidths] = useState<ColumnWidths>(initialWidths);
    const draggingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

    const onMouseDown = useCallback((e: React.MouseEvent, key: string) => {
        e.preventDefault();
        draggingRef.current = {
            key,
            startX: e.clientX,
            startWidth: columnWidths[key] || 100,
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [columnWidths]);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingRef.current) return;

        const { key, startX, startWidth } = draggingRef.current;
        const diff = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + diff); // Min width 50px

        setColumnWidths(prev => ({
            ...prev,
            [key]: newWidth
        }));
    }, []);

    const onMouseUp = useCallback(() => {
        draggingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }, [onMouseMove]);

    // Clean up event listeners on unmount
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    return { columnWidths, onMouseDown };
}
