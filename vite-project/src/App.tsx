import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Text } from "react-konva";
import useImage from "use-image";
import Konva from "konva";

// --- TYPES ---
interface ImageElement {
  id: string;
  type: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}
interface TextElement {
  id: string;
  type: "text";
  text: string;
  fontSize: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}
type ElementType = ImageElement | TextElement;

interface ZoneDef { x: number; y: number; width: number; height: number; }

function BackgroundImage({ src }: { src: string }) {
  const [image] = useImage(src);
  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={800}
      height={400}
      listening={false}
    />
  );
}

function UploadedImage({ shapeProps, isSelected, onSelect, onChange, bounds }: {
  shapeProps: ImageElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: ImageElement) => void;
  bounds: ZoneDef;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(shapeProps.src);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={image}
        ref={shapeRef}
        {...shapeProps}
        id={shapeProps.id}
        draggable
        dragBoundFunc={(pos) => {
          const { x, y } = pos;
          if (!shapeRef.current) return pos;
          const width = shapeRef.current.width() * shapeRef.current.scaleX();
          const height = shapeRef.current.height() * shapeRef.current.scaleY();
          const newX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - width, x));
          const newY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - height, y));
          return { x: newX, y: newY };
        }}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
}

function CanvasText({ shapeProps, isSelected, onSelect, onChange, bounds }: {
  shapeProps: TextElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: TextElement) => void;
  bounds: ZoneDef;
}) {
  const shapeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        {...shapeProps}
        id={shapeProps.id}
        draggable
        dragBoundFunc={(pos) => {
          // rook raha he us k andar rakhrrha he 
          const { x, y } = pos;
          if (!shapeRef.current) return pos;
          const width = shapeRef.current.width();
          const height = shapeRef.current.height();
          const newX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - width, x));
          const newY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - height, y));
          return { x: newX, y: newY };
        }}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
}

export default function ImageCanvasKonva() {
  const [elements, setElements] = useState<ElementType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<'A'|'B'|'C'>("A");

  // --- START: JSON Load/Save state ---
  const [jsonInput, setJsonInput] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        setElements(parsed);
        setCopyStatus("");
      } else {
        setCopyStatus("Error: JSON must be an array.");
      }
    } catch (e) {
      setCopyStatus("Error: Invalid JSON");
    }
  };
  const handleSaveJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(elements, null, 2));
      setCopyStatus("Copied to clipboard!");
      setTimeout(()=>setCopyStatus(""), 2000);
    } catch (e){
      setCopyStatus("Error copying");
    }
  };
  // --- END: JSON Load/Save state ---

  const zones: { [key in 'A'|'B'|'C']: ZoneDef } = {
    A: { x: 50, y: 50, width: 200, height: 150 },
    B: { x: 300, y: 50, width: 200, height: 150 },
    C: { x: 550, y: 50, width: 200, height: 150 },
  };

  const bounds = zones[selectedZone];

  // --- LAYERS REORDER FUNCTIONS ---
  const moveLayer = (idx: number, dir: 'up' | 'down') => {
    setElements((prev) => {
      const newArr = prev.slice();
      const targetIdx = dir === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newArr.length) return newArr;
      const temp = newArr[targetIdx];
      newArr[targetIdx] = newArr[idx];
      newArr[idx] = temp;
      return newArr;
    });
  };

  // Static image URLs
  const staticImages = [
    {
      url: "https://dummyimage.com/600x400/000/fff",
      label: "Black bg",
    },
    {
      url: "https://dummyimage.com/600x400/f00/fff",
      label: "Red bg",
    },
    {
      url: "https://dummyimage.com/600x400/00f/fff",
      label: "Blue bg",
    },
  ];

  // Handler to add static image
  const handleAddStaticImage = (url: string) => {
    setElements((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "image",
        src: url,
        x: bounds.x + 20,
        y: bounds.y + 20,
        width: 100,
        height: 100,
      },
    ]);
  };

  // Add text handler remains
  const handleTextAdd = () => {
    const text = prompt("Enter your text:");
    if (text)
      setElements((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "text",
          text,
          fontSize: 20,
          x: bounds.x + 30,
          y: bounds.y + 30,
          width: 150,
          height: 30,
        },
      ]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
      {/* JSON load/save panel */}
      <div style={{width:820,marginBottom:14,padding:8,background:'#1e1e23',borderRadius:8,boxShadow:'0 2px 8px rgba(0,0,0,0.08)', color:'#eee',display:'flex',gap:10,alignItems:'flex-start'}}>
        <textarea
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          placeholder="Paste design JSON here..."
          style={{width:360,height:56,resize:'none',fontSize:13,fontFamily:'monospace',borderRadius:5,padding:6,border:'1px solid #333',background:'#191922',color:'#fff'}}
        />
        <button onClick={handleLoadJson} style={{background:'#3998ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 20px',fontWeight:'bold',height:56,cursor:'pointer'}}>Load</button>
        <button onClick={handleSaveJson} style={{background:'#1cc88a',color:'#fff',border:'none',borderRadius:6,padding:'10px 20px',fontWeight:'bold',height:56,cursor:'pointer'}}>Save & Copy JSON</button>
        <div style={{marginLeft:10,alignSelf:'center',color: copyStatus.startsWith('Error') ? '#f66' : '#6f6',fontWeight:'bold'}}> {copyStatus} </div>
      </div>
      {/* Main Panel */}
      <div>
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setSelectedZone("A")}>Position A</button>
          <button onClick={() => setSelectedZone("B")}>Position B</button>
          <button onClick={() => setSelectedZone("C")}>Position C</button>
        </div>
        {/* Static image buttons */}
        <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
          {staticImages.map(img => (
            <button
              key={img.url}
              onClick={() => handleAddStaticImage(img.url)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: 6, padding: 4, minWidth: 60, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontSize: 11
              }}
              title={img.label}
            >
              <img src={img.url} alt={img.label} style={{ width: 38, height: 25, objectFit: 'cover', borderRadius: 3, marginBottom: 2 }} />
              {img.label}
            </button>
          ))}
          <button onClick={handleTextAdd} style={{ background: '#3998ff', color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', fontWeight: 'bold', marginLeft: 10, cursor: 'pointer' }}>Add Text</button>
        </div>
        {/* Upload input removed */}
        <div
          style={{
            margin: "0 auto",
            border: "1px solid #ccc",
            width: 800,
            height: 400,
            background: "#fafafa",
          }}
        >
          <Stage
            width={800}
            height={400}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              <BackgroundImage src="https://dummyimage.com/600x400/red/fff&text=tehu" />
              {Object.entries(zones).map(([key, z]) => (
                <Rect
                  key={key}
                  {...z}
                  stroke={selectedZone === key ? "blue" : "gray"}
                  dash={[5, 5]}
                />
              ))}
              {elements.map((el, i) => {
                const commonProps = {
                  key: el.id,
                  shapeProps: el as any,
                  isSelected: el.id === selectedId,
                  onSelect: () => setSelectedId(el.id),
                  onChange: (newAttrs: ElementType) => {
                    const updated = elements.slice();
                    updated[i] = newAttrs;
                    setElements(updated);
                  },
                  bounds,
                };
                return el.type === "image" ? (
                  <UploadedImage {...commonProps} />
                  // <>  </>
                ) : (
                  <CanvasText {...commonProps} />
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>
      {/* Layers Panel remains unchanged */}
      <div style={{
        width: 220,
        marginLeft: 30,
        padding: 16,
        background: "#18181c",
        borderRadius: 10,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
        color: "#eee",
        fontFamily: 'sans-serif',
        minHeight: 420
      }}>
        <div style={{fontWeight:'bold', marginBottom: 10, fontSize:18}}>Layers</div>
        {elements.length === 0 ? (
          <div style={{color:'#999'}}>No layers</div>
        ) : (
          elements.map((el, idx) => (
            <div
              key={el.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 10,
                background: el.id === selectedId ? '#24242b' : 'transparent',
                borderRadius: 6,
                cursor: 'pointer',
                border: el.id === selectedId ? '1px solid #3998ff' : '1px solid transparent',
                padding: '5px 10px'
              }}
              onClick={() => setSelectedId(el.id)}
            >
              {el.type === "image" ? (
                <div style={{width:24,height:24,background:'#111',borderRadius:4,marginRight:10,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  <img src={(el as ImageElement).src} alt="img" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                </div>
              ) : (
                <div style={{width:24,height:24,background:'#222',borderRadius:4,marginRight:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#eee',fontWeight:'bold',fontSize:14}}>
                  T
                </div>
              )}
              <div style={{ flexGrow:1, fontWeight:el.id === selectedId? 'bold':'normal',fontSize: 15 }}>
                {el.type === "image" ? "Image" : "Text"} #{el.id}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:2,marginLeft:6}}>
                <button
                  onClick={e => { e.stopPropagation(); moveLayer(idx, "up"); }}
                  disabled={idx === 0}
                  style={{opacity: idx===0?0.4:1,background:'#232340',border:'none',borderRadius:3,color:'#fff',height:18,width:18,cursor:idx===0?'not-allowed':'pointer',marginBottom:2,fontSize:10}}
                  title="Move up"
                >▲</button>
                <button
                  onClick={e => { e.stopPropagation(); moveLayer(idx, "down"); }}
                  disabled={idx === elements.length-1}
                  style={{opacity: idx===elements.length-1?0.4:1,background:'#232340',border:'none',borderRadius:3,color:'#fff',height:18,width:18,cursor:idx===elements.length-1?'not-allowed':'pointer',fontSize:10}}
                  title="Move down"
                >▼</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
