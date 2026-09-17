// 1. React & React Native
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

export interface SignaturePadProps {
  height?: number;
  placeholder?: string;
  onChange?: (signatureBase64: string | null) => void;
  onOK?: (signatureBase64: string) => void;
  onChangeHasSignature?: (hasSignature: boolean) => void;
  onClear?: () => void;
}

export default function SignaturePad({
  height = 200,
  placeholder = 'ให้ลูกค้าเซ็นชื่อในกรอบนี้',
  onChange,
  onOK,
  onChangeHasSignature,
  onClear,
}: SignaturePadProps) {
  const [hasSignature, setHasSignature] = useState(false);
  const containerRef = useRef<any>(null);

  // -------------------------------------------------------------
  // Web Implementation using HTML5 Canvas for ultra-smooth 60fps
  // -------------------------------------------------------------
  if (Platform.OS === 'web') {
    return (
      <WebSignaturePad
        height={height}
        placeholder={placeholder}
        onChange={onChange}
        onOK={onOK}
        onChangeHasSignature={onChangeHasSignature}
        onClear={onClear}
      />
    );
  }

  // -------------------------------------------------------------
  // Native Implementation (iOS / Android) using PanResponder + SVG
  // -------------------------------------------------------------
  return (
    <NativeSignaturePad
      height={height}
      placeholder={placeholder}
      onChange={onChange}
      onOK={onOK}
      onChangeHasSignature={onChangeHasSignature}
      onClear={onClear}
    />
  );
}

// ── Web Component ──
function WebSignaturePad({
  height,
  placeholder,
  onChange,
  onOK,
  onChangeHasSignature,
  onClear,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const hasStrokes = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes.current) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange?.(dataUrl);
    onOK?.(dataUrl);
    onChangeHasSignature?.(true);
    setHasSignature(true);
  }, [onChange, onOK, onChangeHasSignature]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    hasStrokes.current = false;
    setHasSignature(false);
    onChange?.(null);
    onChangeHasSignature?.(false);
    onClear?.();
  }, [onChange, onChangeHasSignature, onClear]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to display resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 400) * dpr;
    canvas.height = (height || 200) * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    const getPos = (e: MouseEvent | Touch) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    };

    const startDraw = (x: number, y: number) => {
      isDrawing.current = true;
      hasStrokes.current = true;
      setHasSignature(true);
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    };

    const moveDraw = (x: number, y: number) => {
      if (!isDrawing.current || !ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const endDraw = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      exportCanvas();
    };

    // Pointer events
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      startDraw(x, y);
    };
    const onMouseMove = (e: MouseEvent) => {
      const { x, y } = getPos(e);
      moveDraw(x, y);
    };
    const onMouseUp = () => endDraw();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const { x, y } = getPos(e.touches[0]);
        startDraw(x, y);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const { x, y } = getPos(e.touches[0]);
        moveDraw(x, y);
      }
    };
    const onTouchEnd = () => endDraw();

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [height, exportCanvas]);

  return (
    <View className="w-full">
      <View
        className="w-full rounded-2xl border-[1.5px] border-slate-300 border-dashed bg-white relative overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: height || 200,
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />

        {!hasSignature && (
          <View className="absolute inset-0 justify-center items-center" pointerEvents="none">
            <Ionicons name="pencil-outline" size={24} color="#94a3b8" />
            <Text className="text-[14px] text-slate-400 mt-1 font-medium">{placeholder}</Text>
          </View>
        )}

        {hasSignature && (
          <TouchableOpacity
            className="absolute top-2.5 right-2.5 bg-red-50 border border-red-300 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={13} color="#DC2626" />
            <Text className="text-[11px] text-red-600 font-bold">ล้างลายเซ็น</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Native Component ──
function NativeSignaturePad({
  height = 200,
  placeholder,
  onChange,
  onOK,
  onChangeHasSignature,
  onClear,
}: SignaturePadProps) {
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [layoutWidth, setLayoutWidth] = useState(350);

  const pointsToSvgPath = (points: Point[]) => {
    if (points.length === 0) return '';
    return points.reduce(
      (acc, pt, index) =>
        index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
      ''
    );
  };

  const exportSvgData = (allPts: Point[][]) => {
    if (allPts.length === 0) return;
    const pathStrings = allPts.map(pointsToSvgPath).filter(Boolean);
    const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="${layoutWidth}" height="${height}" viewBox="0 0 ${layoutWidth} ${height}">${pathStrings
      .map(
        (d) =>
          `<path d="${d}" stroke="#0F172A" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
      )
      .join('')}</svg>`;
    const base64 = `data:image/svg+xml;utf8,${encodeURIComponent(svgXml)}`;
    onChange?.(base64);
    onOK?.(base64);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setCurrentPath((prev) => {
          if (prev.length > 0) {
            const nextPaths = [...paths, prev];
            setPaths(nextPaths);
            onChangeHasSignature?.(true);
            exportSvgData(nextPaths);
          }
          return [];
        });
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
    onChangeHasSignature?.(false);
    onChange?.(null);
    onClear?.();
  };

  const allPathsData = [
    ...paths.map(pointsToSvgPath),
    pointsToSvgPath(currentPath),
  ].filter(Boolean);

  const hasSignature = allPathsData.length > 0;

  return (
    <View className="w-full">
      <View
        className="w-full rounded-2xl border-[1.5px] border-slate-300 border-dashed bg-white relative overflow-hidden"
        style={{ height }}
        onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width || 350)}
        {...panResponder.panHandlers}
      >
        <Svg style={StyleSheet.absoluteFill}>
          {allPathsData.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke="#0F172A"
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>

        {!hasSignature && (
          <View className="absolute inset-0 justify-center items-center" pointerEvents="none">
            <Ionicons name="pencil-outline" size={24} color="#94a3b8" />
            <Text className="text-[14px] text-slate-400 mt-1 font-medium">{placeholder}</Text>
          </View>
        )}

        {hasSignature && (
          <TouchableOpacity
            className="absolute top-2.5 right-2.5 bg-red-50 border border-red-300 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={13} color="#DC2626" />
            <Text className="text-[11px] text-red-600 font-bold">ล้างลายเซ็น</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
