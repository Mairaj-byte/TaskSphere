const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true,
        trim:true
    },

    description:{
        type:String,
        default:""
    },

    members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    isActive:{
        type:Boolean,
        default:true
    }

},
{
    timestamps:true
});

module.exports=mongoose.model("Group",groupSchema);