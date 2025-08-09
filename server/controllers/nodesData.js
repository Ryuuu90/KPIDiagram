const Arborescence = require('../models/Arborescence.model');

exports.getNodeById = async (req, res) => {
  const { id } = req.params;

  try {
    // Get parent node
    const parent = await Arborescence.findOne({ parentId: id });
    // if (!parent) {
    //   return res.status(202).json({ success: true, message: 'Parent node not found', found : false });
    // }

    // Get children nodes where parentId == id

    const childrenData = {};

    const entries = Object.entries(parent.childrenData || {});
    
    await Promise.all(
      entries.map(async ([childId, childLabel]) => {
        const chil = await Arborescence.findOne({ parentId: childId });
        let childrenNum = 0;
        if(!!chil)
            childrenNum = Object.entries(chil.childrenData).length;

        childrenData[childId] = {
            
          label: childLabel,
          hasChildren: !!chil,
          childrenNum, // true if found
        };
      })
    );
    
    // Now childrenData is fully populated
    const response = {
      parentId: parent.parentId,
      parentName: parent.parentName,
      level: parent.level,
      childrenData: childrenData,
      reportName : parent.reportName,
    };
    
    // console.log(response);

    res.status(200).json({success : true , message : 'diagram data downloaded', node : response, found : true});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
