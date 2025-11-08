const mongoose = require('mongoose');

//-----------------------------------------------Embeded
const imagesSchema = new mongoose.Schema({
  url: { type: String},
  cloudinary_id: { type: String},
});

const bookingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref:'User',
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
  },  
    { timestamps: true 

});

//-----------------------------------------------Model
const apartmentSchema = new mongoose.Schema({
  ApartmentName: {
    type: String,
    required: true,
  },
  ApartmentPrice: {
    type: Number,
    required: true,
  },
  ApartmentDescription: {
    type: String,
    required: true,
  },
  ApartmentOffering: {
    type: [String],
    enum: ['Hair dryer', 'TV', 'Air conditioning', 
            'Smoke alarm', 'Fire extinguisher',
            'First aid kit', 'Wifi', 'Kitchen',
            'Fire pit', 'Outdoor dining area',
            'BBQ grill', 'Free parking on premises',
            'Pets allowed', 'Smoking allowed', 'Self check-in',
            'Smart lock', 'Exterior security cameras on property',
            'Washer', 'Dryer', 'Essentials', 'Carbon monoxide alarm',
            'Heating', 'Hot water'],
  },

  ApartmentImg: [imagesSchema], //Embeded

  ApartmentCity: { // more cites can be added
    type: String,
    required: true,
    enum: [
      'Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Aali',
      'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs', 'Al-Malikiya',
      'Adliya', 'Juffair', 'Seef', 'Diplomatic Area', 'Amwaj Islands',
      'Durrat Al Bahrain', 'Sanabis', 'Tubli', 'Zallaq', 'Barbar'
    ]
    },

  ApartmentRating: {
    type: Number,
    default: 3, 
  },

  BookingCalendar: [bookingSchema], //Embeded
  
  OwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;