import citizensModel from "./citizens-model.js";

export const generateCitizensHierarchy = async (req, res) => {
    const {hierarchyChain} = req.body;

    try {
        let hierarchy = await citizensModel.generateCitizensHierarchy(hierarchyChain);
        res.send(hierarchy);
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
};

export const getUniqueTypes = async (req, res) => {
    try {
        let types = await citizensModel.getUniqueTypes();
        res.send(types);
    } catch (e) {
        res.sendStatus(500)
    }
};
