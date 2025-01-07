import mongoose,{Schema} from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username:{
            type: String,
            required:true,
            unique:true,
            index:true,
            trim:true,
            lowercase:true
        },
        email:{
            type: String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(this.password,password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id :this._id,
        username :this.username,
        email : this.email 
      },
    process.env.ACCESSTOKEN_SECRET,
    { expiresIn: process.env.ACCESSTOKEN_EXPIRY});
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESHTOKEN_SECRET,
    {expiresIn: process.env.REFRESHTOKEN_EXPIRY});
}




export const User = mongoose.model("User",userSchema);