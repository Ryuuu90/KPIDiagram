const Arborescence = require('../models/Arborescence2.model');
const {ArborescenceCalcul} = require("../utils/utils");

exports.getNodeById2 = async (req, res) => {
  const { id } = req.params;

  try {
    // Get parent node
    const parent = await Arborescence.findOne({ parentId: id });
    // if (!parent) {
    //   return res.status(202).json({ success: true, message: 'Parent node not found', found : false });
    // }

    // Get children nodes where parentId == id

    const childrenData = {};
    // console.log(parent);
    
    // const entries = Object.entries(parent.childrenIds);
    
    // childrenData = {};
    const childrenIds = [];
    if(parent.category === 'Elément calculé' || parent.eleType === 'Rasio' || parent.eleType === 'Source' )
    {
      parent.childrenIds.forEach((ele)=>{
        // if(childrenData[])
        let splited = ele.split(/[  ]/).filter(id => id.trim() !== '');
        // console.log(splited);
        let childId;
        let sign;
        if(splited[0] != '-' && splited[0] != '+')
          {
            childId = splited[0];
            sign = '+';
            
          }
          else
          {
            childId = splited[1];
            sign = splited[0];
          }
          childrenIds.push(childId);
          // console.log(childId);
          if(!childrenData[childId])
            {
              childrenData[childId] = {
                childSign : sign,
                
              }
            }
            
        })
      }
    // console.log(childrenIds);

    await Promise.all(
      childrenIds.map(async (childId) => {
        const chil = await Arborescence.findOne({ parentId: childId });
        let hasChildren = false;
        if(chil.category === "Elément calculé" || chil.eleType === 'Rasio'  || chil.eleType === 'Source' )
            hasChildren = true;
        let childrenNum = chil.childrenIds.length;
        childrenData[childId] = {
          ...childrenData[childId],
          ...chil.toObject(),
          hasChildren,
          childrenNum, // true if found
        };
      })
    );
    // ArborescenceCalcul()

        
          // await Promise.all(
            //   entries.map(async ([childId, childLabel]) => {
              //     const chil = await Arborescence.findOne({ parentId: childId });
    //     let childrenNum = 0;
    //     if(!!chil)
    //         childrenNum = Object.entries(chil.childrenData).length;

    //     childrenData[childId] = {
            
    //       label: childLabel,
    //       hasChildren: !!chil,
    //       childrenNum, // true if found
    //     };
    //   })
    // );
    
    // Now childrenData is fully populated
    const response = {
      ...parent.toObject(),
      childrenData: childrenData,
      chidrenNum : parent.childrenIds.length,
    };
    
    // console.log(response);

    res.status(200).json({success : true , message : 'diagram data downloaded', node : response, found : true});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
