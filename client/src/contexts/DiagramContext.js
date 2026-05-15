import React, { createContext, useContext, useRef, useState } from 'react';

const DiagramContext = createContext();

export const DiagramProvider = ({ children }) => {
  // We store the ReactFlow nodes/edges state separately for each mode
  // so switching tabs doesn't reset the visual layout.
  const [nodesState, setNodesState] = useState({
    "simulation": [],
    "ratio": [],
    "élément comptable": [],
    "reports": []
  });

  const [edgesState, setEdgesState] = useState({
    "simulation": [],
    "ratio": [],
    "élément comptable": [],
    "reports": []
  });

  const [sourceState, setSourceState] = useState({
    "simulation": '',
    "ratio": '',
    "élément comptable": '',
    "reports": ''
  });

  // Persistent references for drill-down logic and tracking
  const newNodesRef = useRef({ "simulation": [], "ratio": [], "élément comptable": [], "reports": [] });
  const edgesRef = useRef({ "simulation": [], "ratio": [], "élément comptable": [], "reports": [] });
  const expandedNodesRef = useRef({ 
    "simulation": new Set(), 
    "ratio": new Set(), 
    "élément comptable": new Set(),
    "reports": new Set() 
  });
  const expandedNodesArrayRef = useRef({ "simulation": [], "ratio": [], "élément comptable": [], "reports": [] });
  const lastPrentId = useRef({ "simulation": '', "ratio": '', "élément comptable": '', "reports": '' });
  const basesRef = useRef({});
  const calculResultsRef = useRef({});

  const updateNodes = (mode, newNodes) => {
    setNodesState(prev => ({ ...prev, [mode]: newNodes }));
  };

  const updateEdges = (mode, newEdges) => {
    setEdgesState(prev => ({ ...prev, [mode]: newEdges }));
  };

  const updateSource = (mode, newSource) => {
    setSourceState(prev => ({ ...prev, [mode]: newSource }));
  };

  const value = {
    nodesState,
    edgesState,
    sourceState,
    updateNodes,
    updateEdges,
    updateSource,
    newNodesRef,
    edgesRef,
    expandedNodesRef,
    expandedNodesArrayRef,
    lastPrentId,
    basesRef,
    calculResultsRef
  };

  return (
    <DiagramContext.Provider value={value}>
      {children}
    </DiagramContext.Provider>
  );
};

export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within a DiagramProvider');
  }
  return context;
};
