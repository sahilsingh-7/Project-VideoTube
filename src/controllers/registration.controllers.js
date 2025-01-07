import asyncHandler from "../util/asyncHandler.js";
import {ApiResponse} from '../util/ApiResponse.js';
import {ApiError} from '../util/ApiError.js';
import {uploadOnCloudinary,deleteOnCloudinary} from '../util/cloudinary.js'
import {upload} from '../middleware/multer.middlewares.js'
import {User} from '../models/user.model.js';
import mongoose from 'mongoose'



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

export default registerUser;