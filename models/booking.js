const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref:'User',
    },
    listingId : {
        type:mongoose.Schema.Types.ObjectId, 
        ref:'Apartment', 
    },
    startDate : {
        type:Date ,
        required:true
    },
    endDate: {
        type:Date ,
        required:true
    },
    totalPrice: {
        type:Number, 
        required:true
    },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;