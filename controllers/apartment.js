const Apartment = require('../models/apartment.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verify-token.js');
const authorizeRole = require('../middleware/authorize-role.js');

const upload = require('../config/multer')
const cloudinary = require('../config/cloudinary');
const e = require('cors');

//-----------------Apartment(CRUD)----------------//

// index page (get all apartments)
router.get('/', async (req, res) => {
  
    try {
        const foundApartment = await Apartment.find();
        res.status(200).json(foundApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});
router.post('/', verifyToken, authorizeRole('Owner'), upload.array('ApartmentImg'), async (req, res) => {
    try {
        req.body.BookingCalendar = [];

        req.body.ApartmentImg = [];
        const ApartmenImages = req.files;

        ApartmenImages.forEach(file => {
           req.body.ApartmentImg.push({
           url: file.path,
           cloudinary_id: file.filename
           });
        });
        
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);
        

        const files = req.files;
        console.log(files);                             

        const images = files.map(file => ({
          url: file.path,
          cloudinary_id: file.filename 
        }));
        console.log(images);

        const createdApartment = await Apartment.create({
          ApartmentName: req.body.ApartmentName,
          ApartmentPrice: req.body.ApartmentPrice,
          ApartmentDescription: req.body.ApartmentDescription,
          ApartmentCity: req.body.ApartmentCity,

          ApartmentOffering: req.body.ApartmentOffering,

          ApartmentImg: images, 

          OwnerId: req.user._id,
        });
        console.log(createdApartment);

        res.status(201).json(createdApartment);
    } catch (err) {
        console.error("🔥 REAL SERVER ERROR:", JSON.stringify(err, null, 2));
        res.status(500).json({ err: err.message, stack: err.stack });
    }
});

//delete apartment
router.delete('/apartment/:apartmentId', verifyToken, authorizeRole('Owner'), async (req, res) => {
  
    try {
        
        const foundApartment = await Apartment.findById(req.params.apartmentId);
        
        if (!foundApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }

        if (foundApartment.OwnerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this apartment.');
        }

        
        for (const img of foundApartment.ApartmentImg) {
          if (img.cloudinary_id) {
            await cloudinary.uploader.destroy(img.cloudinary_id);
          }
        }

        await foundApartment.deleteOne();
        
        res.status(200).json(foundApartment);
    
    } catch (err) {
        
        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } 
        else {
            res.status(500).json({ err: err.message });
        }
    }
});

//update apartment
router.put('/apartment/:apartmentId', verifyToken, authorizeRole('Owner'), upload.array('ApartmentImg'), async (req, res) => {
  try {

        const foundApartment = await Apartment.findById(req.params.apartmentId);

        if (!foundApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }

        if (foundApartment.OwnerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this apartment.');
        }

        // Check if new images are uploaded
        if (req.files && req.files.length > 0) {
        
            // Delete old images from Cloudinary
            for (const img of foundApartment.ApartmentImg) {
                if (img.cloudinary_id) {
                await cloudinary.uploader.destroy(img.cloudinary_id);
                }
            }

            // Update ApartmentImg array with new images
            foundApartment.ApartmentImg = req.files.map(file => ({
                url: file.path,
                cloudinary_id: file.filename,
            }));
            
        } //else {
          //  // If no new images are uploaded, retain existing images
          //  foundApartment.ApartmentImg = foundApartment.ApartmentImg.map((img, index) => ({
          //      url: req.body[`ApartmentImg${index + 1}`], // Use existing URL from hidden input
          //      cloudinary_id: img.cloudinary_id // Keep existing Cloudinary ID
          //  }));
          //}

        // Update other fields from req.body
        foundApartment.ApartmentName = req.body.ApartmentName;
        foundApartment.ApartmentPrice = req.body.ApartmentPrice; 
        foundApartment.ApartmentDescription = req.body.ApartmentDescription; 
        foundApartment.ApartmentOffering = req.body.ApartmentOffering;
        foundApartment.ApartmentCity = req.body.ApartmentCity;

        // Save the updated item
        const updatedApartment = await foundApartment.save();
        res.status(200).json(updatedApartment);
  
    } catch (err) {

        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } else {
            res.status(500).json({ err: err.message });
        }
  }
});


//-------------Id routes-----------//

// show apartment detail page
router.get('/apartment/:apartmentId', async (req, res) => {
  
    try {
        
        const foundApartment = await Apartment.findById(req.params.apartmentId);
        
        if (!foundApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }

        res.status(200).json(foundApartment);
    
    } catch (err) {
        
        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } 
        else {
            res.status(500).json({ err: err.message });
        }
    }
});
router.get("/owner/:ownerId", verifyToken, async (req, res) => {
  const apartments = await Apartment.find({ ownerId: req.params.ownerId });
  res.json(apartments);
});

// show city page
router.get('/city/:city', async (req, res) => {
  try {

    
    const cityApartments = await Apartment.find({ ApartmentCity: req.params.city });

    // this will not happend because in the front end there will be no link if the city 
    // has no apartment (added for extra control)
    if (!cityApartments || cityApartments.length === 0) {
      return res.status(404).json({ message: `No apartments found in ${city}` });
    }

    res.status(200).json(cityApartments);
    
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});



//-----------------Booking routes---------------------//

// Useapartmet model

router.get('/apartment/:apartmentId/bookedDates', async (req, res)=> {
try {
const apartment = await Apartment.findById(req.params.apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
const bookedDates = apartment.BookingCalendar.map((b) => ({
    start:b.startDate,
    end: b.endDate, 
    
}));
res.json(bookedDates)
}
catch (err) {
    res.status(500).json({message: err.message})
}
})
router.post("/booking",verifyToken, async (req,res) => {
try{
const {apartmentId, startDate, endDate, totalPrice} = req.body;
if (!apartmentId || !startDate || !endDate){
    return res.status(400).json({message: "Missing booking info"})
}
const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ message: "Apartment not found" });
    const sDate = new Date(startDate);
    const eDate = new Date(endDate)
    const overlap = apartment.BookingCalendar.some((booking) => {
  return sDate < booking.endDate && eDate > booking.startDate;
});
    if (overlap) return res.status(400).json({message: "This date range is already booked"})
     const newBooking = {
  userId: req.user._id,
  startDate: sDate,
  endDate: eDate,
  totalPrice
};
    apartment.BookingCalendar.push(newBooking);
const updatedApartment = await apartment.save();

const addedBooking = updatedApartment.BookingCalendar[updatedApartment.BookingCalendar.length - 1];
res.status(201).json(addedBooking);
}
 
catch (err) {
    res.status(500).json({message: err.message})
}
});
router.get("/userBookings/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        if (req.user._id.toString() !== userId && req.user.role !== "Owner") {
            return res.status(403).json({ message: "Not authorized to view these bookings" });
        }
     const apartments = await Apartment.find({
      'BookingCalendar.userId': userId,
    });
        const userBookings = [];
    apartments.forEach((apt) => {
      apt.BookingCalendar.forEach((booking) => {
        if (booking.userId.toString() === userId) {
          userBookings.push({
            ...booking.toObject(),
            apartmentId: apt._id,
            apartmentName: apt.ApartmentName,
          });
        }
      });
    });

    res.status(200).json(userBookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});
router.get("/apartmentBookings/:apartmentId", verifyToken, async (req, res) => {
  try {
    const apartmentId = req.params.apartmentId;
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment)
      return res.status(404).json({ message: "Apartment not found" });
    if (apartment.OwnerId.toString() !== req.user._id && req.user.role !== "Owner") {
      return res.status(403).json({ message: "Not authorized to view these bookings" });
    }
    res.status(200).json(apartment.BookingCalendar);

    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});




/*
router.delete('/:bookingId',verifyToken, async (req,res) => {
    try{
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({message:"booking not found"})
    const listing = await Apartment.findById(booking.listingId)
    const bookingUserId = booking.userId?.toString();
    const requesterId = req.user._id?.toString();
    const listingOwnerId = listing?.OwnerId?.toString();

     const isBookingOwner = bookingUserId === requesterId;
    const isListingOwner = listingOwnerId && listingOwnerId === requesterId;
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    if (!isBookingOwner && !isListingOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    } 
    await booking.deleteOne();
    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})
*/

//-----------------Listings routes--------------------//

module.exports = router;
