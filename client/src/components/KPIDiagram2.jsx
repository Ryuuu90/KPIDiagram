import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
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
import { Pencil } from "lucide-react";
import axios from 'axios';
import { motion } from 'framer-motion';
import './KPIDiagram.css'
import Elements from './Elements';
import finansiaLogo from '../public/finansia-logo.jpeg';



const URL = process.env.REACT_APP_BACKEND_URL;

// Mock axios for demo purposes
const HoverNode = ({ data }) => (
  <div className={`tooltip-box ${data.eleType === 'EC' ? "bg-blue-600" : "bg-orange-600"}` }>
   {/* <div className="font-semibold text-amber-400 mb-1">nodeID: {data.id}</div> */}
    <div className="text-white mb-3 "><span className={`font-semibold ${data.eleType === 'EC' ? " text-amber-400" : " text-amber-200"}`}>Interprétation</span> : {data.interpretation}</div>
    <div className="text-white mb-3"><span className={`font-semibold ${data.eleType === 'EC' ? " text-amber-400" : " text-amber-200"}`}>Recommandations</span> : {data.recommandations}</div>
    <div className="text-white"><span className={`font-semibold ${data.eleType === 'EC' ? " text-amber-400" : " text-amber-200"}`}>Exemple</span> : {data.example}</div>
  </div>
);

const CollapsibleField = ({ label, value, isFirst, modulType, category, newSold}) => {
  const isReactNode = React.isValidElement(value);

  const isObject = value && typeof value === "object" && !isReactNode;
  if(isReactNode && value.props.children[1].includes("undefined"))
    return
  if (value === undefined || value === null) return;
  return (
    <div className={`mb-2 ${isFirst ? "border-r pr-2 mr-3" : ""} border-gray-300`}>
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
      {!isReactNode && !isObject && label !== "Valeur du solde" && label !== "Nouveau solde" && label !== "Écart du solde" && (
        <div className="text-xs text-gray-800 break-words mt-1">{String(value)}</div>
      )}
       {!isReactNode && !isObject && (label === "Valeur du solde" || label === "Nouveau solde" || label === "Écart du solde" )&& (
        <div className="text-xs font-extrabold text-black break-words mt-1">{String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</div>
      )}

    </div>
  );
};

const SimulationCard = memo(({ data, basesRef, modulType}) => {
  const [Clicked, setClicked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  const [editingSold, setEditingSold] = useState(false)
  const [value, setValue] = useState("-");
  const inputRef = useRef(null);
  
  const handleSave = () => {
    console.log(inputRef.current.value)
    if (inputRef.current) {
      const val = inputRef.current.value;
      if(val.length > 12)
        return;
      basesRef.current[data.parentId] = val;
      setEditing(false)
      setEditingSold(true)
      setValue(val);
    }
  };

  const fields = [
    {
      label: 'Designation',
      value: data.nameFr
    },
    { label: 'Valeur du solde', value: data.SoldeValue,},
    {label : 'Nouveau solde', value: data.newSold !== null ? data.newSold : '-'}
  ];


const getFiltredItemms = () =>
{

  if(!query)
    return [];
  return Elements.filter(elem => elem.nameFr.toLowerCase().includes(query.toLowerCase()));
}

const filteredData = getFiltredItemms();
// console.log(filteredData);

const handleInputFocus = (e) =>{

  if(e.code === 'Enter')
  {
    const source = Elements.find(elem => elem.nameFr.toLowerCase() === query.toLowerCase());
    if(!source)
      return;
    else
    {
      console.log(source.id);
      data.setSource(source.id);
    }
  }
}

return (
  <motion.div
    onMouseLeave={() => setClicked(false)}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.2 }}
    className={`relative ${data.eleType === "Source" ? "w-[250px] grid grid-cols-1" : "w-[300px] grid grid-cols-2" }  bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans `}
  >
    {data.isRoot && (
        <div className={` ${data.eleType === 'Source' ? "relative" : "absolute w-[18.7rem] -top-[3.67rem]"} z-10`}>
          <input 
            type='text' 
            className='w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
            value={query}
            onChange={(e) => {setQuery(e.target.value)}}
            placeholder="Search elements"
            onKeyDown={handleInputFocus}
          />
          {filteredData.length > 0 && (
            <ul 
              className='search-dropdown'
            >
              {filteredData.map((val, i) => (
                <li 
                  key={val.nameFr + i}
                  className='px-3 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 cursor-pointer transition-colors duration-150 text-gray-800'
                onClick={()=> data.setSource(val.id)}>
                  {val.nameFr}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    {/* {data.Type === "Source" && (<select className='w-14' value={data.Source} onChange={(e) => {data.setSource(e.target.value)}}>
      {['Rind', 'Rges', 'Rliq', 'Rend', 'Rsol', 'Rren'].map(key => 
            <option key={key} value={key}>{key}</option>)}
    </select>)} */}
    <Handle type="target" position={Position.Left} className="opacity-0" />

    {data.eleType !== "Source" && (<div className={`absolute ${data.eleType === "Ratio" ? " bg-orange-300" : " bg-blue-300"} -top-[0.9rem]  right-1/2 w-full text-xl font-bold rounded text-center transform  -translate-y-1/2 translate-x-1/2`}> {data.parentId}</div>)}
    {data.eleType !== "Source" && data.interpretation && data.recommandations && data.example &&(<button className='absolute  right-2 top-2 bg-yellow-100 text-yellow-700 w-10 rounded h-6 text-center' onClick={()=> setClicked(true)}>info</button>)}
    {Clicked && (
      <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
        <HoverNode data={data} />
        <div className="tooltip-arrow" />
      </div>
    )}

      {data.eleType !== "Source"  && (fields.map((field, idx) => {
        if(field.label !== "Nouveau solde")
          return(<div key={idx}>
              <CollapsibleField label={field.label} value={field.value} isFirst={idx === 0} modulType={modulType} category={data.category} newSold={data.newSold}/>
        </div>)
        }))}
        {data.eleType !== "Source" && (<CollapsibleField label={"Var du solde"} value={((fields[2].value / fields[1].value) - 1).toFixed(3) !== 'NaN' && fields[1].value !== 0? Number((((fields[2].value / fields[1].value) - 1).toFixed(3)) * 100).toString() + '%': "-"} isFirst={true} modulType={modulType} category={data.category} newSold={data.newSold}/>)}
            
            {editing && data.category === "Elément de base" ? (
             <div className="flex flex-col cursor-pointer text-xs font-bold text-blue-600">
             <span>Nouveau solde:</span>
             <input
               type="number"
               defaultValue=""
               ref={inputRef}
               onBlur={handleSave}
               onKeyDown={(e) => e.key === "Enter" && handleSave()}
               className="w-24 mt-1 text-xs text-gray-800 border border-gray-300 rounded px-1"
               autoFocus
             />
           </div>
            ) : (
              <>
             <div className="flex flex-col cursor-pointer text-xs font-bold text-blue-600">
                {data.eleType !== "Source" && (<CollapsibleField label={fields[2].label} value={data.category === "Elément de base" && (data.newSold === null ||  editingSold)? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : fields[2].value} isFirst={false} modulType={modulType} category={data.category} newSold={data.newSold}/>)}
                {data.category === "Elément de base" && (<button onClick={() => {setEditing(true)}}>
                  <Pencil size={14} className="absolute bottom-11 right-10 text-gray-500 hover:text-gray-700" />
                </button>)}
                </div>
              </>
            )}
      
      {data.eleType === "Source"  && (<div className="text-base text-gray-700">{data.label}</div>)}
      {/* {data.eleType !== "Ratio" && (<div className={`absolute ${data.sign === '+' ? 'bg-green-300' : 'bg-red-300'}  top-1/2 left-[-1.5rem] w-6 rounded-full text-center transform -translate-y-1/2`}>{data.sign}</div>)} */}
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

const CustomNode = memo(({ data, basesRef, modulType}) => {
  const [Clicked, setClicked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const SourceArrays = {"ratio" : ['Rind', 'Rges', 'Rliq', 'Rend', 'Rsol', 'Rren'] , "élément comptable" : ['ECBA', 'ECBP', 'ECPC', 'ESG']};

  const fields = [
    {
      label: 'Designation',
      value: (
        <>
          <span className="font-semibold">{data.nameFr}</span>
          {` : ${data.signification}`}
        </>
      )
    },
    { label: 'Méthode de calcul', value: data.method },
    { label: 'Rapports contenant item', value: data.Reports },
    { label: 'Valeur du solde', value: String(data.SoldeValue).replace(/\B(?=(\d{3})+(?!\d))/g, "."),}
  ];

  
return (
  <motion.div
    onMouseLeave={() => setClicked(false)}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.2 }}
    className={`relative ${data.eleType === "Source" ? "w-[250px]" : "w-[520px] grid grid-cols-2 "} bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans `}
  >
    {data.eleType === "Source" && (<select value={data.Source} onChange={(e) => {data.setSource(e.target.value)}}>
      {SourceArrays[modulType].map(key => 
            <option key={key} value={key}>{key}</option>)}
    </select>)}
    <Handle type="target" position={Position.Left} className="opacity-0" />

    <div className={`absolute ${data.eleType === "Ratio" ? " bg-orange-300" : " bg-blue-300"} -top-[0.9rem]  right-1/2 w-20 text-xl font-bold rounded text-center transform  -translate-y-1/2 translate-x-1/2`}> {data.parentId}</div>
    {data.eleType !== "Source" && data.interpretation  && data.recommandations && data.example &&(<button className='absolute  right-2 top-2 bg-yellow-100 text-yellow-700 w-10 rounded h-6 text-center' onClick={()=> setClicked(true)}>info</button>)}
    {Clicked && (
      <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
        <HoverNode data={data} />
        <div className="tooltip-arrow" />
      </div>
    )}

      {data.eleType !== "Source" && (fields.map((field, idx) => {
          const isLast = idx === fields.length - 1;

          return (
            <div key={idx} className={idx === 0 && fields[1]?.value?.length < 2 * fields[0]?.value?.props?.children[1]?.length / 3 ? "row-span-3" : ""}>
              <CollapsibleField label={field.label} value={field.value} isFirst={idx === 0} modulType={modulType} category={data.category} newSold={data.newSold}/>
            </div>
          );
        }))}
     
      <div className="text-base text-gray-700">{data.label}</div>
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
  type: 'smoothstep',
  style: { strokeWidth: 2 }
};

const KPIDiagram = () => {
  const [Source, setSource] = useState('Rind');
  const [level, setLevel] = useState(0);
  const newNodesRef = useRef([]);
  const edgesRef = useRef([]);
  const expandedNodesRef = useRef(new Set());
  // NEW: Add expanded nodes array to track and send to API
  const expandedNodesArrayRef = useRef([]);
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);
  const basesRef = useRef({});
  const chilLimit = useRef('');
  const [loading, setLoading] = useState(false);
  const [modulType, setModelType] = useState("simulation");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({
    customNode: (props) => {
      if (modulType === "simulation") {
        return <SimulationCard {...props} basesRef={basesRef} modulType={modulType} />;
      } else {
        return <CustomNode {...props} basesRef={basesRef} modulType={modulType} />;
      }
    }
  }), [basesRef, modulType]);

  //  useEffect( ()=>{
    
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
  // Enhanced tree layout positioning algorithm
  const calculateTreeLayout = useCallback(() => {
    const nodeMap = new Map(newNodesRef.current.map(node => [node.id, node]));
    const visitedNodes = new Set();
    const horizontalSpacing = modulType !== "simulation" ? 700 : 500;
    const verticalSpacing = modulType !== "simulation" ? 350 : 250;

    const positionSubtree = (nodeId, x, y, level = 0) => {
      if (visitedNodes.has(nodeId)) return { width: 0, height: 0 };
      
      const node = nodeMap.get(nodeId);
      if (!node) return { width: 0, height: 0 };

      visitedNodes.add(nodeId);
      
      // Get children of this node
      const children = edgesRef.current
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target)
        .filter(childId => nodeMap.has(childId));

      if (children.length === 0) {
        // Leaf node
        node.position = { x, y };
        return { width: horizontalSpacing, height: verticalSpacing };
      }

      // Calculate positions for children
      let totalChildHeight = 0;
      const childHeights = [];
      
      // First pass: calculate how much space each child subtree needs
      for (const childId of children) {
        const childHeight = positionSubtree(childId, x + horizontalSpacing, y + totalChildHeight, level + 1);
        childHeights.push(childHeight.height);
        totalChildHeight += childHeight.height;
      }

      // Position the parent node in the center of its children
      const parentY = y + (totalChildHeight - verticalSpacing) / 2;
      node.position = { x, y: parentY };

      return { width: horizontalSpacing, height: Math.max(totalChildHeight, verticalSpacing) };
    };

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = newNodesRef.current.filter(node => 
      !edgesRef.current.some(edge => edge.target === node.id)
    );

    let currentY = 0;
    rootNodes.forEach(rootNode => {
      const subtreeSize = positionSubtree(rootNode.id, 50, currentY, 0);
      currentY += subtreeSize.height + 100; // Add spacing between root trees
    });
  }, [modulType]);

  // Enhanced camera positioning function
  const focusOnNodeAndChildren = useCallback((parentNodeId) => {
    if (!reactFlowInstance.current) return;

    const parentNode = newNodesRef.current.find(n => n.id === parentNodeId);
    if (!parentNode) return;

    // Get all children nodes
    const childrenIds = edgesRef.current
      .filter(edge => edge.source === parentNodeId)
      .map(edge => edge.target);
    
    const childrenNodes = newNodesRef.current.filter(n => childrenIds.includes(n.id));
    const allNodes = [parentNode, ...childrenNodes];

    if (allNodes.length === 0) return;

    // Calculate bounding box of parent and all children
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    allNodes.forEach(node => {
      const nodeWidth = modulType === "simulation" ? 300 : 400;
      const nodeHeight = modulType === "simulation" ? 200 : 250;
      
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add padding around the bounding box
    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Calculate the center and dimensions
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    // Get viewport dimensions
    const viewportWidth = reactFlowWrapper.current.clientWidth;
    const viewportHeight = reactFlowWrapper.current.clientHeight;

    // Calculate zoom to fit all nodes with some padding
    const zoomX = viewportWidth / width;
    const zoomY = viewportHeight / height;
    const zoom = Math.min(zoomX, zoomY, 1.5); // Cap at 1.5x zoom

    // Calculate viewport position to center the nodes
    const x = viewportWidth / 2 - centerX * zoom;
    const y = viewportHeight / 2 - centerY * zoom;

    // Animate to the new viewport
    reactFlowInstance.current.setViewport(
      { x, y, zoom },
      { duration: 800 }
    );
  }, [modulType]);

  // MODIFIED: fetchNode function to include expandedNodes
  const fetchNode = async (nodeId, modulType, basesRef, expandedNodes = []) => {
    try {
      const res = await axios.post(`${URL}/api/node2/${nodeId}`, {
        modulType: modulType, 
        basesRef: basesRef.current,
        expandedNodes: expandedNodes  // NEW: Send expanded nodes array
      });
      return res.data.node;
    } catch (error) {
      console.error('Error fetching node:', error);
      return null;
    }
  };

  const fetchCalculation = async (basesRef, expandedNodes = []) => {
    try {
      const expandedArray = expandedNodes.map(node => node.trim())
      const res = await axios.post(`${URL}/api/calculation`, {
        // modulType: modulType, 
        basesRef: basesRef.current,
        expandedNodes: expandedArray  // NEW: Send expanded nodes array
      });
      return res.data;
    } catch (error) {
      setLoading(false)
      console.error('Error fetching node:', error);
      return null;
    }
  };

  // MODIFIED: removeDescendants function to also remove from expandedNodesArrayRef
  const removeDescendants = useCallback((parentId) => {
    const toRemove = new Set();
    const stack = [parentId];
    
    while (stack.length > 0) {
      const current = stack.pop();
      const children = edgesRef.current
        .filter(e => e.source === current)
        .map(e => e.target);
      
      for (const childId of children) {
        // Check if this child has other parents that are not being removed
        const otherParents = edgesRef.current.filter(
          e => e.target === childId && e.source !== current
        );
        
        // Filter out parents that are descendants of the current removal
        const validParents = otherParents.filter(par => {
          let source = par.source;
          while (source) {
            const parentEdge = edgesRef.current.find(e => e.target === source);
            if (!parentEdge) return true;
            if (source === current || toRemove.has(source)) return false;
            source = parentEdge.source;
          }
          return true;
        });
        
        if (validParents.length === 0) {
          stack.push(childId);
          toRemove.add(childId);
        }
      }
    }
    
    // Remove nodes and edges
    newNodesRef.current = newNodesRef.current.filter(n => !toRemove.has(n.id));
    edgesRef.current = edgesRef.current.filter(
      e => !toRemove.has(e.source) && !toRemove.has(e.target)
    );

    // Update parent node state
    expandedNodesRef.current.delete(parentId);
    
    // NEW: Remove from expandedNodesArrayRef
    expandedNodesArrayRef.current = expandedNodesArrayRef.current.filter(nodeId => nodeId !== parentId);
    console.log('Updated expanded nodes array:', expandedNodesArrayRef.current);
    
    newNodesRef.current = newNodesRef.current.map(n =>
      n.id === parentId ? { ...n, data: { ...n.data, expanded: false } } : n
    );

    // Recalculate layout
    calculateTreeLayout();
  }, [calculateTreeLayout]);

  // MODIFIED: handleDrill function to include expandedNodes in fetchNode calls
  const handleDrill = useCallback(
    async (nodeId, isRoot = false, modulType, basesRef) => {
      const isExpanded = expandedNodesRef.current.has(nodeId);
      
      if (isExpanded) {
        removeDescendants(nodeId);
        setNodes([...newNodesRef.current]);
        setEdges([...edgesRef.current]);
        
        // Focus on the collapsed parent node
        setTimeout(() => {
          focusOnNodeAndChildren(nodeId);
        }, 100);
        
        return;
      }

      // NEW: Pass the current expanded nodes array to fetchNode
      
     
      const node = await fetchNode(nodeId, modulType, basesRef, expandedNodesArrayRef.current);
      if (!node || !node.childrenData || chilLimit.current.includes(node.parentId)) return;
      
      const entries = Object.entries(node.childrenData);
      
      function generateColorFromId(id) {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          hash = ((hash << 5) - hash) + id.charCodeAt(i);
          hash = hash & hash;
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 60%)`;
      }
      
      // Add children nodes and edges
      entries.forEach(([childId, childLabel], index) => {
        edgesRef.current.push({
          id: `e-${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          style: {
            stroke: generateColorFromId(nodeId),
            strokeWidth: 2,
          },
          animated: false
        });
        
        newNodesRef.current.push({
          id: childId,
          type: 'customNode',
          position: { x: 0, y: 0 }, // Will be calculated by layout
          data: {
            id: childId,
            ...childLabel,
            sign: childLabel.childSign,
            expanded: false,
            onDrill: () => handleDrill(childId, false, modulType, basesRef),
            Source,          
            setSource, 
          },
        });
      });

      expandedNodesRef.current.add(nodeId);
      // console.log(node.childrenIds);
      
      if (!expandedNodesArrayRef.current.includes(node.childrenIds)) {
        expandedNodesArrayRef.current.push(...node.childrenIds);
        console.log('Added to expanded nodes array:', nodeId);
        console.log('Current expanded nodes array:', expandedNodesArrayRef.current);
      }
      // NEW: Add to expandedNodesArrayRef if not already present
     
      newNodesRef.current = newNodesRef.current.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, expanded: true } }
          : n
      );

      // Calculate new layout
      calculateTreeLayout();

      const uniqueNodes = Array.from(new Map(newNodesRef.current.map((n) => [n.id, n])).values());
      const uniqueEdges = Array.from(new Map(edgesRef.current.map((e) => [e.id, e])).values());

      setNodes(uniqueNodes);
      setEdges(uniqueEdges);

      // Focus camera on the expanded parent and its children
      setTimeout(() => {
        focusOnNodeAndChildren(nodeId);
      }, 100);
    },
    [level, calculateTreeLayout, removeDescendants, Source, focusOnNodeAndChildren]
  );

  const onInit = useCallback((rfi) => {
    reactFlowInstance.current = rfi;
  }, []);

  // MODIFIED: simulate function to include expandedNodes
  const simulate = async () => {
    setLoading(true);
    const updatedNodes = [];
    // for (let node of newNodesRef.current) {
      const calculation = await fetchCalculation(basesRef, expandedNodesArrayRef.current);
      console.log(calculation)
      if(calculation.success)
      {
            for (let node of newNodesRef.current) {
              const newNode = await fetchNode(node.id, modulType, basesRef);
              updatedNodes.push({
                ...node,
                position: node.position,
                data: { ...node.data, ...newNode }
              });
            }
            setNodes(updatedNodes);

      }
    setLoading(false);
  };

  // MODIFIED: handleReset function to clear expandedNodesArrayRef
  const handleReset = async () => {
    try {
      await axios.get(`${URL}/api/reset/`);
      basesRef.current = {};
      expandedNodesArrayRef.current = []; // NEW: Clear expanded nodes array
      console.log('Reset - cleared expanded nodes array');
      loadRoot(true);
    } catch (error) {
      console.error(error.message);
    }
  };

  // MODIFIED: loadRoot function to clear expandedNodesArrayRef and include it in fetchNode
  const loadRoot = async (restart = false) => {
    newNodesRef.current = [];
    edgesRef.current = [];
    expandedNodesRef.current.clear();
    expandedNodesArrayRef.current = []; // NEW: Clear expanded nodes array
    setEdges([]);
    setNodes([]);
    
    const root = await fetchNode(Source, modulType, basesRef, expandedNodesArrayRef.current);
    if (!root) return;
    
    if (root.childrenLimit) {
      chilLimit.current = root.childrenLimit;
    }
    
    const rootId = root.parentId || Source;
    console.log(root);

    newNodesRef.current.push({
      id: rootId,
      type: 'customNode',
      position: { x: 50, y: 200 },
      data: {
        label: root.nameFr || 'Root Node',
        id: rootId,
        hasChildren: true,
        isRoot: true,
        childrenNum: Object.entries(root.childrenData || {}).length,
        expanded: false,
        onDrill: () => handleDrill(rootId, true, modulType, basesRef),
        Source,          
        setSource,
        ...root,
      },
    });
    
    setNodes(newNodesRef.current);
    
    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({ 
          padding: 0.4,
          includeHiddenNodes: false,
          maxZoom: 2,
          duration: restart ? 500 : 0
        });
      }, 100);
    }
  };

  useEffect(() => {
    loadRoot();
  }, [Source, modulType]);

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <img 
          src={finansiaLogo}
          // alt="FiNANZiA - decoding finance, revealing insights" 
          className="absolute h-20 object-contain"
        />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        deleteKeyCode={null} 
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        onInit={onInit}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background />
        <Controls />
        
        {/* Mode Selection Bar */}
        <div className="absolute w-[40rem] flex flex-row gap-8 justify-center translate-x-1/2 h-14 items-center z-50 rounded-lg right-1/2 bg-slate-700 shadow-lg border border-slate-500 top-4">
          {["Élément comptable", "Ratio", "Simulation"].map((label, index) => (
            <button
              key={index}
              className={`text-white px-5 py-2 rounded-md transition-all duration-200 hover:bg-slate-500 hover:scale-105 active:scale-95 ${
                modulType === label.toLowerCase() ? 'bg-slate-500' : ''
              }`}
              onClick={() => {
                setModelType(label.toLowerCase()); 
                if (label === "Élément comptable") {
                  setSource('ECBA'); 
                } else {
                  setSource('Rind'); 
                }
                if (reactFlowInstance.current) {
                  reactFlowInstance.current.setViewport({
                    x: -reactFlowWrapper.current.clientWidth / 2 + 190,
                    y: reactFlowWrapper.current.clientHeight / 2 - 182,
                    zoom: 2
                  });
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Simulation Controls */}
        {modulType === "simulation" && (
          <div className="absolute left-5 top-20 flex gap-2 z-50">
            <button 
              className='bg-blue-500 hover:bg-blue-600 w-24 h-8 text-white rounded-md transition-colors duration-200' 
              onClick={simulate}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Simulate'}
            </button>
            <button 
              className='bg-red-500 hover:bg-red-600 w-24 h-8 text-white rounded-md transition-colors duration-200' 
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        )}
     

        {/* NEW: Debug info for expanded nodes (optional - remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute left-5 bottom-5 bg-black bg-opacity-70 text-white p-3 rounded-md text-xs z-50">
            <div>Expanded Nodes: {expandedNodesArrayRef.current.length}</div>
            <div>[{expandedNodesArrayRef.current.join(', ')}]</div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
            <p className="text-white mt-4 text-lg font-medium">Chargement des éléments...</p>
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

export default KPIDiagram;