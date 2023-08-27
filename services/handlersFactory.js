const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const document = await Model.findByIdAndDelete(req.params.id);
        if (!document) {
            return next(new ApiError(`No document for this id ${req.params.id}`, 404));
        }
        res.status(204).send();
    })

exports.updateOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const document = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!document) {
            return next(new ApiError(`No document for this id ${req.params.id}`, 404));
        }
        res.status(200).json({ data: document });
    });

exports.createOne = (Model) =>
    asyncHandler(async (req, res) => {
        const newDoc = await Model.create(req.body);
        res.status(201).json({ Data: newDoc });
    });

exports.getOne = (Model) =>
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const document = await Model.findById(id);
        if (!document) {
            return next(new ApiError(`No document for this id ${id}`, 404));
        }
        res.status(200).json({ data: document });
    });

exports.getAll = (Model, modelName = '') =>
    asyncHandler(async (req, res) => {
        let filter = {}
        if (req.filterObj) {
            filter = req.filterObj
        }

        // Build Query
        const countDocuments = await Model.countDocuments()
        const apiFeatures = new ApiFeatures(req.query, Model.find(filter))
            .paginate(countDocuments)
            .filter()
            .sort()
            .limitFields()
            .search(modelName)

        // Execute Query
        const { paginationResult, mongooseQuery } = apiFeatures
        const documents = await mongooseQuery
        res.status(200).json({ results: documents.length, paginationResult, Data: documents });
    });

