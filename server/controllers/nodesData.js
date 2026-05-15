const Arborescence = require('../models/Arborescence2.model');
const GlobalElements = require('../models/GlobalElements.model');
const {ArborescenceCalcul} = require("../utils/utils");

exports.getNodeById = async (req, res) => {
  const { id } = req.params;
  const {modulType, basesRef, expandedNodes} = req.body;

  try {
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
    const childrenIds = [];

    if (parent.category === 'Elément calculé' || parent.eleType === 'Ratio' || parent.eleType === 'Source') {
      parent.childrenIds.forEach((ele) => {
        let splited = ele.split(/[  ]/).filter(id => id.trim() !== '');
        let childId = splited.length > 1 ? splited[1] : splited[0];
        let sign = splited.length > 1 ? splited[0] : '+';

        childrenIds.push(childId);
        if (!childrenData[childId]) {
          childrenData[childId] = { childSign: sign };
        }
      });
    }

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

      let hasChildren = false;
      if (merged.category === "Elément calculé" || merged.eleType === 'Ratio' || merged.eleType === 'Source') {
        hasChildren = true;
      }

      childrenData[childId] = {
        ...childrenData[childId],
        ...merged,
        hasChildren,
        childrenNum: merged.childrenIds ? merged.childrenIds.length : 0
      };
    });

    const response = {
      ...parent,
      childrenData: childrenData,
      chidrenNum: parent.childrenIds ? parent.childrenIds.length : 0,
    };

    res.status(200).json({ success: true, message: 'Diagram data retrieved', node: response, found: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
