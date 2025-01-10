import asyncHandler from "../util/asyncHandler.js";
import {ApiResponse} from '../util/ApiResponse.js';
import {ApiError} from '../util/ApiError.js';
import {uploadOnCloudinary,deleteOnCloudinary} from '../util/cloudinary.js'
import {upload} from '../middleware/multer.middlewares.js'
import {User} from '../models/user.model.js';
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshToken = async(userID)=>{
    try {
        const user = await User.findById(userID);
        if(!user) throw new ApiError(400,'user not found');
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(400,'cant generate access token and refresh token');
    }
}

const registerUser = asyncHandler(async (req,res)=>{

        console.log(upload);
        const {fullname,username,email,password}=req.body

        if([fullname,username,email,password].some((field)=>field?.trim() ==='')) throw new ApiError(400,'All fields are required');
        

        const ExistUser = await User.findOne({
            $or:[{username},{email}]
        })

        if(ExistUser) throw new ApiError(409,'user with username or email already exists');

        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverLocalPath = req.files?.coverImage?.[0]?.path;

        if(! avatarLocalPath) throw new ApiError(400,'avatar file is missing');

        let avatar;
        try {
            avatar = await uploadOnCloudinary(avatarLocalPath);
            console.log('avatar uploaded successfully',avatar);
            
        } catch (error) {
            console.log('error in uploading avatar',error);
            throw new ApiError(500,'failed to upload avatar');
        }


        let coverImage;
        try {
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log('coverImage uploaded successfully',coverImage);
            
        } catch (error) {
            console.log('error in uploading coverImage',error);
            throw new ApiError(500,'failed to upload coverImage');
        }
        let user;
        try {
            user = await User.create({
                fullname,
                avatar:avatar.url,
                coverImage:coverImage?.url||"",
                username:username.toLowerCase(),
                email,
                password
            })
            console.log(typeof user);
            
        } catch (error) {
            console.log('user creation is failed',error);
            if(avatar) await deleteOnCloudinary(avatar.public_id);
            if(coverImage) await deleteOnCloudinary(coverImage.public_id);

            throw new ApiError(500,'Something went wrong while registering a user and images were deleted');
        }
        console.log(user);
        

        const createdUser = await User.findById(user.id).select(
            '-password -refreshToken' 
        );

        if(!createdUser) throw new ApiError(500,'Something went wrong while registering the user');

        return res.status(200).json(new ApiResponse(200,'user registered successfully'));

    
})

const loginUser = asyncHandler(async(req,res)=>{
    const {username,password} = req.body

    if(!username && !password) throw new ApiError(400,'username and password is required for login');
    const user = await User.findOne({
        $or:[{username}]
    })

    if(!user) throw new ApiError(400,'user not found in loggedin users');

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) throw new ApiError(400,'invalid credentials');


    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const option = {
        httpOnly: true,
        secure : process.env.NODE_ENV === 'production'
    }

    return res
           .status(200)
           .cookie('access token',accessToken,option)
           .cookie('refresh token', refreshToken,option)
           .json(new ApiResponse(200,{user: loggedInUser,accessToken,refreshToken},'user logged in successfully'));

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || res.body.refreshToken /*this part is helpfull to extract refresh token from mobile*/;
    if(!incomingRefreshToken) throw new ApiError(400,'Incoming Refresh Token not found');

try {
    const decodeToken = await jwt.verify(incomingRefreshToken,process.env.REFRESHTOKEN_SECRET);

    if(!decodeToken) throw new ApiError(400,'decoding failed');

    const user = await User.findById(decodeToken?._id);
    if(!user) throw new ApiError(400,'invalid refresh token');
    
    if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(400,'invalid refresh token or refresh token might be expired');

    const {accessToken,refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user?._id);

    user.refreshToken = newRefreshToken;
    await user.save({validateBeforeSave:false});

    const option = {
        httpOnly:true,
        secure:process.env.NODE_ENV==='production'
        // sameSite: 'Strict', // Prevents cross-site requests

    }
    return res.status(200)
              .cookie('accessToken',accessToken,option)
              .cookie('refreshToken',newRefreshToken,option)
              .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},'Access Token refreshed Successfully') )
    

} catch (error) {
    throw new ApiError(500,'something went wrong while refreshing access token ');
}

})

export {
    registerUser,loginUser,refreshAccessToken
} ;