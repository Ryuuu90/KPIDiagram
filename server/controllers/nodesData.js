const Arborescence = require('../models/Arborescence2.model');
const GlobalElements = require('../models/GlobalElements.model');
const {ArborescenceCalcul} = require("../utils/utils");

exports.getNodeById = async (req, res) => {
  const { id } = req.params;
  const {modulType, basesRef, expandedNodes} = req.body;

  try {
    // Check if the user has uploaded their file
    const dataCount = await Arborescence.countDocuments({ clientId: req.dbUser._id });
    if (dataCount === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Veuillez d'abord importer votre fichier de données avant d'explorer le diagramme." 
      });
    }

    // 1. Fetch parent metadata + client value
    const [globalParent, clientParent] = await Promise.all([
      GlobalElements.findOne({ parentId: id }),
      Arborescence.findOne({ parentId: id, clientId: req.dbUser._id })
    ]);

    if (!globalParent) {
      return res.status(404).json({ success: false, message: 'Global element not found' });
    }

    // Merge helper to map Global (PascalCase) to Arborescence (camelCase)
    const mergeNode = (g, c) => {
      const global = g ? g.toObject() : {};
      const client = c ? c.toObject() : {};
      return {
        ...client,
        parentId: global.parentId || client.parentId,
        childrenIds: global.childrenIds || [],
        category: global.Category,
        formula: global.Formula,
        method: global.Method,
        typology: global.Typology,
        eleType: global.EleType,
        nameFr: global.NameFr,
        nameAn: global.NameAn,
        nameAr: global.NameAr,
        signification: global.Signification,
        interpretation: global.Interpretation,
        recommandations: global.Recommandations,
        example: global.Example,
        Reports: global.Reports,
        SoldeValue: client.SoldeValue || 0,
        newSold: client.newSold || 0,
      };
    };

    const parent = mergeNode(globalParent, clientParent);
    const childrenData = {};
    let childrenIds = [];

    if (parent.category === 'Elément calculé' || parent.eleType === 'Ratio' || parent.eleType === 'Source' || parent.category === 'Elément de base' || parent.category === 'Element de base') {
      parent.childrenIds.forEach((ele) => {
        if (ele.includes(',')) {
          ele.split(',').map(s => s.trim()).filter(s => s).forEach(part => {
            if (part === parent.parentId) return;
            childrenIds.push(part);
            if (!childrenData[part]) childrenData[part] = { childSign: '+' };
          });
        } else {
          // e.g., "EC026 + EC027 - EC046" or "+ EC088" or "EC062"
          let matches = ele.match(/[+-]?\s*[A-Za-z0-9_]+/g);
          if (matches) {
            matches.forEach(match => {
              let trimmed = match.trim();
              let sign = '+';
              if (trimmed.startsWith('+')) {
                sign = '+';
                trimmed = trimmed.substring(1).trim();
              } else if (trimmed.startsWith('-')) {
                sign = '-';
                trimmed = trimmed.substring(1).trim();
              }
              if (trimmed && trimmed !== parent.parentId) {
                childrenIds.push(trimmed);
                if (!childrenData[trimmed]) childrenData[trimmed] = { childSign: sign };
              }
            });
          }
        }
      });

      // 2. Fetch children metadata + client values in bulk
      const [globalChildren, clientChildren] = await Promise.all([
        GlobalElements.find({ parentId: { $in: childrenIds } }),
        Arborescence.find({ parentId: { $in: childrenIds }, clientId: req.dbUser._id })
      ]);

      const gMap = new Map(globalChildren.map(g => [g.parentId, g]));
      const cMap = new Map(clientChildren.map(c => [c.parentId, c]));

      childrenIds.forEach(childId => {
        const gNode = gMap.get(childId);
        const cNode = cMap.get(childId);
        const merged = mergeNode(gNode, cNode);

        let validChildrenIds = merged.childrenIds ? merged.childrenIds.filter(id => id !== merged.parentId) : [];
        let hasChildren = validChildrenIds.length > 0;

        childrenData[childId] = {
          ...childrenData[childId],
          ...merged,
          hasChildren,
          childrenNum: validChildrenIds.length
        };
      });

    } else {
      console.log(`[nodesData] Parent ${parent.parentId} is unhandled category. Category: ${parent.category}, eleType: ${parent.eleType}`);
    }

    parent.childrenIds = childrenIds; // override so frontend knows the exact number of separated children

    const response = {
      ...parent,
      childrenData: childrenData,
      chidrenNum: parent.childrenIds ? parent.childrenIds.length : 0,
    };
    
    console.log(`[nodesData] Returning ${childrenIds.length} children for ${parent.parentId}.`);

    res.status(200).json({ success: true, message: 'Diagram data retrieved', node: response, found: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
