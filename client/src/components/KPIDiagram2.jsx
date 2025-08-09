import React, { useCallback, useEffect, useMemo, useRef, useState , memo} from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useReactFlow, 
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import ReactDOM from 'react-dom';
import numeral from "numeral";

// CustomNode component
// import { motion, AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import './KPIDiagram.css'

const HoverNode = ({ data }) => (

  <div className="tooltip-box ">
   {/* <div className="font-semibold text-amber-400 mb-1">nodeID: {data.id}</div> */}
    <div className="text-white mb-3 "><span className="font-semibold text-amber-300">Interprétation</span> : {data.interpretation}</div>
    <div className="text-white mb-3"><span className="font-semibold text-amber-300">Recommandations</span> : {data.recommandations}</div>
    <div className="text-white"><span className="font-semibold text-amber-300">Exemple</span> : {data.example}</div>
  </div>
);


const CollapsibleField = ({ label, value, isLast, singleInLastRow }) => {
  const isReactNode = React.isValidElement(value);

  const isObject = value && typeof value === "object" && !isReactNode;
  if(isReactNode && value.props.children[1].includes("undefined"))
    return
  if (value === undefined || value === null) return;
  return (
    <div className={`mb-2 ${!isLast && !singleInLastRow ? "border-r" : ""} border-gray-300`}>
      <div
        className="flex items-center justify-between cursor-pointer text-xs font-bold text-blue-600"
      >
        <span>{label}:</span>
      </div>

      {isReactNode && (
        <div className="text-xs text-gray-800 break-words mt-1">
          {value}
        </div>
      )}

      {!isReactNode && !isObject && (
        <div className="text-xs text-gray-800 break-words mt-1">{String(value)}</div>
      )}

    </div>
  );
};


// --- Custom node ---
const CustomNode = memo(({ data , setSource}) => {
  const [Clicked, setClicked] = useState(false);
  // const infoRef = useRef(null);

  const fields = [
    { label: 'Item', value: data.eleType },
    ...(data.eleType === "Rasio" ? [{ label: 'Typeologie', value: data.typology }] : []),
    ...(data.eleType === "Rasio" ? [{ label: 'Famille du Rasio', value: data.category }] : []),
    { label: 'Solde Value', value: numeral(data.SoldeValue).format("0,0.[000,000]") },
    { label: 'Rapports contenant item', value: data.Reports },
    { label: 'Méthode de calcul', value: data.method },
    {
      label: 'Designation',
      value: (
        <>
          <span className="font-semibold">{data.nameFr}</span>
          {` : ${data.signification}`}
        </>
      )
    }
  ];

  
return (
  <motion.div
    // onMouseEnter={() => setClicked(true)}
    onMouseLeave={() => setClicked(false)}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.2 }}
    className={`relative ${data.Type === "Source" ? "w-[250px]" : "w-[900px] grid grid-cols-3 gap-2"} bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans `}
  >
    {data.Type === "Source" && (<select onChange={(e) => setSource(e.target.value)}>
      {['Rind', 'Rges', 'Rliq', 'Rend', 'Rsol', 'Rren'].map(key => 
          // <div key={key}>
            <option key={key} value={key}>{key}</option>)}

            {/* </div>)} */}
    </select>)}
    <Handle type="target" position={Position.Left} className="opacity-0" />

    {/* Tooltip */}
    <div className={`absolute ${data.eleType === "Rasio" ? " bg-orange-300" : " bg-blue-300"} -top-[0.9rem]  right-1/2 w-20 text-xl font-bold rounded text-center transform  -translate-y-1/2 translate-x-1/2`}> {data.parentId}</div>
    {data.interpretation && data.recommandations && data.example &&(<button className='absolute  right-2 top-2 bg-yellow-100 text-yellow-700 w-10 rounded h-6 text-center' onClick={()=> setClicked(true)}>info</button>)}
    {Clicked && (
      <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
        <HoverNode data={data} />
        <div className="tooltip-arrow" />
      </div>
    )}

      {!data.Type && (fields.map((field, idx) => {
          const isLast = idx === fields.length - 1;
          const singleInLastRow = fields.length % 3 === 1 && isLast;

          return (
            <div key={idx} className={singleInLastRow ? "col-span-3" : ""}>
              <CollapsibleField label={field.label} value={field.value} isLast={(idx + 1) % 3 === 0} singleInLastRow={singleInLastRow}/>
            </div>
          );
        }))}
      <div className="text-base text-gray-700">{data.label}</div>
      {data.eleType !== "Rasio" && (<div className={`absolute ${data.sign === '+' ? 'bg-green-300' : 'bg-red-300'}  top-1/2 left-[-1.5rem] w-6 rounded-full text-center transform -translate-y-1/2`}>{data.sign}</div>)}
      {data.hasChildren && (
        <button
          onClick={data.onDrill}
          className="absolute bottom-2 right-2 text-sm bg-indigo-100 text-indigo-700 rounded px-2 py-0.5"
        >
          {data.expanded ? "−" : `${data.childrenNum} +`}
        </button>
      )}

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </motion.div>
  );
});

const defaultEdgeOptions = {
  // animated: true,
  type: 'smoothstep',
};

const KPIDiagram = () => {
  const [Source, setSource] = useState('Rind');
  const [level, setLevel] = useState(0);
  const newNodesRef = useRef([]);
  const edgesRef = useRef([]);
  const expandedNodesRef = useRef(new Set()); // Track expanded nodes
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null); 

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({
      customNode: (props) => <CustomNode {...props} setSource={setSource} />
    }),
    [setSource]
  );


  // useEffect( ()=>{
    
  //     const saveToDb = async ()=>{
  //       try{
  //         const result = await axios.get(`http://localhost:8000/api/data2/`);
  //         console.log(result);
  //       }
  //       catch (error)
  //       {
  //         console.log(error);
  //       }
  //     } 
  //     saveToDb();
   
  // }, [])
  const fetchNode = async (nodeId) => {
    try {
      // if(node)
      const res = await axios.get(`http://localhost:8000/api/node2/${nodeId}`);
      return res.data.node;
    } catch (error) {
      console.error('Error fetching node:', error);
      return null;
    }
  };
  const removeDescendants = (parentId) => {
    const toRemove = new Set();
    
    const stack = [parentId];
    
    while (stack.length > 0) {
      const current = stack.pop();
    
      const children = edgesRef.current
      .filter(e => e.source === current)
      .map(e => e.target);
      
      for (const childId of children) {
        let otherParents = edgesRef.current.filter(
          e => e.target === childId && e.source !== current
        );
        otherParents = otherParents.filter(par =>{
          let source = par.source;
          while(true)
          {
            const parentEdge = edgesRef.current.find(e => e.target === source);
            if(!parentEdge)
              return true;
            source = parentEdge.source;
            if(source === current)
                return false;
          }
        })
        if (otherParents.length === 0) {
          stack.push(childId);
          toRemove.add(childId);
        }
        
      }
    }
    newNodesRef.current = newNodesRef.current.filter(n => !toRemove.has(n.id));
    edgesRef.current = edgesRef.current.filter(
      e => !toRemove.has(e.source) && !toRemove.has(e.target)
    );
  
    expandedNodesRef.current.delete(parentId);

    newNodesRef.current = newNodesRef.current.map(n =>
      n.id === parentId ? { ...n, data: { ...n.data, expanded: false } } : n
    );
  };

  const computeBounds = (nodes) => {
    if (nodes.length === 0) return null;
    let minX = nodes[0].position.x;
    let minY = nodes[0].position.y;
    let maxX = nodes[0].position.x;
    let maxY = nodes[0].position.y;

    nodes.forEach(({ position, style }) => {
      const width = (style?.width ?? 180); 
      const height = (style?.height ?? 1000); 

      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + width);
      maxY = Math.max(maxY, position.y + height);
    });

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  
  const handleDrill = useCallback(
    async (nodeId, isRoot = false) => {
      const isExpanded = expandedNodesRef.current.has(nodeId);
  
      if (isExpanded) {
        removeDescendants(nodeId);
        setNodes(newNodesRef.current);
        setEdges(edgesRef.current);
        return;
      }
  
      const node = await fetchNode(nodeId);
      if (!node || !node.childrenData) return;
  
      // const reportName = node.reportName;
      const nextLevel = level + 1;
      const entries = Object.entries(node.childrenData);
      const totalChildren = entries.length;
  
      const parentNode = newNodesRef.current.find((n) => n.id === nodeId);
      const baseX = isRoot ? parentNode?.position?.x + 400 : parentNode?.position?.x + 1000;
      const verticalSpacing = 300;

      let startY = 0;
      function hashString(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
          hash = hash & 0xffffffff; // force to 32-bit integer
        }
        return hash >>> 0; // force unsigned
      }
      
      function generateColorFromId(id, index) {
        const saltedId = index + '-' + id; // add index to create more spread
        const hash = hashString(saltedId);
        const scrambled = (hash * 2654435761) >>> 0;
        const rawHue = scrambled % 360;
        
        const step = 30;
        const hue = Math.round(rawHue / step) * step;
        
        return `hsl(${hue}, 70%, 60%)`;
      }
      
      
      
      
      function groupBounds(yStart) {
        const firstChildY = yStart;
        const lastChildY = yStart + (totalChildren - 1) * verticalSpacing;
        const nodeHeight = 200;
        return { top: firstChildY, bottom: lastChildY + nodeHeight };
      }

      const existingNodes = newNodesRef.current;
      function isOverlapping(yStart, yEnd) {
        return existingNodes.some(({ position, style }) => {
          const nodeHeight = style?.height ?? 80;
          const nodeYStart = position.y;
          const nodeYEnd = nodeYStart + nodeHeight;
          return !(yEnd < nodeYStart || yStart > nodeYEnd);
        });
      }
  
      let yOffset = 0;
      while (isOverlapping(groupBounds(startY + yOffset).top, groupBounds(startY + yOffset).bottom)) {
        yOffset += verticalSpacing;
      }
      startY += yOffset;
  
      entries.forEach(([childId, childLabel], index) => {
        const childY = startY + index * verticalSpacing;
  
        edgesRef.current.push({
          id: `e-${nodeId}-${childId}`,
          source: nodeId,
          sourceHandle: 'a',
          target: childId,
          targetHandle: 'a',
          style: {
            stroke: generateColorFromId(nodeId),
            strokeWidth: 2,
          },
        });
        // console.log(root)
        
        newNodesRef.current.push({
          id: childId,
          type: 'customNode',
          position: { x: baseX, y: childY },
          data: {
            // label: childLabel.label,
            id: childId,
            // reportName: reportName,
            ...childLabel,
            sign : childLabel.childSign,
            expanded: false,
            onDrill: () => handleDrill(childId),
          },
        });
      });
  
      expandedNodesRef.current.add(nodeId);
      newNodesRef.current = newNodesRef.current.map(n =>
        n.id === nodeId
          ? {
              ...n,
              data: { ...n.data, expanded: true },
            }
          : n
      );

      const uniqueNodes = Array.from(new Map(newNodesRef.current.map((n) => [n.id, n])).values());
      const uniqueEdges = Array.from(new Map(edgesRef.current.map((e) => [e.id, e])).values());
  
      setNodes(uniqueNodes);
      setEdges(uniqueEdges);
      setLevel(nextLevel);
  
      const subtreeNodeIds = [nodeId, ...entries.map(([childId]) => childId)];
      const subtreeNodes = newNodesRef.current.filter(n => subtreeNodeIds.includes(n.id));
      const bounds = computeBounds(subtreeNodes);
  
      if (bounds && reactFlowInstance.current) {
        reactFlowInstance.current.fitBounds(bounds, {
          padding: 0.4,
          maxZoom: 1.5,
        });
      }
    },
    [level, reactFlowInstance]
  );
  
  const onInit = useCallback((rfi) => {
    reactFlowInstance.current = rfi;
  }, []);

  const fitViewWithDelay = () => {
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
    }, 100);
  };

  useEffect(() => {
    const loadRoot = async () => {
      setEdges([]);
      newNodesRef.current = [];
      const root = await fetchNode(Source);
      if (!root) return;

      const rootId = root.parentId || 'Rind';
      newNodesRef.current.push({
        id: rootId,
        type: 'customNode',
        position: { x: 500, y: 50 },
        data: {
          label: root.nameFr || 'Root Node',
          id: rootId,
          hasChildren: true,
          Type : root.eleType,
          childrenNum : Object.entries(root.childrenData).length,
          expanded: false,
          onDrill: () => handleDrill(rootId, true),
        },
      });

      setNodes(newNodesRef.current);
    };
    loadRoot();
  }, [Source]);

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        onInit={onInit}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default KPIDiagram;
