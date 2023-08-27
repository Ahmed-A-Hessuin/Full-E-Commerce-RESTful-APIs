const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');

const factory = require('./handlersFactory')
const ApiError = require('../utils/apiError');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware')
const createToken = require('../utils/createToken')

const User = require('../models/userModel');


//Upload single image
exports.uploadUserImage = uploadSingleImage("profileImg")

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    const filename = `User-${uuidv4()}-${Date.now()}.jpeg`
    if (req.file) {
        await sharp(req.file.buffer)
            .resize(600, 600)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/users/${filename}`)
        //save image into db    
        req.body.profileImg = filename;
    }

    next()
})

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private
exports.getUsers = factory.getAll(User)

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = factory.getOne(User)

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private
exports.createUser = factory.createOne(User)

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            slug: req.body.slug,
            email: req.body.email,
            phone: req.body.phone,
            profileImg: req.body.profileImg,
            role: req.body.role
        },
        { new: true }
    );
    if (!document) {
        return next(new ApiError(`No document for this id ${req.params.id}`, 404));
    }
    res.status(200).json({ data: document });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndUpdate(
        req.params.id,
        {
            password: await bcrypt.hash(req.body.password, 12),
            passwordChangedAt: Date.now()
        },
        { new: true }
    );
    if (!document) {
        return next(new ApiError(`No document for this id ${req.params.id}`, 404));
    }
    res.status(200).json({ data: document });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteUser = factory.deleteOne(User)

// @desc    Get logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/protected
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
    req.params.id = req.user._id;
    next();
})


// @desc    Update logged user password
// @route   Put /api/v1/users/updasteMyPassword
// @access  Private/protected
exports.updateloggedUserPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            password: await bcrypt.hash(req.body.password, 12),
            passwordChangedAt: Date.now()
        },
        { new: true }
    );
    // Generate token
    const token = createToken(user._id)
    res.status(200).json({ data: user, token })
});

// @desc    Update logged user Data (without password , password)
// @route   Put /api/v1/users/updateMe
// @access  Private/protected
exports.updateloggedUserData = asyncHandler(async (req, res, next) => {

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone
        },
        { new: true });
    res.status(201).json({ data: user });
})

// @desc    deactivate logged User
// @route   Delete /api/v1/users/deleteMe
// @access  Private/protected
exports.deleteloggedUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, {
        active: false
    })
    res.status(204).json({ status: "Success" })

})
