import asyncHandler from '../util/asyncHandler.js'
import {ApiResponse} from '../util/ApiResponse.js'

const healthCheck = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,'Ok','health check passed'));
})

export default healthCheck