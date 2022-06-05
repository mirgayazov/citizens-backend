import citizensModel from "./citizens-model.js";

export const generateCitizensHierarchy = (req, res) => {
    const {hierarchyChain} = req.body;

    citizensModel.generateCitizensHierarchy()
    testsModel.generateTest(topicId, (err, data) => {
        if (err) {
            return res.json(err);
        }

        return res.json({
            test: data,
            statusCode: 200
        })
    })
};
