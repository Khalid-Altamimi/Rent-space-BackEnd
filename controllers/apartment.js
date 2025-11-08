const Apartment = require('../models/apartment.js');
const express = require('express');
const router = express.Router();

const authorizeRole = require('../middleware/authorize-role.js');

const upload = require('../config/multer')
const cloudinary = require('../config/cloudinary')

// basic code for apartments


//handel the booking calander
router.post('/', authorizeRole('Owner'), upload.array('ApartmentImg'), async (req, res) => {
    try {

        req.body.ApartmentImg = []; 
        const ApartmenImages = req.files;
        
        /* we take the images from the form and store them in ApartmenImages
        then we push each image in the array and give it (url, image link string) 
        and (_id, image cloud storage) */
        ApartmenImages.forEach(file => {
            req.body.ApartmentImg.push({
            url: file.path,
            cloudinary_id: file.filename
            });
        }); 
        
        const createdApartment = await Apartment.create(req.body);
        res.status(201).json(createdApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// works fine for now
router.get('/', async (req, res) => {
  
    try {
        const foundApartment = await Apartment.find();
        res.status(200).json(foundApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// works fine for now
router.get('/:apartmentId', async (req, res) => {
  
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

// works fine for now
router.delete('/:apartmentId', authorizeRole('Owner'), async (req, res) => {
  
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

// works fine for now
router.put('/:apartmentId', authorizeRole('Owner'), async (req, res) => {
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

        const updatedApartment = await Apartment.findByIdAndUpdate(req.params.apartmentId, req.body, { new: true, runValidators: true } );
        
        res.status(200).json(updatedApartment);
  
    } catch (err) {

        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } else {
            res.status(500).json({ err: err.message });
        }
  }
});

module.exports = router;