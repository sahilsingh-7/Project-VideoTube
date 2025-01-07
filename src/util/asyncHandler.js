const asyncHandler = (requestHandler)=>{
    return async(res,req,next)=>{
        try {
            await requestHandler(req,res,next);
        } catch (error) {
            next(error);
        }
    }
}

export default asyncHandler;